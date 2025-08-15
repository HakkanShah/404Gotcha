
'use server';

import nodemailer from 'nodemailer';
import type { Visit } from './types';
import { headers } from 'next/headers';

export async function sendVisitNotification(visit: Visit) {
  const headerList = headers();

  const GMAIL_EMAIL = process.env.GMAIL_EMAIL;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
  const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL;
  
  // Derive the app URL from request headers for reliability
  const host = headerList.get('host');
  const protocol = host?.startsWith('localhost') ? 'http' : 'https';
  const APP_URL = `${protocol}://${host}`;

  if (!GMAIL_EMAIL || !GMAIL_APP_PASSWORD || !NOTIFICATION_EMAIL) {
    console.warn('Missing email credentials in settings. Skipping notification.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_EMAIL,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"404Gotcha" <${GMAIL_EMAIL}>`,
    to: NOTIFICATION_EMAIL,
    subject: `👀 New Visit on 404Gotcha!`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2 style="color: #3F51B5;">New Visit Detected!</h2>
        <p>A new visitor has just been tracked. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Time</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${new Date(visit.timestamp).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>IP Address</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${visit.ip}</td>
          </tr>
          <tr style="background-color: #f2f2f2;">
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Location</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${visit.city || 'N/A'}, ${visit.region || 'N/A'}, ${visit.country || 'N/A'}</td>
          </tr>
           <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>ISP</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${visit.org || 'N/A'}</td>
          </tr>
          <tr style="background-color: #f2f2f2;">
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Device</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${visit.device} (${visit.os}, ${visit.browser})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Referrer</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${visit.referrer}</td>
          </tr>
        </table>
        <p>Head to your <a href="${APP_URL}/stats" style="color: #7E57C2;">stats dashboard</a> to see all visits.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Notification email sent successfully.');
  } catch (error) {
    console.error('Failed to send notification email:', error);
    // Throwing here would break the redirect flow, so we just log the error.
  }
}
