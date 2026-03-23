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

const VALID_BOARDS = ['general', 'levels', 'entities', 'survival', 'random'];

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
      const board = (req.query.board as string || 'general').toLowerCase();
      if (!VALID_BOARDS.includes(board)) {
        return res.status(400).json({ error: `Invalid board. Valid boards: ${VALID_BOARDS.join(', ')}` });
      }

      const postIds = await kv.smembers(`posts:${board}`);
      if (!postIds || postIds.length === 0) {
        return res.status(200).json({ posts: [] });
      }

      const posts: Post[] = [];
      for (const id of postIds) {
        const post = await kv.get<Post>(`post:${id}`);
        if (post) posts.push(post);
      }

      posts.sort((a, b) => b.timestamp - a.timestamp);
      return res.status(200).json({ posts });
    }

    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { board, title, body, author } = req.body;
      if (!board || !title || !body) {
        return res.status(400).json({ error: 'Missing required fields: board, title, body' });
      }

      const boardLower = board.toLowerCase();
      if (!VALID_BOARDS.includes(boardLower)) {
        return res.status(400).json({ error: `Invalid board. Valid boards: ${VALID_BOARDS.join(', ')}` });
      }

      const post: Post = {
        id: Math.random().toString(36).substring(2, 10),
        board: boardLower,
        title,
        body,
        author: author || username,
        timestamp: Date.now(),
        replies: [],
      };

      await kv.set(`post:${post.id}`, post);
      await kv.sadd(`posts:${boardLower}`, post.id);

      return res.status(201).json({ post });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Posts API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
