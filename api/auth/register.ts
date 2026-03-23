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

    if (cleanUsername.length < 2 || cleanUsername.length > 30) {
      return res.status(400).json({ error: 'Username must be 2-30 characters' });
    }

    if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, hyphens, and underscores' });
    }

    if (String(password).length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    // Check if username exists
    const existing = await kv.get(`user:${cleanUsername}`);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create user
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(String(password), salt);

    const user: UserRecord = {
      username: cleanUsername,
      passwordHash,
      salt,
      createdAt: Date.now(),
    };

    await kv.set(`user:${cleanUsername}`, user);
    await kv.sadd('users:index', cleanUsername);

    // Create session token
    const token = generateToken();
    await kv.set(`session:${token}`, { username: cleanUsername }, { ex: 60 * 60 * 24 * 30 }); // 30 days

    return res.status(201).json({
      username: cleanUsername,
      token,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
