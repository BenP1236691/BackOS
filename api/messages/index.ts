import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: number;
  read: boolean;
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function authenticate(req: VercelRequest): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const session = await kv.get<{ username: string }>(`session:${token}`);
  return session?.username ?? null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const user = req.query.user as string;
      if (!user) {
        return res.status(400).json({ error: 'Missing user parameter' });
      }

      const messages = await kv.lrange<Message>(`messages:${user.toLowerCase()}`, 0, -1);
      return res.status(200).json({ messages: messages || [] });
    }

    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { to, from, subject, body } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
      }

      const message: Message = {
        id: Math.random().toString(36).substring(2, 10),
        from: from || username,
        to: to.toLowerCase(),
        subject,
        body,
        timestamp: Date.now(),
        read: false,
      };

      // Add to recipient's inbox
      await kv.lpush(`messages:${to.toLowerCase()}`, message);

      return res.status(201).json({ message });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Messages API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
