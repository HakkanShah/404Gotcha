import geoip from 'geoip-lite';
import UAParser from 'ua-parser-js';
import { initRemoteDatabase, insertVisitRemote } from '../../src/db-remote.js';
import { sendVisitEmail } from '../../src/email.js';

let dbReadyPromise = initRemoteDatabase();

function getClientIp(headers) {
  const xff = headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    const parts = xff.split(',').map(s => s.trim());
    if (parts.length > 0) return parts[0];
  }
  return '';
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

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const TARGET_URL = process.env.TARGET_URL || 'https://github.com/HakkanShah';

  const timestamp = new Date().toISOString();
  const ipAddress = getClientIp(event.headers || {});
  const referrer = event.headers?.referer || '';
  const userAgent = event.headers?.['user-agent'] || '';

  const deviceInfo = getDeviceInfo(userAgent);
  const geo = ipAddress ? getGeo(ipAddress) : { country: '', region: '', city: '', latitude: null, longitude: null };

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

  return {
    statusCode: 302,
    headers: { Location: TARGET_URL, 'Cache-Control': 'no-store' }
  };
}