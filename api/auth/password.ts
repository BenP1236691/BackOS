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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await kv.get<{ username: string }>(`session:${token}`);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (String(newPassword).length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters' });
    }

    const user = await kv.get<UserRecord>(`user:${session.username}`);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const currentHash = hashPassword(String(currentPassword), user.salt);
    if (currentHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(String(newPassword), newSalt);

    await kv.set(`user:${session.username}`, {
      ...user,
      passwordHash: newHash,
      salt: newSalt,
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Password change error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
