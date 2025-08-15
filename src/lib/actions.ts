
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { settings } from './settings';

const AUTH_COOKIE_NAME = '404gotcha-auth';

// The previousState argument is required for useActionState, but we don't need it.
export async function loginAction(previousState: any, formData: FormData) {
  const password = formData.get('password') as string;
  const storedPassword = settings.statsPassword;

  if (storedPassword && password === storedPassword) {
    cookies().set(AUTH_COOKIE_NAME, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    redirect('/stats');
  } else if (!storedPassword) {
     return { error: 'Password is not set. Please configure it via environment variables.' };
  }
  else {
    return { error: 'Invalid password. Please try again.' };
  }
}

export async function logoutAction() {
  cookies().delete(AUTH_COOKIE_NAME);
  redirect('/login');
}
