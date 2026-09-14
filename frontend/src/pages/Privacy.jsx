import { Link } from 'react-router-dom';
import { PageHero } from '../components/PageHero';
import { useSettings } from '../features/settings/hooks';
import { ROUTES } from '../lib/constants';

export default function Privacy() {
  const { data: settings } = useSettings();
  const businessName = settings?.businessName || 'Akash Car Rental';
  const email = settings?.email;

  return (
    <div>
      <PageHero
        eyebrow="Privacy policy"
        title="Your privacy"
        subtitle={`How ${businessName} collects, uses, and protects your information.`}
      />

      <article className="container-page max-w-3xl py-14 sm:py-16">
        <p className="text-sm leading-relaxed text-muted sm:text-base">
          We collect only what we need to provide our car rental service, and we handle it with
          care. This policy explains what we collect, why, and the choices you have.
        </p>

        <Section n="1" title="Information we collect">
          <p>
            When you create an account and book a vehicle, we collect the details you provide —
            your name, email, phone number, and address — along with your booking information such
            as dates, locations, and the vehicle chosen. To verify eligibility, we may collect
            identity and driving-licence documents you upload or present at pickup.
          </p>
        </Section>

        <Section n="2" title="How we use your information">
          <p>We use your information to:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>Process and manage your bookings, pickups, and returns.</li>
            <li>Verify your identity and eligibility to rent.</li>
            <li>Handle payments, deposits, refunds, and any charges.</li>
            <li>Contact you about your booking and respond to enquiries.</li>
            <li>Meet our legal, tax, and safety obligations.</li>
          </ul>
        </Section>

        <Section n="3" title="Document security">
          <p>
            Identity and licence documents are stored with restricted access. They are never
            exposed through public links — access is limited to authorised staff and to you as the
            owner of the documents, and download links are short-lived. We keep these records only
            as long as needed for the rental and to meet legal requirements.
          </p>
        </Section>

        <Section n="4" title="Sharing your information">
          <p>
            We do not sell your personal information. We share it only where necessary to run the
            service — for example, with payment processors or when required by law or to protect our
            rights. Any partners who handle your data are expected to protect it to the same
            standard.
          </p>
        </Section>

        <Section n="5" title="Data retention">
          <p>
            We retain booking and account records for as long as your account is active and for a
            reasonable period afterwards to comply with legal, accounting, and dispute-resolution
            requirements. When data is no longer needed, we take steps to delete or anonymise it.
          </p>
        </Section>

        <Section n="6" title="Your choices & rights">
          <p>
            You can review and update your personal details anytime from your{' '}
            <Link
              to={ROUTES.profile}
              className="font-medium text-signal-700 hover:underline dark:text-signal-400"
            >
              profile
            </Link>
            . You may request access to, correction of, or deletion of your personal data by
            contacting us — subject to records we’re legally required to keep.
          </p>
        </Section>

        <Section n="7" title="Cookies & local storage">
          <p>
            We use your browser’s local storage to keep you signed in and to remember preferences
            such as your theme choice and any cars you’ve added to compare. These stay on your
            device and aren’t used to track you across other websites.
          </p>
        </Section>

        <Section n="8" title="Changes to this policy">
          <p>
            We may update this policy as our service evolves. The version shown here is the one
            currently in effect.
          </p>
        </Section>

        <div className="mt-10 rounded-xl border border-hair bg-surface p-5 text-sm text-muted">
          Questions about your privacy?{' '}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="font-medium text-signal-700 hover:underline dark:text-signal-400"
            >
              Email {email}
            </a>
          ) : (
            <Link
              to={ROUTES.contact}
              className="font-medium text-signal-700 hover:underline dark:text-signal-400"
            >
              Contact us
            </Link>
          )}
          . See also our{' '}
          <Link
            to={ROUTES.terms}
            className="font-medium text-signal-700 hover:underline dark:text-signal-400"
          >
            terms &amp; conditions
          </Link>
          .
        </div>
      </article>
    </div>
  );
}

function Section({ n, title, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold text-fg-strong">
        <span className="text-muted">{n}.</span> {title}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted sm:text-base">
        {children}
      </div>
    </section>
  );
}
