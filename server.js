import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import geoip from 'geoip-lite';
import UAParser from 'ua-parser-js';
import cookieParser from 'cookie-parser';
import { initDatabase, insertVisit, getRecentVisits, getAggregatedStats, getRecentEmailLogs } from './src/db.js';
import { sendVisitEmail } from './src/email.js';
import { createSessionToken, verifySessionToken } from './src/auth.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', true);
app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/icons', express.static(path.join(__dirname, 'public', 'icons')));

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuration
const PORT = process.env.PORT || 3000;
const TARGET_URL = process.env.TARGET_URL || 'https://github.com/HakkanShah';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Hakkan@123';

// Initialize DB
initDatabase(path.join(__dirname, 'data', 'visits.db'));

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    const parts = xff.split(',').map(s => s.trim());
    if (parts.length > 0) return parts[0];
  }
  return (req.ip || req.connection?.remoteAddress || '').replace('::ffff:', '');
}

function getDeviceInfo(userAgent) {
  const parser = new UAParser(userAgent || '');
  const deviceType = parser.getDevice().type || 'desktop';
  const browser = parser.getBrowser();
  const os = parser.getOS();
  return {
    deviceType,
    browserName: browser.name || 'Unknown',
    browserVersion: browser.version || '',
    osName: os.name || 'Unknown',
    osVersion: os.version || ''
  };
}

function formatIST(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', hour12: true,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(d);
  const get = t => parts.find(p => p.type === t)?.value || '';
  return `${get('day')}-${get('month')}-${get('year')} ${get('hour')}:${get('minute')}:${get('second')} ${get('dayPeriod')}`;
}

// PWA static
app.get('/manifest.json', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'manifest.json')));
app.get('/service-worker.js', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'service-worker.js')));

// Auth pages
app.get('/login', (req, res) => {
  const error = req.query.error === '1';
  res.render('login', { cssPath: '/public/style.css', error });
});
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = createSessionToken(username, ADMIN_PASSWORD);
    res.cookie('session', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, secure: true, path: '/' });
    return res.redirect('/admin');
  }
  res.redirect('/login?error=1');
});

function requireSession(req, res, next) {
  const token = req.cookies.session;
  if (!token || !verifySessionToken(token, ADMIN_PASSWORD)) return res.redirect('/login');
  next();
}

// Tracking and instant redirect
app.get(['/s', '/track', '/go', '/'], async (req, res) => {
  const timestamp = new Date().toISOString();
  const ipAddress = getClientIp(req);
  const referrer = req.get('referer') || req.query.ref || '';
  const userAgent = req.get('user-agent') || '';

  const deviceInfo = getDeviceInfo(userAgent);
  const geo = ipAddress ? (geoip.lookup(ipAddress) || {}) : {};
  const [latitude, longitude] = Array.isArray(geo.ll) ? geo.ll : [null, null];

  try {
    insertVisit({
      timestamp,
      ipAddress,
      referrer,
      userAgent,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browserName,
      os: deviceInfo.osName,
      country: geo.country || '',
      region: geo.region || '',
      city: geo.city || '',
      latitude,
      longitude
    });
  } catch (err) {
    console.error('Failed to insert visit:', err);
  }

  try {
    await sendVisitEmail({
      timestamp,
      ipAddress,
      referrer,
      userAgent,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browserName,
      os: deviceInfo.osName,
      country: geo.country || '',
      region: geo.region || '',
      city: geo.city || '',
      latitude,
      longitude,
      targetUrl: TARGET_URL
    });
  } catch (err) {
    console.error('Email send error:', err);
  }

  return res.redirect(302, TARGET_URL);
});

// Admin dashboard (session auth)
app.get('/admin', requireSession, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 5000);
  const visitsRaw = getRecentVisits(limit);
  const visits = visitsRaw.map(v => ({ ...v, tsIST: formatIST(v.timestamp) }));
  const stats = getAggregatedStats();
  const emailLogsRaw = getRecentEmailLogs(50);
  const emailLogs = emailLogsRaw.map(l => ({ ...l, tsIST: formatIST(l.timestamp) }));
  res.render('dashboard', { visits, stats, targetUrl: TARGET_URL, limit, cssPath: '/public/style.css', emailLogs });
});

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

app.listen(PORT, () => {
  console.log(`Link Tracker listening on http://localhost:${PORT}`);
});