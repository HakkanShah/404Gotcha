import fs from 'fs/promises';
import path from 'path';

export default async function handler(_req, res) {
  try {
    const cssPath = path.join(process.cwd(), 'public', 'style.css');
    const css = await fs.readFile(cssPath);
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.statusCode = 200;
    res.end(css);
  } catch (err) {
    res.statusCode = 404;
    res.end('Not found');
  }
}