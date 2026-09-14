import { Link } from 'react-router-dom';
import { PageHero } from '../components/PageHero';
import { useSettings } from '../features/settings/hooks';
import { ROUTES } from '../lib/constants';

export default function Terms() {
  const { data: settings } = useSettings();
  const businessName = settings?.businessName || 'Akash Car Rental';
  const policies = settings?.policies || {};
  const email = settings?.email;
  const taxPct =
    typeof settings?.taxRate === 'number' ? Math.round(settings.taxRate * 1000) / 10 : null;

  return (
    <div>
      <PageHero
        eyebrow="Terms &amp; conditions"
        title="Rental terms"
        subtitle={`The terms below govern bookings and rentals made with ${businessName}.`}
      />

      <article className="container-page max-w-3xl py-14 sm:py-16">
        <LegalIntro>
          By making a booking you agree to these terms. They’re written to keep expectations clear
          on both sides. If anything is unclear, please {email ? 'email us' : 'contact us'} before
          you book.
        </LegalIntro>

        <Section n="1" title="Eligibility & driving licence">
          {policies.terms ? (
            <p>{policies.terms}</p>
          ) : (
            <p>
              The primary renter must hold a valid driving licence and meet the minimum age and
              experience requirements for the vehicle. We may ask for identity and address proof at
              pickup.
            </p>
          )}
        </Section>

        <Section n="2" title="Booking, pricing & payment">
          <p>
            Every booking shows an itemised quote — base rental, any add-ons, applicable taxes
            {taxPct != null ? ` (currently ${taxPct}%)` : ''}, and a refundable security deposit —
            before it’s confirmed. The price shown at checkout is the price that applies. Prices and
            availability are confirmed at the time of booking.
          </p>
        </Section>

        <Section n="3" title="Security deposit">
          <p>
            A refundable security deposit is collected for each rental and returned after the
            vehicle is handed back in acceptable condition, subject to any deductions for damage,
            traffic penalties, or breaches of these terms. The deposit amount is shown on your
            quote.
          </p>
        </Section>

        <Section n="4" title="Cancellations & refunds">
          {policies.cancellation ? (
            <p>{policies.cancellation}</p>
          ) : (
            <p>
              Cancellations made within the window shown on your booking are eligible for a refund.
              The applicable window and any charges are displayed before you confirm.
            </p>
          )}
        </Section>

        <Section n="5" title="Fuel policy">
          {policies.fuel ? (
            <p>{policies.fuel}</p>
          ) : (
            <p>Return the vehicle with the same fuel level as at pickup, or a refuelling charge may apply.</p>
          )}
        </Section>

        {policies.mileage && (
          <Section n="6" title="Mileage & distance">
            <p>{policies.mileage}</p>
          </Section>
        )}

        <Section n={policies.mileage ? '7' : '6'} title="Use of the vehicle">
          <p>
            The vehicle must be used lawfully and only by the named renter or approved additional
            drivers. Sub-letting, racing, off-road use, transport of hazardous goods, and driving
            under the influence are not permitted. You’re responsible for traffic fines and tolls
            incurred during your rental.
          </p>
        </Section>

        <Section n={policies.mileage ? '8' : '7'} title="Damage, breakdown & liability">
          <p>
            Please report any accident, damage, or breakdown to us as soon as possible. Vehicle
            condition is recorded at pickup and return. You may be liable for damage not covered by
            insurance and for losses arising from misuse or breach of these terms.
          </p>
        </Section>

        <Section n={policies.mileage ? '9' : '8'} title="Changes to these terms">
          <p>
            We may update these terms from time to time. The version shown here applies to bookings
            made while it is in effect. For questions about a specific booking, please get in touch.
          </p>
        </Section>

        <div className="mt-10 rounded-xl border border-hair bg-surface p-5 text-sm text-muted">
          Questions about these terms?{' '}
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
            to={ROUTES.privacy}
            className="font-medium text-signal-700 hover:underline dark:text-signal-400"
          >
            privacy policy
          </Link>
          .
        </div>
      </article>
    </div>
  );
}

function LegalIntro({ children }) {
  return <p className="text-sm leading-relaxed text-muted sm:text-base">{children}</p>;
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
