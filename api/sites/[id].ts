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

async function getAuthUser(req: VercelRequest): Promise<string | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const session = await kv.get<{ username: string }>(`session:${token}`);
  return session?.username || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
      const authUser = await getAuthUser(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const existing = await kv.get<SiteData>(`site:${id}`);
      if (!existing) {
        return res.status(404).json({ error: 'Site not found' });
      }

      if (existing.author !== authUser) {
        return res.status(403).json({ error: 'You can only edit your own sites' });
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
      const authUser = await getAuthUser(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const existing = await kv.get<SiteData>(`site:${id}`);
      if (!existing) {
        return res.status(404).json({ error: 'Site not found' });
      }

      if (existing.author !== authUser) {
        return res.status(403).json({ error: 'You can only delete your own sites' });
      }

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
