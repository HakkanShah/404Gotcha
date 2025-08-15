
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const settingsSchema = z.object({
  redirectUrl: z.string().url().optional(),
  statsPassword: z.string().optional(),
  notificationEmail: z.string().email().optional().or(z.literal('')),
  gmailEmail: z.string().email().optional().or(z.literal('')),
  gmailAppPassword: z.string().optional(),
});

type Settings = z.infer<typeof settingsSchema>;

const settingsFilePath = path.join(process.env.NETLIFY || process.env.VERCEL ? '/tmp' : process.cwd(), 'settings.json');

async function ensureFileExists(): Promise<void> {
  try {
    await fs.access(settingsFilePath);
  } catch {
    // Initialize with redirectUrl from env if available
    const initialSettings = {
      redirectUrl: process.env.REDIRECT_URL || ""
    };
    await fs.writeFile(settingsFilePath, JSON.stringify(initialSettings));
  }
}

export async function getSettings(): Promise<Settings | null> {
  await ensureFileExists();
  try {
    const data = await fs.readFile(settingsFilePath, 'utf-8');
    const fileSettings = JSON.parse(data || '{}');
    
    // Combine file settings with environment variables
    // Environment variables take precedence
    return {
      redirectUrl: process.env.REDIRECT_URL || fileSettings.redirectUrl,
      statsPassword: process.env.STATS_PASSWORD,
      notificationEmail: process.env.NOTIFICATION_EMAIL,
      gmailEmail: process.env.GMAIL_EMAIL,
      gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
    };
  } catch (error) {
    console.error("Error reading or parsing settings file:", error);
    // Fallback to environment variables only
    return {
      redirectUrl: process.env.REDIRECT_URL,
      statsPassword: process.env.STATS_PASSWORD,
      notificationEmail: process.env.NOTIFICATION_EMAIL,
      gmailEmail: process.env.GMAIL_EMAIL,
      gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
    };
  }
}

// This function will now only save the redirectUrl
export async function saveSettings(settings: Pick<Settings, 'redirectUrl'>): Promise<void> {
    const validatedSettings = z.object({ redirectUrl: z.string().url().optional() }).parse(settings);
    try {
        await fs.writeFile(settingsFilePath, JSON.stringify(validatedSettings, null, 2));
    } catch (error) {
        console.error("Error writing to settings file:", error);
        throw new Error("Could not save settings.");
    }
}
