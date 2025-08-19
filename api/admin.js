import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { initRemoteDatabase, getRecentVisitsRemote, getAggregatedStatsRemote, getRecentEmailLogsRemote } from '../src/db-remote.js';
import { parseCookies, verifySessionToken } from '../src/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbReadyPromise = initRemoteDatabase();

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

export default async function handler(req, res) {
	const cookies = parseCookies(req.headers.cookie || '');
	const token = cookies.session;
	const secret = process.env.ADMIN_PASSWORD || 'Hakkan@123';
	const authed = verifySessionToken(token, secret);
	if (!authed) {
		res.statusCode = 302;
		res.setHeader('Location', '/login');
		return res.end();
	}

	await dbReadyPromise;

	const limit = Math.min(parseInt(req.query?.limit, 10) || 200, 5000);
	const [visitsRaw, stats, emailLogsRaw] = await Promise.all([
		getRecentVisitsRemote(limit),
		getAggregatedStatsRemote(),
		getRecentEmailLogsRemote(50)
	]);

	const visits = visitsRaw.map(v => ({ ...v, tsIST: formatIST(v.timestamp) }));
	const emailLogs = (emailLogsRaw || []).map(l => ({ ...l, tsIST: formatIST(l.timestamp) }));
	const targetUrl = process.env.TARGET_URL || 'https://github.com/HakkanShah';

	const viewPath = path.join(process.cwd(), 'views', 'dashboard.ejs');
	const html = await ejs.renderFile(viewPath, { visits, stats, targetUrl, limit, cssPath: '/style.css', emailLogs });

	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.statusCode = 200;
	res.end(html);
}