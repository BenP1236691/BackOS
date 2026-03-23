let cachedDb: any = null;

export async function getDb() {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(uri);
  await client.connect();
  cachedDb = client.db('backos');

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

  return cachedDb;
}
