
'use server';

import nodemailer from 'nodemailer';
import type { Visit } from './types';
import { settings } from './settings';

export async function sendVisitNotification(visit: Visit) {
  const { gmailEmail, gmailAppPassword, notificationEmail, isEmailConfigured } = settings;

  if (!isEmailConfigured) {
    console.warn('Email credentials are not fully configured. Skipping notification. Please set GMAIL_EMAIL, GMAIL_APP_PASSWORD, and NOTIFICATION_EMAIL in your environment variables.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailEmail,
      pass: gmailAppPassword,
    },
  });

  const mailOptions = {
    from: `"404Gotcha" <${gmailEmail}>`,
    to: notificationEmail,
    subject: `👀 New Visit from ${visit.city || 'an unknown location'}!`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2 style="color: #3F51B5;">New Visit Detected!</h2>
        <p>A new visitor has just been tracked by your link.</p>
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
            <td style="padding: 8px; border: 1px solid #ddd;">${visit.city || 'N/A'}, ${visit.country || 'N/A'}</td>
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
        <p>Head to your stats dashboard to see all visits.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }
}
