import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let dbInstance = null;

export function initDatabase(dbPath) {
	const dir = path.dirname(dbPath);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	dbInstance = new Database(dbPath);
	dbInstance.pragma('journal_mode = WAL');
	dbInstance.pragma('synchronous = NORMAL');
	dbInstance.prepare(`
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
	`).run();
	dbInstance.prepare('CREATE INDEX IF NOT EXISTS idx_visits_timestamp ON visits(timestamp)').run();
	dbInstance.prepare('CREATE INDEX IF NOT EXISTS idx_visits_ip ON visits(ip)').run();
	dbInstance.prepare('CREATE INDEX IF NOT EXISTS idx_visits_referrer ON visits(referrer)').run();

	dbInstance.prepare(`
		CREATE TABLE IF NOT EXISTS email_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			timestamp TEXT NOT NULL,
			to_email TEXT,
			subject TEXT,
			success INTEGER,
			error TEXT
		)
	`).run();
}

function db() {
	if (!dbInstance) throw new Error('Database not initialized');
	return dbInstance;
}

export function insertVisit(visit) {
	const stmt = db().prepare(`
		INSERT INTO visits (
			timestamp, ip, referrer, user_agent, device_type, browser, os, country, region, city, latitude, longitude
		) VALUES (
			@timestamp, @ipAddress, @referrer, @userAgent, @deviceType, @browser, @os, @country, @region, @city, @latitude, @longitude
		)
	`);
	stmt.run(visit);
}

export function logEmail({ timestamp, to, subject, success, error }) {
	const stmt = db().prepare(`INSERT INTO email_logs (timestamp, to_email, subject, success, error) VALUES (?, ?, ?, ?, ?)`);
	stmt.run(timestamp, to, subject, success ? 1 : 0, error || null);
}

export function getRecentVisits(limit = 200) {
	const stmt = db().prepare(`
		SELECT id, timestamp, ip, referrer, user_agent, device_type, browser, os, country, region, city, latitude, longitude
		FROM visits
		ORDER BY datetime(timestamp) DESC
		LIMIT ?
	`);
	return stmt.all(limit);
}

export function getRecentEmailLogs(limit = 50) {
	return db().prepare(`SELECT timestamp, to_email, subject, success, error FROM email_logs ORDER BY datetime(timestamp) DESC LIMIT ?`).all(limit);
}

export function getAggregatedStats() {
	const totalVisits = db().prepare('SELECT COUNT(*) as c FROM visits').get().c;
	const uniqueVisitors = db().prepare('SELECT COUNT(DISTINCT ip) as c FROM visits').get().c;
	const recent24h = db().prepare('SELECT COUNT(*) as c FROM visits WHERE datetime(timestamp) >= datetime("now", "-1 day")').get().c;

	const topReferrers = db().prepare(`
		SELECT COALESCE(NULLIF(TRIM(referrer), ''), '(direct)') as label, COUNT(*) as c
		FROM visits
		GROUP BY label
		ORDER BY c DESC
		LIMIT 10
	`).all();

	const topBrowsers = db().prepare(`
		SELECT COALESCE(NULLIF(TRIM(browser), ''), 'Unknown') as label, COUNT(*) as c
		FROM visits
		GROUP BY label
		ORDER BY c DESC
		LIMIT 10
	`).all();

	const topDevices = db().prepare(`
		SELECT COALESCE(NULLIF(TRIM(device_type), ''), 'unknown') as label, COUNT(*) as c
		FROM visits
		GROUP BY label
		ORDER BY c DESC
		LIMIT 10
	`).all();

	const topLocations = db().prepare(`
		SELECT
			COALESCE(NULLIF(TRIM(city), ''), '(unknown)') || ', ' || COALESCE(NULLIF(TRIM(region), ''), '') || ', ' || COALESCE(NULLIF(TRIM(country), ''), '') as label,
			COUNT(*) as c
		FROM visits
		GROUP BY label
		ORDER BY c DESC
		LIMIT 10
	`).all();

	return {
		totalVisits,
		uniqueVisitors,
		recent24h,
		topReferrers,
		topBrowsers,
		topDevices,
		topLocations
	};
}