import { MongoClient } from 'mongodb';

export default async function handler(req: any, res: any) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return res.status(200).json({ ok: false, error: 'MONGODB_URI not set' });

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('backos');
    await db.command({ ping: 1 });
    await client.close();

    return res.status(200).json({ ok: true, db: 'connected' });
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}
