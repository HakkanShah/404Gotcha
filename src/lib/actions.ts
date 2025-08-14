
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSettings } from './settings';

const AUTH_COOKIE_NAME = '404gotcha-auth';

export async function loginAction(password: string) {
  const settings = await getSettings();
  const storedPassword = settings?.statsPassword || process.env.STATS_PASSWORD;

  if (storedPassword && password === storedPassword) {
    cookies().set(AUTH_COOKIE_NAME, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    redirect('/stats');
  } else if (!storedPassword) {
     return { error: 'Password is not set. Please configure it on the setup page.' };
  }
  else {
    return { error: 'Invalid password. Please try again.' };
  }
}

export async function logoutAction() {
  cookies().delete(AUTH_COOKIE_NAME);
  redirect('/login');
}