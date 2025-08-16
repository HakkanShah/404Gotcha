
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
    if (!data.trim()) return [];
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("Error parsing visits.json:", error);
      console.error("Corrupted content:", data);
      // File is corrupt, back it up and start a new one
      try {
        await fs.rename(visitsFilePath, `${visitsFilePath}.corrupt`);
        await fs.writeFile(visitsFilePath, JSON.stringify([]));
      } catch (backupError) {
        console.error("Could not back up corrupted file:", backupError);
      }
      return [];
    }
    console.error("Error reading visits file:", error);
    return []; // Return empty array for other read errors
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

export async function deleteVisit(visitId: string): Promise<void> {
    const visits = await getVisits();
    const updatedVisits = visits.filter((visit) => visit.id !== visitId);
    try {
        await fs.writeFile(visitsFilePath, JSON.stringify(updatedVisits, null, 2));
    } catch (error) {
        console.error("Error writing to visits file after deleting a visit:", error);
    }
}

export async function clearAllVisits(): Promise<void> {
    try {
        await fs.writeFile(visitsFilePath, JSON.stringify([], null, 2));
    } catch (error) {
        console.error("Error clearing visits file:", error);
    }
}
