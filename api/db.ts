import { MongoClient, type Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set. Add it in Vercel project settings.');
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI);
  }

  await cachedClient.connect();
  cachedDb = cachedClient.db('backos');

  // Create indexes (idempotent)
  try {
    await cachedDb.collection('sessions').createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
    await cachedDb.collection('sessions').createIndex({ token: 1 });
    await cachedDb.collection('users').createIndex({ username: 1 }, { unique: true });
    await cachedDb.collection('sites').createIndex({ id: 1 }, { unique: true });
    await cachedDb.collection('posts').createIndex({ id: 1 });
    await cachedDb.collection('posts').createIndex({ board: 1, timestamp: -1 });
    await cachedDb.collection('threads').createIndex({ id: 1 });
    await cachedDb.collection('chat').createIndex({ channel: 1, timestamp: -1 });
    await cachedDb.collection('messages').createIndex({ to: 1, timestamp: -1 });
  } catch {
    // indexes may already exist
  }

  return cachedDb;
}
