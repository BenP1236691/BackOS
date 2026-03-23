import { getDb } from './db';

export default async function handler(req: any, res: any) {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}
