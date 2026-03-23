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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing site ID' });
  }

  try {
    if (req.method === 'GET') {
      const site = await kv.get<SiteData>(`site:${id}`);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      // Increment views
      await kv.set(`site:${id}`, { ...site, views: site.views + 1 });

      return res.status(200).json(site);
    }

    if (req.method === 'PUT') {
      const existing = await kv.get<SiteData>(`site:${id}`);
      if (!existing) {
        return res.status(404).json({ error: 'Site not found' });
      }

      const { title, html, css } = req.body;

      const updated: SiteData = {
        ...existing,
        title: title ? String(title).slice(0, 100) : existing.title,
        html: html ? String(html).slice(0, 50000) : existing.html,
        css: css ? String(css || '').slice(0, 20000) : existing.css,
        updatedAt: Date.now(),
      };

      await kv.set(`site:${id}`, updated);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      await kv.del(`site:${id}`);
      await kv.srem('sites:index', id);
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Site API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
