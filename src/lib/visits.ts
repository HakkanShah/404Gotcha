
'use server';
import { kv } from '@vercel/kv';
import type { Visit } from './types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const VISITS_KEY = 'visits';

export async function getVisits(): Promise<Visit[]> {
  try {
    const visits = await kv.lrange<Visit>(VISITS_KEY, 0, -1);
    return visits;
  } catch (error) {
    console.error("Error reading from Vercel KV:", error);
    return [];
  }
}

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

export async function clearVisits() {
    try {
        await kv.del(VISITS_KEY);
        revalidatePath('/stats');
        redirect('/stats');
    } catch (error) {
        console.error("Error clearing visits from Vercel KV:", error);
        // Optionally, return an error message to the client
        return { error: "Failed to clear visit history." };
    }
}
