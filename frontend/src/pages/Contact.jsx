import { useState } from 'react';
import { Mail, MapPin, MessageCircle, Navigation, Phone, Send } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { Button, Input, Textarea, Card, CardBody } from '../components/ui';
import { useSettings } from '../features/settings/hooks';
import { useLocations } from '../features/locations/hooks';

// Build a Google Maps link from geo coords when present, else from the address text.
function directionsUrl(loc) {
  if (loc?.geo?.lat != null && loc?.geo?.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.geo.lat},${loc.geo.lng}`;
  }
  const q = [loc?.name, loc?.address, loc?.city, loc?.state].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

export default function Contact() {
  const { data: settings } = useSettings();
  const { data: locations } = useLocations();

  const businessName = settings?.businessName || 'Akash Car Rental';
  const phone = settings?.phone;
  const email = settings?.email;
  const whatsapp = settings?.whatsapp;
  const address = typeof settings?.address === 'string' ? settings.address.trim() : '';

  const waLink = whatsapp
    ? `https://wa.me/${String(whatsapp).replace(/[^\d]/g, '')}`
    : null;

  const channels = [
    phone && {
      icon: Phone,
      label: 'Call us',
      value: phone,
      href: `tel:${String(phone).replace(/\s+/g, '')}`,
    },
    waLink && {
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
        subtitle={`Questions about a booking, a vehicle, or pickup? Reach ${businessName} however suits you best.`}
      />

      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          {/* Left: channels + address */}
          <div>
            <h2 className="font-display text-xl font-bold text-fg-strong sm:text-2xl">
              Get in touch
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Our team typically replies the same day.
            </p>

            <div className="mt-6 space-y-3">
              {channels.map(({ icon: Icon, label, value, href, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="flex items-center gap-4 rounded-xl border border-hair bg-card p-4 transition-colors hover:border-route/40 hover:bg-surface"
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-route/12 text-route">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium uppercase tracking-wide text-muted">
                      {label}
                    </span>
                    <span className="block truncate font-semibold text-fg-strong">{value}</span>
                  </span>
                </a>
              ))}
            </div>

            {address && (
              <div className="mt-6 rounded-xl border border-hair bg-surface p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  <MapPin className="h-4 w-4 text-route" />
                  Head office
                </p>
                <p className="mt-2 text-sm leading-relaxed text-fg">{address}</p>
              </div>
            )}

            {channels.length === 0 && !address && (
              <p className="mt-6 rounded-xl border border-hair bg-surface p-5 text-sm text-muted">
                Contact details are being updated — please check back shortly.
              </p>
            )}
          </div>

          {/* Right: enquiry form (composes an email; no data leaves the browser until you send) */}
          <EnquiryForm email={email} businessName={businessName} />
        </div>

        {/* Branches */}
        {locations?.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-xl font-bold text-fg-strong sm:text-2xl">
              Our locations
            </h2>
            <p className="mt-1.5 text-sm text-muted">Pick up and drop off at any of our branches.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {locations.map((loc) => {
                const dir = directionsUrl(loc);
                return (
                  <Card key={loc._id}>
                    <CardBody>
                      <h3 className="font-semibold text-fg-strong">{loc.name}</h3>
                      {(loc.address || loc.city) && (
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">
                          {[loc.address, loc.city, loc.state, loc.pincode]
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

function EnquiryForm({ email, businessName }) {
  const [form, setForm] = useState({ name: '', from: '', subject: '', message: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const disabled = !email || !form.message.trim();

  const onSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    const subject = form.subject.trim() || `Enquiry for ${businessName}`;
    const bodyLines = [
      form.message.trim(),
      '',
      '—',
      form.name.trim() && `Name: ${form.name.trim()}`,
      form.from.trim() && `Contact: ${form.from.trim()}`,
    ].filter(Boolean);
    const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      bodyLines.join('\n')
    )}`;
    window.location.href = href;
  };

  return (
    <Card>
      <CardBody className="sm:p-7">
        <div className="mb-5 flex items-center gap-2">
          <Send className="h-5 w-5 text-signal-600" />
          <h2 className="font-display text-lg font-semibold text-fg-strong">Send us a message</h2>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Your name" value={form.name} onChange={set('name')} />
            <Input
              label="Phone or email"
              value={form.from}
              onChange={set('from')}
              placeholder="How we reach you back"
            />
          </div>
          <Input
            label="Subject"
            value={form.subject}
            onChange={set('subject')}
            placeholder="What’s this about?"
          />
          <Textarea
            label="Message"
            required
            rows={5}
            maxLength={2000}
            value={form.message}
            onChange={set('message')}
            placeholder="Tell us how we can help…"
          />

          <Button type="submit" disabled={disabled} rightIcon={<Send className="h-4 w-4" />}>
            Compose email
          </Button>

          <p className="text-xs leading-relaxed text-muted">
            {email
              ? 'This opens your email app with the message ready to send — nothing is sent automatically.'
              : 'Email isn’t configured yet — please use the phone or WhatsApp options.'}
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
