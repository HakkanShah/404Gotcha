import crypto from 'crypto';

function base64url(input) {
	return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function createSessionToken(username, secret) {
	const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const payload = base64url(JSON.stringify({ sub: username, iat: Math.floor(Date.now() / 1000) }));
	const h = crypto.createHmac('sha256', String(secret)).update(`${header}.${payload}`).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
	return `${header}.${payload}.${h}`;
}

export function verifySessionToken(token, secret) {
	if (!token) return false;
	const parts = token.split('.');
	if (parts.length !== 3) return false;
	const [h, p, s] = parts;
	const expected = crypto.createHmac('sha256', String(secret)).update(`${h}.${p}`).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
	return crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected));
}

export function parseCookies(cookieHeader) {
	const out = {};
	if (!cookieHeader) return out;
	const parts = cookieHeader.split(/;\s*/);
	for (const part of parts) {
		const idx = part.indexOf('=');
		if (idx > -1) out[decodeURIComponent(part.slice(0, idx))] = decodeURIComponent(part.slice(idx + 1));
	}
	return out;
} 