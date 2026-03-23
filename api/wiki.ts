import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { path } = req.query;
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Missing wiki path' });
  }

  // Only allow backrooms-wiki.wikidot.com paths
  const cleanPath = String(path).replace(/[^a-zA-Z0-9\-\/]/g, '');

  try {
    const url = `https://backrooms-wiki.wikidot.com/${cleanPath}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BackOS/4.0.011 BackNET-Explorer',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Page not found on the wiki' });
    }

    const html = await response.text();

    // Extract the main content from the wiki page
    // The content is inside <div id="page-content">
    const contentMatch = html.match(/<div id="page-content">([\s\S]*?)<\/div>\s*<\/div>\s*<div/);
    const titleMatch = html.match(/<div id="page-title">\s*([\s\S]*?)\s*<\/div>/);

    const pageTitle = titleMatch ? titleMatch[1].trim() : cleanPath;
    let pageContent = contentMatch ? contentMatch[1] : '';

    // Clean up the HTML - remove scripts, fix relative URLs
    pageContent = pageContent
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/href="\//g, 'href="https://backrooms-wiki.wikidot.com/')
      .replace(/src="\//g, 'src="https://backrooms-wiki.wikidot.com/');

    return res.status(200).json({
      title: pageTitle,
      content: pageContent,
      url: url,
      path: cleanPath,
    });
  } catch (err: any) {
    console.error('Wiki fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch wiki page' });
  }
}
