
import { promises as fs } from 'fs';
import path from 'path';
import type { Visit } from './types';

// In serverless environments, only the /tmp directory is writable.
const visitsFilePath = path.join(process.env.NETLIFY || process.env.VERCEL ? '/tmp' : process.cwd(), 'visits.json');

async function ensureFileExists() {
  try {
    await fs.access(visitsFilePath);
  } catch {
    await fs.writeFile(visitsFilePath, JSON.stringify([]));
  }
}

export async function getVisits(): Promise<Visit[]> {
  await ensureFileExists();
  let data = '';
  try {
    data = await fs.readFile(visitsFilePath, 'utf-8');
    // Handle empty file case
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading or parsing visits file:", error);
    // If parsing fails, it's likely corrupt. Log it and treat as empty.
    if (data) { // Only log if there was something to parse
      console.error("Corrupted visits.json content:", data);
    }
    return [];
  }
}

export async function addVisit(visitData: Omit<Visit, 'id'>): Promise<void> {
  const visits = await getVisits();
  const newVisit: Visit = {
    id: `${new Date().toISOString()}-${Math.random().toString(36).substring(2, 9)}`,
    ...visitData,
  };
  visits.unshift(newVisit);
  try {
    await fs.writeFile(visitsFilePath, JSON.stringify(visits, null, 2));
  } catch (error) {
    console.error("Error writing to visits file:", error);
  }
}
