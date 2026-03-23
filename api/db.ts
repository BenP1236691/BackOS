import { MongoClient, type Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let indexesCreated = false;

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not set');
  }

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(uri);
    }
    await cachedClient.connect();
    cachedDb = cachedClient.db('backos');

    if (!indexesCreated) {
      indexesCreated = true;
      // Fire and forget — don't block on index creation
      Promise.all([
        cachedDb.collection('sessions').createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }),
        cachedDb.collection('sessions').createIndex({ token: 1 }),
        cachedDb.collection('users').createIndex({ username: 1 }, { unique: true }),
        cachedDb.collection('sites').createIndex({ id: 1 }),
        cachedDb.collection('posts').createIndex({ id: 1 }),
        cachedDb.collection('threads').createIndex({ id: 1 }),
        cachedDb.collection('chat').createIndex({ channel: 1, timestamp: -1 }),
        cachedDb.collection('messages').createIndex({ to: 1 }),
      ]).catch(() => {});
    }

    return cachedDb;
  } catch (err) {
    cachedClient = null;
    cachedDb = null;
    throw err;
  }
}
