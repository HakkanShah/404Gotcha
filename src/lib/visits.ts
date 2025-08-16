
'use server';
import { createClient } from '@vercel/kv';
import type { Visit } from './types';

// Ensure KV_URL and KV_REST_API_TOKEN are used for initialization
const kv = createClient({
  url: process.env.KV_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});


const VISITS_KEY = 'visits';

// Get all visits from KV
export async function getVisits(): Promise<Visit[]> {
  try {
    const visits = await kv.lrange<Visit>(VISITS_KEY, 0, -1);
    return visits;
  } catch (error) {
    console.error("Error reading from Vercel KV:", error);
    return [];
  }
}

// Add a new visit to KV
export async function addVisit(visitData: Omit<Visit, 'id'>): Promise<void> {
  const newVisit: Visit = {
    id: `${new Date().toISOString()}-${Math.random().toString(36).substring(2, 9)}`,
    ...visitData,
  };
  try {
    await kv.lpush(VISITS_KEY, newVisit);
  } catch (error) {
    console.error("Error writing to Vercel KV:", error);
  }
}

// Delete a single visit by its ID
export async function deleteVisit(visitId: string) {
    try {
        const visits = await getVisits();
        const visitToDelete = visits.find(v => v.id === visitId);
        if (visitToDelete) {
            // LREM removes the first count occurrences of elements equal to value from the list.
            // By setting count to 1, we remove exactly one occurrence.
            await kv.lrem(VISITS_KEY, 1, visitToDelete);
        }
    } catch (error) {
        console.error("Error deleting visit from Vercel KV:", error);
        throw new Error('Failed to delete visit.');
    }
}


// Clear all visits from KV
export async function clearVisits() {
    try {
        await kv.del(VISITS_KEY);
    } catch (error) {
        console.error("Error clearing visits from Vercel KV:", error);
        throw new Error('Failed to clear visit history.');
    }
}
