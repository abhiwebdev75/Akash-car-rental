/**
 * Email service — a single place that actually sends mail. Provider-agnostic:
 * we POST { from, to, subject, text } to any transactional HTTP JSON API (e.g.
 * Resend, Brevo, Mailgun's JSON endpoint) with the API key as a Bearer token,
 * using native fetch (Node 18+) so there are no SDK dependencies.
 *
 * When no provider is configured, `sendEmail` logs the message instead of
 * throwing. That keeps the app fully functional out of the box — in
 * development you can read OTP codes straight from the server log.
 */
const logger = require('../utils/logger');
const { config } = require('../config/env');

/** True when an email provider is configured and delivery will be attempted. */
function emailEnabled() {
  return config.notifications.email.enabled;
}

/**
 * Send a plain-text email. Resolves quietly (no send) when unconfigured or when
 * `to` is missing. Throws only when a configured provider rejects the request,
 * so callers that need delivery guarantees can catch it.
 */
async function sendEmail({ to, subject, text }) {
  const { email } = config.notifications;
  if (!to) return;

  if (!email.enabled) {
    // Dev/no-provider fallback: surface the content in logs rather than failing.
    logger.info({ to, subject, text }, '[email:disabled] would have sent email');
    return;
  }

  const res = await fetch(email.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${email.apiKey}`,
    },
    body: JSON.stringify({ from: email.from, to, subject, text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`email API responded ${res.status}: ${detail.slice(0, 200)}`);
  }
}

module.exports = { sendEmail, emailEnabled };
