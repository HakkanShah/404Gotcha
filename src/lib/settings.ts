
// All settings are managed via environment variables.
// This file centralizes access to them and adds computed properties for checks.

const isKvConfigured = !!(
  process.env.KV_URL &&
  process.env.KV_REST_API_URL &&
  process.env.KV_REST_API_TOKEN &&
  process.env.KV_REST_API_READ_ONLY_TOKEN
);

const isEmailConfigured = !!(
    process.env.GMAIL_EMAIL &&
    process.env.GMAIL_APP_PASSWORD &&
    process.env.NOTIFICATION_EMAIL
);

export const settings = {
  redirectUrl: process.env.REDIRECT_URL,
  statsPassword: process.env.STATS_PASSWORD,
  gmailEmail: process.env.GMAIL_EMAIL,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
  notificationEmail: process.env.NOTIFICATION_EMAIL,
  isKvConfigured,
  isEmailConfigured
};
