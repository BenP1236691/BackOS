import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { getDb } from './db';

export default async function handler(req: any, res: any) {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    const rand = randomBytes(4).toString('hex');
    return res.status(200).json({ ok: true, rand });
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}
