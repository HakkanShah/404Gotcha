import basicAuth from 'basic-auth';
import ejs from 'ejs';
import path from 'path';
import { initRemoteDatabase, getRecentVisitsRemote, getAggregatedStatsRemote } from '../../src/db-remote.js';

let dbReadyPromise = initRemoteDatabase();

export async function handler(event, context) {
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Hakkan@123';

  const authHeader = event.headers?.authorization || '';
  const req = { headers: { authorization: authHeader } };
  const res = {};
  const user = basicAuth(req);
  const isValid = user && user.name === ADMIN_USERNAME && user.pass === ADMIN_PASSWORD;
  if (!isValid) {
    return {
      statusCode: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Dashboard"' },
      body: 'Authentication required'
    };
  }

  await dbReadyPromise;

  const limit = Math.min(parseInt(event.queryStringParameters?.limit, 10) || 200, 5000);
  const [visits, stats] = await Promise.all([
    getRecentVisitsRemote(limit),
    getAggregatedStatsRemote()
  ]);

  const targetUrl = process.env.TARGET_URL || 'https://github.com/HakkanShah';
  const viewPath = path.join(process.cwd(), 'views', 'dashboard.ejs');
  const html = await ejs.renderFile(viewPath, { visits, stats, targetUrl, limit });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: html
  };
}