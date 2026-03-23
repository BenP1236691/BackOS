import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const id = pathParts[pathParts.length - 1];

  if (!id || id === 'site') {
    return res.status(400).send(renderError('No site specified', 'Please provide a site ID in the URL.'));
  }

  try {
    const db = await getDb();
    const site = await db.collection('sites').findOne({ id });

    if (!site) {
      return res.status(404).send(renderError(
        'Site Not Found',
        `The site "${escapeHtml(id)}" does not exist on the BackNET.<br><br>It may have been consumed by the void between levels.`
      ));
    }

    await db.collection('sites').updateOne({ id }, { $inc: { views: 1 } });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(site.title)} — BackNET</title>
  <meta name="author" content="${escapeHtml(site.author)}">
  <meta name="generator" content="BackNET Deploy™ — Back OS™ v4.0.011">
  <style>
    ${site.css}
  </style>
</head>
<body>
  ${site.html}
  <!-- Deployed via BackNET Deploy™ | Back OS™ v4.0.011 -->
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err: any) {
    console.error('Site render error:', err);
    return res.status(500).send(renderError(
      'BackNET Error',
      'An error occurred while loading this site.<br>The BackNET infrastructure may be experiencing instability.'
    ));
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderError(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — BackNET</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0d0d00;color:#FFD700;font-family:'VT323',monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px}
    .container{max-width:500px}
    h1{font-size:36px;margin-bottom:8px;text-shadow:0 0 20px rgba(255,215,0,0.5)}
    p{font-size:18px;color:#B8960F;line-height:1.6;margin-bottom:24px}
    a{color:#FFD700;text-decoration:underline;font-size:16px}
    .logo{font-size:14px;color:#706020;margin-top:32px}
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">← Return to Back OS™</a>
    <div class="logo">Back OS™ v4.0.011 — BackNET Deploy™</div>
  </div>
</body>
</html>`;
}
