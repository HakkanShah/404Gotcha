import path from 'path';
import ejs from 'ejs';
import { createSessionToken } from '../src/auth.js';

export default async function handler(req, res) {
	const method = req.method || 'GET';
	const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
	const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Hakkan@123';
	const secret = ADMIN_PASSWORD;

	if (method === 'GET') {
		const viewPath = path.join(process.cwd(), 'views', 'login.ejs');
		const html = await ejs.renderFile(viewPath, { cssPath: '/style.css', error: req.query?.error === '1' });
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.statusCode = 200;
		return res.end(html);
	}

	if (method === 'POST') {
		let raw = '';
		req.on('data', c => (raw += c));
		req.on('end', () => {
			const params = new URLSearchParams(raw);
			const u = params.get('username');
			const p = params.get('password');
			if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
				const token = createSessionToken(u, secret);
				res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800; Secure`);
				res.statusCode = 302;
				res.setHeader('Location', '/admin');
				return res.end();
			}
			res.statusCode = 302;
			res.setHeader('Location', '/login?error=1');
			res.end();
		});
		return;
	}

	res.statusCode = 405;
	res.end('Method Not Allowed');
}