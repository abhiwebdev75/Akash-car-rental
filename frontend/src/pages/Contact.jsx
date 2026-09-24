import { useState } from 'react';

import {
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Send,
} from 'lucide-react';

import { PageHero } from '../components/PageHero';
import {
  Button,
  Input,
  Textarea,
  Card,
  CardBody,
} from '../components/ui';

import { useSettings } from '../features/settings/hooks';
import { useLocations } from '../features/locations/hooks';

const WEB3FORMS_ACCESS_KEY = 'ad01d63d-6949-46cd-8919-e4a5bc9c5a64';

function directionsUrl(loc) {
  if (loc?.geo?.lat != null && loc?.geo?.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.geo.lat},${loc.geo.lng}`;
  }

  const q = [
    loc?.name,
    loc?.address,
    loc?.city,
    loc?.state,
    loc?.pincode,
  ]
    .filter(Boolean)
    .join(', ');

  return q
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
    : null;
}

export default function Contact() {
  const { data: settings } = useSettings();
  const { data: locations } = useLocations();

  const businessName =
    settings?.businessName || 'Akash Car Rental';

  const email = settings?.email;

  // Business contact numbers from your Instagram profile
  const phone1 = '7876573193';
  const phone2 = '9816523804';

  const whatsapp = '7876573193';

  const address =
    typeof settings?.address === 'string' &&
    settings.address.trim()
      ? settings.address.trim()
      : 'Near Bhagomajra Toll Plaza, Kharar, Punjab';

  const waLink = `https://wa.me/${whatsapp}`;

  const channels = [
    {
      icon: Phone,
      label: 'Call us',
      value: phone1,
      href: `tel:${phone1}`,
    },
    {
      icon: Phone,
      label: 'Call us',
      value: phone2,
      href: `tel:${phone2}`,
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: whatsapp,
      href: waLink,
      external: true,
    },
    email && {
      icon: Mail,
      label: 'Email',
      value: email,
      href: `mailto:${email}`,
    },
  ].filter(Boolean);

  return (
    <div>
      <PageHero
        eyebrow="Contact"
        title="We’re here to help"
        subtitle={`Questions about a booking, a vehicle, or pickup? Reach ${businessName} — self-drive car rental in Kharar, serving Mohali, Chandigarh and Hamirpur (HP) — however suits you best.`}
      />

      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">

          {/* Contact details */}
          <div>
            <h2 className="font-display text-xl font-bold text-fg-strong sm:text-2xl">
              Get in touch
            </h2>

            <p className="mt-1.5 text-sm text-muted">
              Call or WhatsApp us for bookings and enquiries.
            </p>

            <div className="mt-6 space-y-3">
              {channels.map(
                ({ icon: Icon, label, value, href, external }) => (
                  <a
                    key={`${label}-${value}`}
                    href={href}
                    {...(external
                      ? {
                          target: '_blank',
                          rel: 'noopener noreferrer',
                        }
                      : {})}
                    className="flex items-center gap-4 rounded-xl border border-hair bg-card p-4 transition-colors hover:border-route/40 hover:bg-surface"
                  >
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-route/12 text-route">
                      <Icon className="h-5 w-5" />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-xs font-medium uppercase tracking-wide text-muted">
                        {label}
                      </span>

                      <span className="block truncate font-semibold text-fg-strong">
                        {value}
                      </span>
                    </span>
                  </a>
                )
              )}
            </div>

            {/* Address */}
            <div className="mt-6 rounded-xl border border-hair bg-surface p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                <MapPin className="h-4 w-4 text-route" />
                Pickup Location
              </p>

              <p className="mt-2 text-sm leading-relaxed text-fg">
                {address}
              </p>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Bhagomajra+Toll+Plaza,+Kharar,+Punjab"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-signal-700 transition-colors hover:text-signal-600 dark:text-signal-400"
              >
                <Navigation className="h-4 w-4" />
                Get directions
              </a>
            </div>
          </div>

          {/* Enquiry form */}
          <EnquiryForm
            businessName={businessName}
          />
        </div>

        {/* Branches */}
        {locations?.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-xl font-bold text-fg-strong sm:text-2xl">
              Our locations
            </h2>

            <p className="mt-1.5 text-sm text-muted">
              Pick up and drop off at any of our branches.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {locations.map((loc) => {
                const dir = directionsUrl(loc);

                return (
                  <Card key={loc._id}>
                    <CardBody>
                      <h3 className="font-semibold text-fg-strong">
                        {loc.name}
                      </h3>

                      {(loc.address || loc.city) && (
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">
                          {[
                            loc.address,
                            loc.city,
                            loc.state,
                            loc.pincode,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}

                      {loc.phone && (
                        <a
                          href={`tel:${String(loc.phone).replace(/\s+/g, '')}`}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-fg transition-colors hover:text-fg-strong"
                        >
                          <Phone className="h-3.5 w-3.5 text-route" />
                          {loc.phone}
                        </a>
                      )}

                      {dir && (
                        <a
                          href={dir}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-signal-700 transition-colors hover:text-signal-600 dark:text-signal-400"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          Get directions
                        </a>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}


function EnquiryForm({ businessName }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState('');

  const set = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    setStatus('Sending...');

    try {
      const formData = new FormData();

      formData.append(
        'access_key',
        WEB3FORMS_ACCESS_KEY
      );

      formData.append(
        'subject',
        form.subject.trim() ||
          `New enquiry - ${businessName}`
      );

      formData.append('from_name', businessName);

      formData.append('name', form.name.trim());
      formData.append('phone', form.phone.trim());
      formData.append('email', form.email.trim());
      formData.append('message', form.message.trim());

      const response = await fetch(
        'https://api.web3forms.com/submit',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        setStatus(
          'Message sent successfully! We will contact you soon.'
        );

        setForm({
          name: '',
          phone: '',
          email: '',
          subject: '',
          message: '',
        });
      } else {
        setStatus(
          'Unable to send message. Please try WhatsApp or call us.'
        );
      }
    } catch (error) {
      console.error(error);

      setStatus(
        'Something went wrong. Please try WhatsApp or call us.'
      );
    }
  };

  return (
    <Card>
      <CardBody className="sm:p-7">

        <div className="mb-5 flex items-center gap-2">
          <Send className="h-5 w-5 text-signal-600" />

          <h2 className="font-display text-lg font-semibold text-fg-strong">
            Send us a message
          </h2>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">

            <Input
              label="Your name"
              value={form.name}
              onChange={set('name')}
              required
            />

            <Input
              label="Phone number"
              value={form.phone}
              onChange={set('phone')}
              placeholder="9876543210"
              required
            />

          </div>

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
          />

          <Input
            label="Subject"
            value={form.subject}
            onChange={set('subject')}
            placeholder="Car rental enquiry"
          />

          <Textarea
            label="Message"
            required
            rows={5}
            maxLength={2000}
            value={form.message}
            onChange={set('message')}
            placeholder="Tell us about your booking requirements..."
          />

          <Button
            type="submit"
            disabled={
              !form.name.trim() ||
              !form.phone.trim() ||
              !form.message.trim() ||
              status === 'Sending...'
            }
            rightIcon={<Send className="h-4 w-4" />}
          >
            {status === 'Sending...'
              ? 'Sending...'
              : 'Send Enquiry'}
          </Button>

          {status && (
            <p
              className={[
                'text-sm font-medium',
                status.startsWith('Message sent')
                  ? 'text-route-700 dark:text-route-300'
                  : status === 'Sending...'
                    ? 'text-muted'
                    : 'text-red-600 dark:text-red-400',
              ].join(' ')}
              role="status"
              aria-live="polite"
            >
              {status}
            </p>
          )}

          <p className="text-xs leading-relaxed text-muted">
            Your enquiry will be sent securely to the
            business email configured in your Web3Forms
            account.
          </p>

        </form>
      </CardBody>
    </Card>
  );
}