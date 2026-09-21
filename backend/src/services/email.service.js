/**
 * Email service — Mailjet implementation.
 *
 * Sends transactional emails through Mailjet's v3.1 Send API.
 * Uses native fetch, so no Mailjet SDK is required.
 *
 * Required environment variables:
 *   MJ_APIKEY_PUBLIC
 *   MJ_APIKEY_PRIVATE
 *   MAIL_FROM_EMAIL
 *   MAIL_FROM_NAME
 */

const logger = require('../utils/logger');
const { config } = require('../config/env');

/**
 * True when Mailjet is configured and delivery will be attempted.
 */
function emailEnabled() {
  return config.notifications.email.enabled;
}

/**
 * Send a plain-text email through Mailjet.
 *
 * Throws only when Mailjet rejects the request.
 */
async function sendEmail({ to, subject, text }) {
  const { email } = config.notifications;

  console.log('[EMAIL DEBUG] Config:', {
    enabled: email.enabled,
    apiUrl: email.apiUrl,
    hasApiKey: Boolean(email.apiKey),
    hasApiSecret: Boolean(email.apiSecret),
    from: email.from,
    fromName: email.fromName,
    to,
    subject,
  });

  if (!to) {
    console.log('[EMAIL DEBUG] No recipient email');
    return;
  }

  if (!email.enabled) {
    logger.info(
      { to, subject, text },
      '[email:disabled] would have sent email'
    );
    return;
  }

  const credentials = Buffer.from(
    `${email.apiKey}:${email.apiSecret}`
  ).toString('base64');

  console.log('[EMAIL DEBUG] Calling Mailjet...');

  const res = await fetch(email.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      Messages: [
        {
          From: {
            Email: email.from,
            Name: email.fromName,
          },
          To: [
            {
              Email: to,
            },
          ],
          Subject: subject,
          TextPart: text,
        },
      ],
    }),
  });

  const detail = await res.text();

  console.log('[MAILJET RESPONSE]', {
    status: res.status,
    ok: res.ok,
    body: detail,
  });

  if (!res.ok) {
    throw new Error(
      `Mailjet API responded ${res.status}: ${detail.slice(0, 500)}`
    );
  }

  return detail;
}
module.exports = {
  sendEmail,
  emailEnabled,
};