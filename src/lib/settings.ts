
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const settingsSchema = z.object({
  redirectUrl: z.string().url().optional(),
  statsPassword: z.string().optional(),
  notificationEmail: z.string().email().optional(),
  gmailEmail: z.string().email().optional(),
  gmailAppPassword: z.string().optional(),
});

type Settings = z.infer<typeof settingsSchema>;

// In serverless environments, only the /tmp directory is writable.
const settingsFilePath = path.join(process.env.NETLIFY || process.env.VERCEL ? '/tmp' : process.cwd(), 'settings.json');


async function ensureFileExists(): Promise<void> {
  try {
    await fs.access(settingsFilePath);
  } catch {
    await fs.writeFile(settingsFilePath, JSON.stringify({}));
  }
}

export async function getSettings(): Promise<Settings | null> {
  await ensureFileExists();
  try {
    const data = await fs.readFile(settingsFilePath, 'utf-8');
    if (!data) return null;
    return JSON.parse(data) as Settings;
  } catch (error) {
    console.error("Error reading or parsing settings file:", error);
    return null;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
    const validatedSettings = settingsSchema.parse(settings);
    try {
        await fs.writeFile(settingsFilePath, JSON.stringify(validatedSettings, null, 2));
    } catch (error) {
        console.error("Error writing to settings file:", error);
        throw new Error("Could not save settings.");
    }
}
