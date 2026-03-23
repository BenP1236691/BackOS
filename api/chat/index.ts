import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

interface ChatMessage {
  id: string;
  author: string;
  body: string;
  timestamp: number;
}

const VALID_CHANNELS = ['general', 'level-0', 'level-1', 'entity-alerts', 'off-topic'];

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
      const channel = (req.query.channel as string || 'general').toLowerCase();
      if (!VALID_CHANNELS.includes(channel)) {
        return res.status(400).json({ error: `Invalid channel. Valid channels: ${VALID_CHANNELS.join(', ')}` });
      }

      const messages = await kv.lrange<ChatMessage>(`chat:${channel}`, 0, 49);
      return res.status(200).json({ messages: (messages || []).reverse() });
    }

    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { channel, body, author } = req.body;
      if (!channel || !body) {
        return res.status(400).json({ error: 'Missing required fields: channel, body' });
      }

      const channelLower = channel.toLowerCase();
      if (!VALID_CHANNELS.includes(channelLower)) {
        return res.status(400).json({ error: `Invalid channel. Valid channels: ${VALID_CHANNELS.join(', ')}` });
      }

      const message: ChatMessage = {
        id: Math.random().toString(36).substring(2, 10),
        author: author || username,
        body,
        timestamp: Date.now(),
      };

      await kv.lpush(`chat:${channelLower}`, message);
      await kv.ltrim(`chat:${channelLower}`, 0, 99);

      return res.status(201).json({ message });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
