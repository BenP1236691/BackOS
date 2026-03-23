import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import crypto from 'crypto';

interface UserRecord {
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = String(username).trim().toLowerCase();

    const user = await kv.get<UserRecord>(`user:${cleanUsername}`);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const hash = hashPassword(String(password), user.salt);
    if (hash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create session token
    const token = generateToken();
    await kv.set(`session:${token}`, { username: cleanUsername }, { ex: 60 * 60 * 24 * 30 }); // 30 days

    return res.status(200).json({
      username: cleanUsername,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
