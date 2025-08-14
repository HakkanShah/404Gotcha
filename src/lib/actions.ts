'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = '404gotcha-auth';

export async function loginAction(password: string) {
  if (password === process.env.STATS_PASSWORD) {
    cookies().set(AUTH_COOKIE_NAME, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
