
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { settings } from './settings';
import { clearVisits, deleteVisit } from './visits';
import { revalidatePath } from 'next/cache';

const AUTH_COOKIE_NAME = '404gotcha-auth';

export async function loginAction(previousState: any, formData: FormData) {
  const password = formData.get('password') as string;
  const { statsPassword } = settings;

  if (!statsPassword) {
     return { error: 'Password is not set. Please configure STATS_PASSWORD in your environment variables.' };
  }

  if (password === statsPassword) {
    cookies().set(AUTH_COOKIE_NAME, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    redirect('/stats');
  } else {
    return { error: 'Invalid password. Please try again.' };
  }
}

export async function logoutAction() {
  cookies().delete(AUTH_COOKIE_NAME);
  redirect('/login');
}

export async function deleteVisitAction(visitId: string) {
    if (!visitId) {
        return { error: 'Visit ID is required.' };
    }
    try {
        await deleteVisit(visitId);
        revalidatePath('/stats');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { error: `Failed to delete visit: ${message}` };
    }
}

export async function clearVisitsAction() {
    try {
        await clearVisits();
        revalidatePath('/stats');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { error: `Failed to clear visits: ${message}` };
    }
}
