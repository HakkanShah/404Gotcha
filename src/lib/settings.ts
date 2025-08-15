
'use server';

import { z } from 'zod';

const settingsSchema = z.object({
  redirectUrl: z.string().url().optional(),
  statsPassword: z.string().optional(),
  notificationEmail: z.string().email().optional().or(z.literal('')),
  gmailEmail: z.string().email().optional().or(z.literal('')),
  gmailAppPassword: z.string().optional(),
});

type Settings = z.infer<typeof settingsSchema>;

// This function now reads exclusively from environment variables.
export async function getSettings(): Promise<Settings> {
  return {
    redirectUrl: process.env.REDIRECT_URL,
    statsPassword: process.env.STATS_PASSWORD,
    notificationEmail: process.env.NOTIFICATION_EMAIL,
    gmailEmail: process.env.GMAIL_EMAIL,
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
  };
}

// This function is no longer needed as all settings are managed by environment variables.
// We will keep it to prevent build errors from where it's imported, but it does nothing.
export async function saveSettings(settings: Partial<Settings>): Promise<void> {
    console.log("Settings are now managed via environment variables and cannot be saved at runtime.");
    return Promise.resolve();
}
