import nodemailer from 'nodemailer';
import { logEmail as logEmailLocal } from './db.js';
import { logEmailRemote } from './db-remote.js';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: port || 587,
    secure,
    auth: { user, pass }
  });
}

async function logEmail({ timestamp, to, subject, success, error }) {
  try {
    if (process.env.LIBSQL_URL || process.env.TURSO_DATABASE_URL) {
      await logEmailRemote({ timestamp, to, subject, success, error });
    } else {
      logEmailLocal({ timestamp, to, subject, success, error });
    }
  } catch (_) {}
}

function formatIST(isoString) {
  let date = new Date(isoString);
  if (isNaN(date)) {
    try { date = new Date(String(isoString).replace(/ZZ$/, 'Z')); } catch (_) {}
  }
  if (isNaN(date)) {
    try { date = new Date(String(isoString) + ''); } catch (_) {}
  }
  if (isNaN(date)) {
    date = new Date();
  }
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', hour12: true,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(date);
  const get = t => parts.find(p => p.type === t)?.value || '';
  return `${get('day')}-${get('month')}-${get('year')} ${get('hour')}:${get('minute')}:${get('second')} ${get('dayPeriod')}`;
}

export async function sendVisitEmail(visit) {
  const to = process.env.EMAIL_TO || 'hakkanparbej@gmail.com';
  const from = process.env.EMAIL_FROM || (process.env.SMTP_USER ? `Link Tracker <${process.env.SMTP_USER}>` : 'Link Tracker <no-reply@example.com>');

  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email disabled: SMTP configuration missing. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS to enable.');
    return;
  }

  const subject = `New visit from ${visit.ipAddress || 'unknown IP'} (${visit.country || 'unknown'})`;
  const ts = visit.timestamp || new Date().toISOString();
  const istString = formatIST(ts);
  const lines = [
    `New visitor just clicked your link and was redirected to: ${visit.targetUrl}`,
    '',
    `Timestamp (IST): ${istString}`,
    `IP Address: ${visit.ipAddress}`,
    `Location: ${visit.city || ''}, ${visit.region || ''}, ${visit.country || ''}`,
    `Latitude/Longitude: ${visit.latitude ?? ''}, ${visit.longitude ?? ''}`,
    `Referrer: ${visit.referrer || '(direct)'}`,
    `Device: ${visit.deviceType}`,
    `Browser: ${visit.browser}`,
    `OS: ${visit.os}`,
    `User-Agent: ${visit.userAgent}`
  ];

  const text = lines.join('\n');
  const html = lines.map(l => `<div>${String(l).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>`).join('');

  const timestamp = ts;
  try {
    await transporter.sendMail({ from, to, subject, text, html });
    await logEmail({ timestamp, to, subject, success: true });
  } catch (err) {
    await logEmail({ timestamp, to, subject, success: false, error: String(err?.message || err) });
    throw err;
  }
}