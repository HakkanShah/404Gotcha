import { createClient } from '@libsql/client';

let client = null;

export async function initRemoteDatabase() {
  const url = process.env.LIBSQL_URL || process.env.TURSO_DATABASE_URL;
  const authToken = process.env.LIBSQL_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('Missing LIBSQL_URL/TURSO_DATABASE_URL');
  client = createClient({ url, authToken });
  await client.execute(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      ip TEXT,
      referrer TEXT,
      user_agent TEXT,
      device_type TEXT,
      browser TEXT,
      os TEXT,
      country TEXT,
      region TEXT,
      city TEXT,
      latitude REAL,
      longitude REAL
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      to_email TEXT,
      subject TEXT,
      success INTEGER,
      error TEXT
    )
  `);
  return client;
}

function db() {
  if (!client) throw new Error('Remote DB not initialized');
  return client;
}

export async function insertVisitRemote(visit) {
  await db().execute({
    sql: `INSERT INTO visits (
      timestamp, ip, referrer, user_agent, device_type, browser, os, country, region, city, latitude, longitude
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      visit.timestamp,
      visit.ipAddress,
      visit.referrer,
      visit.userAgent,
      visit.deviceType,
      visit.browser,
      visit.os,
      visit.country,
      visit.region,
      visit.city,
      visit.latitude,
      visit.longitude
    ]
  });
}

export async function logEmailRemote({ timestamp, to, subject, success, error }) {
  await db().execute({
    sql: `INSERT INTO email_logs (timestamp, to_email, subject, success, error) VALUES (?, ?, ?, ?, ?)` ,
    args: [timestamp, to, subject, success ? 1 : 0, error || null]
  });
}

export async function getRecentEmailLogsRemote(limit = 50) {
  const res = await db().execute({
    sql: `SELECT timestamp, to_email, subject, success, error FROM email_logs ORDER BY datetime(timestamp) DESC LIMIT ?`,
    args: [limit]
  });
  return res.rows;
}

export async function getRecentVisitsRemote(limit = 200) {
  const res = await db().execute({
    sql: `SELECT id, timestamp, ip, referrer, user_agent, device_type, browser, os, country, region, city, latitude, longitude
          FROM visits
          ORDER BY datetime(timestamp) DESC
          LIMIT ?`,
    args: [limit]
  });
  return res.rows;
}

export async function getAggregatedStatsRemote() {
  const totalVisits = Number((await db().execute('SELECT COUNT(*) as c FROM visits')).rows[0].c || 0);
  const uniqueVisitors = Number((await db().execute('SELECT COUNT(DISTINCT ip) as c FROM visits')).rows[0].c || 0);
  const recent24h = Number((await db().execute('SELECT COUNT(*) as c FROM visits WHERE datetime(timestamp) >= datetime("now", "-1 day")')).rows[0].c || 0);

  const topReferrers = (await db().execute(`
    SELECT COALESCE(NULLIF(TRIM(referrer), ''), '(direct)') as label, COUNT(*) as c
    FROM visits GROUP BY label ORDER BY c DESC LIMIT 10
  `)).rows;
  const topBrowsers = (await db().execute(`
    SELECT COALESCE(NULLIF(TRIM(browser), ''), 'Unknown') as label, COUNT(*) as c
    FROM visits GROUP BY label ORDER BY c DESC LIMIT 10
  `)).rows;
  const topDevices = (await db().execute(`
    SELECT COALESCE(NULLIF(TRIM(device_type), ''), 'unknown') as label, COUNT(*) as c
    FROM visits GROUP BY label ORDER BY c DESC LIMIT 10
  `)).rows;
  const topLocations = (await db().execute(`
    SELECT COALESCE(NULLIF(TRIM(city), ''), '(unknown)') || ', ' || COALESCE(NULLIF(TRIM(region), ''), '') || ', ' || COALESCE(NULLIF(TRIM(country), ''), '') as label,
           COUNT(*) as c
    FROM visits GROUP BY label ORDER BY c DESC LIMIT 10
  `)).rows;

  return { totalVisits, uniqueVisitors, recent24h, topReferrers, topBrowsers, topDevices, topLocations };
}