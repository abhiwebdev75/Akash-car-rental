import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useSettings } from '../../features/settings/hooks';
import { ROUTES } from '../../lib/constants';
import { Logo } from '../Logo';

export function Footer() {
  const { data: settings } = useSettings();
  const year = new Date().getFullYear();
  const name = settings?.businessName || 'Akash Car Rental';
  const shortName = name.split(' ')[0];

  const addr = settings?.address;
  const addressLine = typeof addr === 'string' ? addr.trim() : null;

  return (
    <footer className="mt-20 border-t border-hair bg-surface">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo name={shortName} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Self-drive car rentals, booked in minutes. Transparent pricing, well-maintained
            vehicles, and pickup from locations near you.
          </p>
        </div>

        <FooterColumn title="Explore">
          <FooterLink to={ROUTES.cars}>Browse cars</FooterLink>
          <FooterLink to={ROUTES.compare}>Compare vehicles</FooterLink>
          <FooterLink to={ROUTES.about}>About us</FooterLink>
          <FooterLink to={ROUTES.contact}>Contact</FooterLink>
        </FooterColumn>

        <FooterColumn title="Support">
          <FooterLink to={ROUTES.account}>My bookings</FooterLink>
          <FooterLink to={ROUTES.terms}>Terms &amp; conditions</FooterLink>
          <FooterLink to={ROUTES.privacy}>Privacy policy</FooterLink>
        </FooterColumn>

        <FooterColumn title="Get in touch">
          {settings?.phone && (
            <ContactRow icon={Phone}>
              <a href={`tel:${settings.phone}`} className="hover:text-fg-strong">
                {settings.phone}
              </a>
            </ContactRow>
          )}
          {settings?.email && (
            <ContactRow icon={Mail}>
              <a href={`mailto:${settings.email}`} className="hover:text-fg-strong">
                {settings.email}
              </a>
            </ContactRow>
          )}
          {addressLine && <ContactRow icon={MapPin}>{addressLine}</ContactRow>}
        </FooterColumn>
      </div>

      <div className="border-t border-hair">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>
            © {year} {name}. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-route" />
            Booked in minutes
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-strong">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm text-muted">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="transition-colors hover:text-fg-strong">
        {children}
      </Link>
    </li>
  );
}

function ContactRow({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-muted">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-route" />
      <span>{children}</span>
    </li>
  );
}
