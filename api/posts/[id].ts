import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

interface Reply {
  id: string;
  body: string;
  author: string;
  timestamp: number;
}

interface Post {
  id: string;
  board: string;
  title: string;
  body: string;
  author: string;
  timestamp: number;
  replies: Reply[];
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

  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ error: 'Missing post ID' });
  }

  try {
    if (req.method === 'GET') {
      const post = await kv.get<Post>(`post:${id}`);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      return res.status(200).json({ post });
    }

    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { body, author } = req.body;
      if (!body) {
        return res.status(400).json({ error: 'Missing required field: body' });
      }

      const post = await kv.get<Post>(`post:${id}`);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const reply: Reply = {
        id: Math.random().toString(36).substring(2, 10),
        body,
        author: author || username,
        timestamp: Date.now(),
      };

      post.replies.push(reply);
      await kv.set(`post:${post.id}`, post);

      return res.status(201).json({ reply });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Post detail API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
