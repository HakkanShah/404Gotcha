import geoip from 'geoip-lite';
import UAParser from 'ua-parser-js';
import { initRemoteDatabase, insertVisitRemote } from '../src/db-remote.js';
import { sendVisitEmail } from '../src/email.js';

let dbReadyPromise = initRemoteDatabase();

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    const parts = xff.split(',').map(s => s.trim());
    if (parts.length > 0) return parts[0];
  }
  const ip = req.socket?.remoteAddress || '';
  return ip.replace('::ffff:', '');
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

function getGeo(ip) {
  try {
    const geo = geoip.lookup(ip);
    if (!geo) return { country: '', region: '', city: '', latitude: null, longitude: null };
    const [latitude, longitude] = Array.isArray(geo.ll) ? geo.ll : [null, null];
    return { country: geo.country || '', region: geo.region || '', city: geo.city || '', latitude, longitude };
  } catch (_err) {
    return { country: '', region: '', city: '', latitude: null, longitude: null };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  const TARGET_URL = process.env.TARGET_URL || 'https://github.com/HakkanShah';

  // Begin work asap
  const timestamp = new Date().toISOString();
  const ipAddress = getClientIp(req);
  const referrer = req.headers['referer'] || '';
  const userAgent = req.headers['user-agent'] || '';

  const deviceInfo = getDeviceInfo(userAgent);
  const geo = ipAddress ? getGeo(ipAddress) : { country: '', region: '', city: '', latitude: null, longitude: null };

  // Ensure DB is ready then insert (await to guarantee persistence in serverless)
  try {
    await dbReadyPromise;
    await insertVisitRemote({
      timestamp,
      ipAddress,
      referrer,
      userAgent,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browserName,
      os: deviceInfo.osName,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      latitude: geo.latitude,
      longitude: geo.longitude
    });
  } catch (err) {
    console.error('Insert error:', err);
  }

  // Send email (await for reliability)
  try {
    await sendVisitEmail({
      timestamp,
      ipAddress,
      referrer,
      userAgent,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browserName,
      os: deviceInfo.osName,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      latitude: geo.latitude,
      longitude: geo.longitude,
      targetUrl: TARGET_URL
    });
  } catch (err) {
    console.error('Email send error:', err);
  }

  res.statusCode = 302;
  res.setHeader('Location', TARGET_URL);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}