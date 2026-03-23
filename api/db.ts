import { MongoClient, type Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';

let cached: { client: MongoClient; db: Db } | null = null;

export async function getDb(): Promise<Db> {
  if (cached) return cached.db;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('backos');

  // Ensure TTL index on sessions (expire after 30 days)
  await db.collection('sessions').createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 30 }
  ).catch(() => {}); // ignore if already exists

  cached = { client, db };
  return db;
}
