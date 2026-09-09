/**
 * Review controller. Customers post a review for their own COMPLETED booking
 * (enforced in the service). Listing a vehicle's visible reviews is public;
 * moderation (hide/feature) is staff-only.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const reviewService = require('../services/review.service');

const create = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview({
    customerId: req.user._id,
    bookingId: req.body.bookingId,
    rating: req.body.rating,
    review: req.body.review,
  });
  return sendCreated(res, review, { message: 'Thanks for your review!' });
});

const listForVehicle = asyncHandler(async (req, res) => {
  const [reviews, rating] = await Promise.all([
    reviewService.listForVehicle(req.params.vehicleId, { includeHidden: false }),
    reviewService.getVehicleRating(req.params.vehicleId),
  ]);
  return sendSuccess(res, { rating, reviews });
});

const setVisibility = asyncHandler(async (req, res) => {
  const review = await reviewService.setVisibility(req.params.id, req.body.status);
  return sendSuccess(res, review, { message: 'Review visibility updated' });
});

const setFeatured = asyncHandler(async (req, res) => {
  const review = await reviewService.setFeatured(req.params.id, req.body.featured);
  return sendSuccess(res, review, { message: 'Review updated' });
});

module.exports = { create, listForVehicle, setVisibility, setFeatured };
