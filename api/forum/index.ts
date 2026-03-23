import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

interface Reply {
  id: string;
  body: string;
  author: string;
  timestamp: number;
}

interface Thread {
  id: string;
  title: string;
  body: string;
  author: string;
  category: string;
  timestamp: number;
  replies: Reply[];
}

const VALID_CATEGORIES = [
  'General Discussion',
  'Level Reports',
  'Entity Sightings',
  'Technical Help',
  'Trading Post',
];

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
      const threadIds = await kv.smembers('forum:index');
      if (!threadIds || threadIds.length === 0) {
        return res.status(200).json({ threads: [] });
      }

      const threads: Thread[] = [];
      for (const id of threadIds) {
        const thread = await kv.get<Thread>(`thread:${id}`);
        if (thread) threads.push(thread);
      }

      threads.sort((a, b) => b.timestamp - a.timestamp);
      return res.status(200).json({ threads });
    }

    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { title, body, author, category } = req.body;
      if (!title || !body || !category) {
        return res.status(400).json({ error: 'Missing required fields: title, body, category' });
      }

      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Invalid category. Valid categories: ${VALID_CATEGORIES.join(', ')}` });
      }

      const thread: Thread = {
        id: Math.random().toString(36).substring(2, 10),
        title,
        body,
        author: author || username,
        category,
        timestamp: Date.now(),
        replies: [],
      };

      await kv.set(`thread:${thread.id}`, thread);
      await kv.sadd('forum:index', thread.id);

      return res.status(201).json({ thread });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Forum API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
