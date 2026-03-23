import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const session = await kv.get<{ username: string }>(`session:${token}`);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    return res.status(200).json({ username: session.username });
  } catch (err: any) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
