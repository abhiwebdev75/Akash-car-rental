/**
 * Rental agreement service — generates a digital rental agreement PDF from a
 * booking, stores an immutable snapshot of the terms, and persists a
 * RentalAgreement record (one per booking). The PDF is built in-memory with
 * PDFKit and stored via the upload abstraction (Cloudinary or a stub).
 */
const RentalAgreement = require('../models/RentalAgreement');
const Booking = require('../models/Booking');
const Settings = require('../models/Settings');
const uploadService = require('./upload.service');
const bookingNumberService = require('./bookingNumber.service');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const { rentalDays } = require('../utils/dates');

/** Build the immutable snapshot embedded in the agreement. */
function buildSnapshot({ booking, settings }) {
  const vehicle = booking.vehicleId;
  const customer = booking.customerId;
  const location = booking.locationId;
  return {
    business: {
      name: settings.businessName,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      currency: settings.currency,
    },
    customer: customer && {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    vehicle: vehicle && {
      title: [vehicle.brand, vehicle.model, vehicle.variant].filter(Boolean).join(' '),
      registrationNumber: vehicle.registrationNumber,
      vehicleType: vehicle.vehicleType,
    },
    location: location && { name: location.name, city: location.city, code: location.code },
    booking: {
      bookingNumber: booking.bookingNumber,
      pickupDate: booking.pickupDate,
      returnDate: booking.returnDate,
      pickupTime: booking.pickupTime,
      returnTime: booking.returnTime,
      days: booking.pricingBreakdown?.days || rentalDays(booking.startAt, booking.endAt),
    },
    pricing: {
      base: booking.pricingBreakdown?.base,
      addOnsTotal: booking.pricingBreakdown?.addOnsTotal,
      subtotal: booking.pricingBreakdown?.subtotal,
      discount: booking.discount,
      tax: booking.tax,
      taxRate: booking.taxRate,
      securityDeposit: booking.securityDeposit,
      totalAmount: booking.totalAmount,
    },
    policies: settings.policies,
    generatedAt: new Date(),
  };
}

/** Render the snapshot to a PDF buffer using PDFKit. */
function renderPdf(agreementNumber, snapshot) {
  // Lazy-require so the module can be imported in environments without pdfkit.
  // eslint-disable-next-line global-require
  const PDFDocument = require('pdfkit');
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const money = (n) => `${snapshot.business.currency} ${Number(n || 0).toFixed(2)}`;
      const line = (label, value) => {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.font('Helvetica').text(value == null ? '-' : String(value));
      };

      // Header
      doc.font('Helvetica-Bold').fontSize(18).text(snapshot.business.name, { align: 'center' });
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(10).text('VEHICLE RENTAL AGREEMENT', { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(9).fillColor('#555')
        .text(`Agreement No: ${agreementNumber}   |   Booking No: ${snapshot.booking.bookingNumber}`, {
          align: 'center',
        });
      doc.fillColor('#000');
      doc.moveDown(1);

      // Parties
      doc.fontSize(12).font('Helvetica-Bold').text('1. Parties');
      doc.fontSize(10).font('Helvetica');
      line('Lessor', `${snapshot.business.name}  (${snapshot.business.phone || 'n/a'})`);
      if (snapshot.customer) {
        line('Lessee', `${snapshot.customer.name}  (${snapshot.customer.phone || snapshot.customer.email || 'n/a'})`);
      }
      doc.moveDown(0.8);

      // Vehicle
      doc.fontSize(12).font('Helvetica-Bold').text('2. Vehicle');
      doc.fontSize(10).font('Helvetica');
      if (snapshot.vehicle) {
        line('Vehicle', snapshot.vehicle.title);
        line('Registration', snapshot.vehicle.registrationNumber);
        line('Type', snapshot.vehicle.vehicleType);
      }
      if (snapshot.location) line('Pickup Location', `${snapshot.location.name}, ${snapshot.location.city}`);
      doc.moveDown(0.8);

      // Rental period
      doc.fontSize(12).font('Helvetica-Bold').text('3. Rental Period');
      doc.fontSize(10).font('Helvetica');
      const d = snapshot.booking;
      line('Pickup', `${new Date(d.pickupDate).toDateString()} ${d.pickupTime || ''}`);
      line('Return', `${new Date(d.returnDate).toDateString()} ${d.returnTime || ''}`);
      line('Duration', `${d.days} day(s)`);
      doc.moveDown(0.8);

      // Charges
      doc.fontSize(12).font('Helvetica-Bold').text('4. Charges');
      doc.fontSize(10).font('Helvetica');
      const p = snapshot.pricing;
      line('Base rental', money(p.base));
      line('Add-ons', money(p.addOnsTotal));
      line('Subtotal', money(p.subtotal));
      line('Discount', `- ${money(p.discount)}`);
      line('Tax', `${money(p.tax)} (${Math.round((p.taxRate || 0) * 100)}%)`);
      line('Security deposit (refundable)', money(p.securityDeposit));
      doc.font('Helvetica-Bold');
      line('Total payable', money(p.totalAmount));
      doc.font('Helvetica');
      doc.moveDown(0.8);

      // Terms
      doc.fontSize(12).font('Helvetica-Bold').text('5. Terms & Conditions');
      doc.fontSize(9).font('Helvetica').fillColor('#333');
      const terms = snapshot.policies?.terms || 'Standard rental terms apply.';
      doc.text(terms, { align: 'justify' });
      if (snapshot.policies?.fuel) doc.moveDown(0.3).text(`Fuel: ${snapshot.policies.fuel}`);
      if (snapshot.policies?.cancellation) doc.moveDown(0.3).text(`Cancellation: ${snapshot.policies.cancellation}`);
      doc.fillColor('#000');
      doc.moveDown(2);

      // Signatures
      const y = doc.y;
      doc.font('Helvetica').fontSize(10);
      doc.text('_______________________', 50, y);
      doc.text('_______________________', 330, y);
      doc.text('Lessee Signature', 50, y + 15);
      doc.text('For ' + snapshot.business.name, 330, y + 15);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate (or return existing) rental agreement for a booking.
 * @param {string} bookingId
 * @param {object} [opts]
 * @param {boolean} [opts.regenerate] force a new PDF even if one exists
 * @param {string} [opts.generatedBy]
 */
async function generateForBooking(bookingId, { regenerate = false, generatedBy } = {}) {
  const existing = await RentalAgreement.findOne({ bookingId });
  if (existing && !regenerate) return existing;

  const booking = await Booking.findById(bookingId)
    .populate('vehicleId', 'brand model variant registrationNumber vehicleType')
    .populate('customerId', 'name email phone')
    .populate('locationId', 'name city code');
  if (!booking) throw ApiError.notFound('Booking not found');

  const settings = await Settings.getSettings();
  const snapshot = buildSnapshot({ booking, settings });

  const agreementNumber = existing
    ? existing.agreementNumber
    : await bookingNumberService.nextAgreementNumber(new Date());

  let pdf = { url: undefined, publicId: undefined };
  try {
    const buffer = await renderPdf(agreementNumber, snapshot);
    pdf = await uploadService.uploadBuffer(buffer, {
      folder: 'agreements',
      resourceType: 'raw',
      filename: `${agreementNumber}.pdf`,
    });
  } catch (err) {
    // PDF generation/upload failure must not block issuing the agreement record;
    // it can be regenerated. Log and continue with an empty pdf ref.
    logger.warn({ err, bookingId }, '[agreement] PDF generation/upload failed');
  }

  let agreement;
  if (existing) {
    existing.snapshot = snapshot;
    existing.pdf = pdf;
    existing.generatedBy = generatedBy;
    existing.generatedAt = new Date();
    agreement = await existing.save();
  } else {
    agreement = await RentalAgreement.create({
      bookingId,
      agreementNumber,
      snapshot,
      pdf,
      generatedBy,
    });
  }

  notificationService.onAgreementGenerated(booking).catch(() => {});
  return agreement;
}

/** Mark an agreement as signed by the customer. */
async function markSigned(bookingId) {
  const agreement = await RentalAgreement.findOne({ bookingId });
  if (!agreement) throw ApiError.notFound('Agreement not found');
  agreement.customerSigned = true;
  agreement.signedAt = new Date();
  return agreement.save();
}

async function getByBooking(bookingId) {
  return RentalAgreement.findOne({ bookingId });
}

module.exports = { generateForBooking, markSigned, getByBooking, buildSnapshot, renderPdf };
