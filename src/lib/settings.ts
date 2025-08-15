
// All settings are now managed via environment variables.
// This file centralizes access to them.

export const settings = {
  redirectUrl: process.env.REDIRECT_URL,
  statsPassword: process.env.STATS_PASSWORD,
  gmailEmail: process.env.GMAIL_EMAIL,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
  notificationEmail: process.env.NOTIFICATION_EMAIL,
};
