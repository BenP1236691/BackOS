import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

interface SiteData {
  id: string;
  title: string;
  html: string;
  css: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  views: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // List all sites
      const siteIds: string[] = (await kv.smembers('sites:index')) || [];
      const sites: SiteData[] = [];

      for (const id of siteIds) {
        const site = await kv.get<SiteData>(`site:${id}`);
        if (site) {
          sites.push({ ...site, html: '', css: '' }); // Don't send full content in list
        }
      }

      sites.sort((a, b) => b.updatedAt - a.updatedAt);
      return res.status(200).json(sites);
    }

    if (req.method === 'POST') {
      const { title, html, css, author } = req.body;

      if (!title || !html) {
        return res.status(400).json({ error: 'Title and HTML are required' });
      }

      // Generate a short ID
      const id = generateId();
      const now = Date.now();

      const site: SiteData = {
        id,
        title: String(title).slice(0, 100),
        html: String(html).slice(0, 50000),
        css: String(css || '').slice(0, 20000),
        author: String(author || 'anonymous').slice(0, 50),
        createdAt: now,
        updatedAt: now,
        views: 0,
      };

      await kv.set(`site:${id}`, site);
      await kv.sadd('sites:index', id);

      return res.status(201).json({ id, url: `/site/${id}` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Sites API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
