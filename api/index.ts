let cachedDb: any = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(uri);
  await client.connect();
  cachedDb = client.db('backos');
  return cachedDb;
}

async function getCrypto() {
  return await import('node:crypto');
}

async function hashPw(pw: string, salt: string) {
  const c = await getCrypto();
  return c.pbkdf2Sync(pw, salt, 10000, 64, 'sha512').toString('hex');
}

async function genToken() {
  const c = await getCrypto();
  return c.randomBytes(32).toString('hex');
}

async function genSalt() {
  const c = await getCrypto();
  return c.randomBytes(16).toString('hex');
}

function genId() {
  const ch = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) id += ch[Math.floor(Math.random() * ch.length)];
  return id;
}

async function getUser(req: any): Promise<string | null> {
  const a = req.headers.authorization;
  if (!a || !a.startsWith('Bearer ')) return null;
  const db = await getDb();
  const s = await db.collection('sessions').findOne({ token: a.slice(7) });
  return s?.username ?? null;
}

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function route(url: string) {
  const p = new URL(url, 'http://x').pathname.replace(/^\/api\/?/, '');
  return p.split('/').filter(Boolean);
}

const BOARDS = ['general', 'levels', 'entities', 'survival', 'random'];
const CATEGORIES = ['General Discussion', 'Level Reports', 'Entity Sightings', 'Technical Help', 'Trading Post'];
const CHANNELS = ['general', 'level-0', 'level-1', 'entity-alerts', 'off-topic'];

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function errPage(title: string, msg: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>*{margin:0;padding:0}body{background:#0d0d00;color:#FFD700;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px}h1{font-size:36px;margin-bottom:8px}p{font-size:18px;color:#B8960F;margin-bottom:24px}a{color:#FFD700}</style></head><body><div><h1>${title}</h1><p>${msg}</p><a href="/">Back to Back OS</a></div></body></html>`;
}

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const seg = route(req.url || '');

    // ---- HEALTH ----
    if (seg[0] === 'health') {
      try {
        const db = await getDb();
        await db.command({ ping: 1 });
        return res.status(200).json({ status: 'ok' });
      } catch (e: any) {
        return res.status(500).json({ status: 'error', error: e.message });
      }
    }

    // ---- AUTH LOGIN ----
    if (seg[0] === 'auth' && seg[1] === 'login') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
      const u = String(username).trim().toLowerCase();
      const db = await getDb();
      const user = await db.collection('users').findOne({ username: u });
      if (!user) return res.status(401).json({ error: 'Invalid username or password' });
      const h = await hashPw(String(password), user.salt);
      if (h !== user.passwordHash) return res.status(401).json({ error: 'Invalid username or password' });
      const token = await genToken();
      await db.collection('sessions').insertOne({ token, username: u, createdAt: new Date() });
      return res.status(200).json({ username: u, token });
    }

    // ---- AUTH REGISTER ----
    if (seg[0] === 'auth' && seg[1] === 'register') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
      const u = String(username).trim().toLowerCase();
      if (u.length < 2 || u.length > 30) return res.status(400).json({ error: 'Username must be 2-30 characters' });
      if (!/^[a-z0-9_-]+$/.test(u)) return res.status(400).json({ error: 'Invalid username characters' });
      if (String(password).length < 4) return res.status(400).json({ error: 'Password must be 4+ characters' });
      const db = await getDb();
      const exists = await db.collection('users').findOne({ username: u });
      if (exists) return res.status(409).json({ error: 'Username taken' });
      const salt = await genSalt();
      const ph = await hashPw(String(password), salt);
      await db.collection('users').insertOne({ username: u, passwordHash: ph, salt, createdAt: Date.now() });
      const token = await genToken();
      await db.collection('sessions').insertOne({ token, username: u, createdAt: new Date() });
      return res.status(201).json({ username: u, token });
    }

    // ---- AUTH VERIFY ----
    if (seg[0] === 'auth' && seg[1] === 'verify') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const t = req.headers.authorization?.replace('Bearer ', '');
      if (!t) return res.status(401).json({ error: 'No token' });
      const db = await getDb();
      const s = await db.collection('sessions').findOne({ token: t });
      if (!s) return res.status(401).json({ error: 'Invalid session' });
      return res.status(200).json({ username: s.username });
    }

    // ---- AUTH PASSWORD ----
    if (seg[0] === 'auth' && seg[1] === 'password') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const t = req.headers.authorization?.replace('Bearer ', '');
      if (!t) return res.status(401).json({ error: 'Not authenticated' });
      const db = await getDb();
      const s = await db.collection('sessions').findOne({ token: t });
      if (!s) return res.status(401).json({ error: 'Invalid session' });
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
      const user = await db.collection('users').findOne({ username: s.username });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const ch = await hashPw(String(currentPassword), user.salt);
      if (ch !== user.passwordHash) return res.status(401).json({ error: 'Wrong current password' });
      const ns = await genSalt();
      const nh = await hashPw(String(newPassword), ns);
      await db.collection('users').updateOne({ username: s.username }, { $set: { passwordHash: nh, salt: ns } });
      return res.status(200).json({ success: true });
    }

    // ---- SITES LIST ----
    if (seg[0] === 'sites' && (!seg[1] || seg[1] === '')) {
      const db = await getDb();
      if (req.method === 'GET') {
        const sites = await db.collection('sites').find({}, { projection: { html: 0, css: 0 } }).sort({ updatedAt: -1 }).toArray();
        return res.status(200).json(sites);
      }
      if (req.method === 'POST') {
        let author = 'anonymous';
        const u = await getUser(req);
        if (u) author = u;
        const { title, html, css } = req.body;
        if (!title || !html) return res.status(400).json({ error: 'Title and HTML required' });
        const id = genId();
        const now = Date.now();
        await db.collection('sites').insertOne({ id, title: String(title).slice(0, 100), html: String(html).slice(0, 50000), css: String(css || '').slice(0, 20000), author, createdAt: now, updatedAt: now, views: 0 });
        return res.status(201).json({ id, url: `/site/${id}` });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ---- SITE BY ID ----
    if (seg[0] === 'sites' && seg[1]) {
      const id = seg[1];
      const db = await getDb();
      if (req.method === 'GET') {
        const site = await db.collection('sites').findOne({ id });
        if (!site) return res.status(404).json({ error: 'Not found' });
        await db.collection('sites').updateOne({ id }, { $inc: { views: 1 } });
        return res.status(200).json(site);
      }
      if (req.method === 'PUT') {
        const u = await getUser(req);
        if (!u) return res.status(401).json({ error: 'Auth required' });
        const site = await db.collection('sites').findOne({ id });
        if (!site) return res.status(404).json({ error: 'Not found' });
        if (site.author !== u) return res.status(403).json({ error: 'Not your site' });
        const { title, html, css } = req.body;
        await db.collection('sites').updateOne({ id }, { $set: { title: title ? String(title).slice(0, 100) : site.title, html: html ? String(html).slice(0, 50000) : site.html, css: css !== undefined ? String(css).slice(0, 20000) : site.css, updatedAt: Date.now() } });
        return res.status(200).json(await db.collection('sites').findOne({ id }));
      }
      if (req.method === 'DELETE') {
        const u = await getUser(req);
        if (!u) return res.status(401).json({ error: 'Auth required' });
        const site = await db.collection('sites').findOne({ id });
        if (!site) return res.status(404).json({ error: 'Not found' });
        if (site.author !== u) return res.status(403).json({ error: 'Not your site' });
        await db.collection('sites').deleteOne({ id });
        return res.status(200).json({ deleted: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ---- SERVE SITE HTML (for /site/:id via rewrite) ----
    if (seg[0] === 'site' || (req.url && req.url.startsWith('/site/'))) {
      const parts = (req.url || '').split('/').filter(Boolean);
      const id = parts[parts.length - 1];
      if (!id || id === 'site') return res.status(400).send(errPage('No site', 'Provide a site ID.'));
      const db = await getDb();
      const site = await db.collection('sites').findOne({ id });
      if (!site) return res.status(404).send(errPage('Not Found', `Site "${escHtml(id)}" does not exist.`));
      await db.collection('sites').updateOne({ id }, { $inc: { views: 1 } });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escHtml(site.title)}</title><style>${site.css}</style></head><body>${site.html}</body></html>`);
    }

    // ---- WIKI ----
    if (seg[0] === 'wiki') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      const path = req.query?.path;
      if (!path) return res.status(400).json({ error: 'Missing path' });
      const clean = String(path).replace(/[^a-zA-Z0-9\-\/]/g, '');
      const url = `https://backrooms-wiki.wikidot.com/${clean}`;
      const r = await fetch(url, { headers: { 'User-Agent': 'BackOS/4.0.011' } });
      if (!r.ok) return res.status(r.status).json({ error: 'Page not found' });
      const html = await r.text();
      const cm = html.match(/<div id="page-content">([\s\S]*?)<\/div>\s*<\/div>\s*<div/);
      const tm = html.match(/<div id="page-title">\s*([\s\S]*?)\s*<\/div>/);
      let content = cm ? cm[1] : '';
      content = content.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/href="\//g, 'href="https://backrooms-wiki.wikidot.com/').replace(/src="\//g, 'src="https://backrooms-wiki.wikidot.com/');
      return res.status(200).json({ title: tm ? tm[1].trim() : clean, content, url, path: clean });
    }

    // ---- SEED ----
    if (seg[0] === 'seed') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
      const db = await getDb();
      const seeds = [
        { id: 'level0guide', title: 'Level 0 Survival Guide', html: '<h1>Level 0 Survival Guide</h1><p>Do NOT run. Walking pace only.</p>', css: 'body{background:#0a0a00;color:#FFD700;font-family:monospace;padding:40px}', author: 'system', createdAt: Date.now() - 604800000, updatedAt: Date.now() - 172800000, views: 1247 },
        { id: 'entitydb', title: 'Entity Database', html: '<h1>Entity Database</h1><p>Smiler - EXTREME threat - ACTIVE</p>', css: 'body{background:#000;color:#FFD700;font-family:monospace;padding:40px}', author: 'system', createdAt: Date.now() - 1209600000, updatedAt: Date.now() - 432000000, views: 3891 },
        { id: 'exitmap', title: 'EXIT PROTOCOL', html: '<h1 style="color:red">EXIT PROTOCOL</h1><p>CLASSIFIED</p><p>Step 1: ████████</p>', css: 'body{background:#050500;color:#FFD700;font-family:monospace;padding:40px}', author: 'unknown', createdAt: Date.now() - 2592000000, updatedAt: Date.now() - 2592000000, views: 8204 },
      ];
      let n = 0;
      for (const s of seeds) { if (!(await db.collection('sites').findOne({ id: s.id }))) { await db.collection('sites').insertOne(s); n++; } }
      return res.status(200).json({ seeded: n });
    }

    // ---- MESSAGES ----
    if (seg[0] === 'messages') {
      const db = await getDb();
      if (req.method === 'GET') {
        const user = req.query?.user;
        if (!user) return res.status(400).json({ error: 'Missing user' });
        const msgs = await db.collection('messages').find({ to: String(user).toLowerCase() }).sort({ timestamp: -1 }).toArray();
        return res.status(200).json({ messages: msgs });
      }
      if (req.method === 'POST') {
        const u = await getUser(req);
        if (!u) return res.status(401).json({ error: 'Auth required' });
        const { to, subject, body } = req.body;
        if (!to || !subject || !body) return res.status(400).json({ error: 'Missing fields' });
        const msg = { id: genId(), from: u, to: String(to).toLowerCase(), subject, body, timestamp: Date.now(), read: false };
        await db.collection('messages').insertOne(msg);
        return res.status(201).json({ message: msg });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ---- POSTS LIST ----
    if (seg[0] === 'posts' && (!seg[1] || seg[1] === '')) {
      const db = await getDb();
      if (req.method === 'GET') {
        const board = String(req.query?.board || 'general').toLowerCase();
        if (!BOARDS.includes(board)) return res.status(400).json({ error: 'Invalid board' });
        const posts = await db.collection('posts').find({ board }).sort({ timestamp: -1 }).toArray();
        return res.status(200).json({ posts });
      }
      if (req.method === 'POST') {
        const u = await getUser(req);
        if (!u) return res.status(401).json({ error: 'Auth required' });
        const { board, title, body, author } = req.body;
        if (!board || !title || !body) return res.status(400).json({ error: 'Missing fields' });
        const b = board.toLowerCase();
        if (!BOARDS.includes(b)) return res.status(400).json({ error: 'Invalid board' });
        const post = { id: genId(), board: b, title, body, author: author || u, timestamp: Date.now(), replies: [] };
        await db.collection('posts').insertOne(post);
        return res.status(201).json({ post });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ---- POST BY ID ----
    if (seg[0] === 'posts' && seg[1]) {
      const db = await getDb();
      if (req.method === 'GET') {
        const post = await db.collection('posts').findOne({ id: seg[1] });
        if (!post) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json({ post });
      }
      if (req.method === 'POST') {
        const u = await getUser(req);
        if (!u) return res.status(401).json({ error: 'Auth required' });
        const { body, author } = req.body;
        if (!body) return res.status(400).json({ error: 'Missing body' });
        const reply = { id: genId(), body, author: author || u, timestamp: Date.now() };
        const r = await db.collection('posts').updateOne({ id: seg[1] }, { $push: { replies: reply } as any });
        if (r.matchedCount === 0) return res.status(404).json({ error: 'Not found' });
        return res.status(201).json({ reply });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ---- FORUM LIST ----
    if (seg[0] === 'forum' && (!seg[1] || seg[1] === '')) {
      const db = await getDb();
      if (req.method === 'GET') {
        const threads = await db.collection('threads').find({}).sort({ timestamp: -1 }).toArray();
        return res.status(200).json({ threads });
      }
      if (req.method === 'POST') {
        const u = await getUser(req);
        if (!u) return res.status(401).json({ error: 'Auth required' });
        const { title, body, author, category } = req.body;
        if (!title || !body || !category) return res.status(400).json({ error: 'Missing fields' });
        if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
        const thread = { id: genId(), title, body, author: author || u, category, timestamp: Date.now(), replies: [] };
        await db.collection('threads').insertOne(thread);
        return res.status(201).json({ thread });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ---- FORUM BY ID ----
    if (seg[0] === 'forum' && seg[1]) {
      const db = await getDb();
      if (req.method === 'GET') {
        const thread = await db.collection('threads').findOne({ id: seg[1] });
        if (!thread) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json({ thread });
      }
      if (req.method === 'POST') {
        const u = await getUser(req);
        if (!u) return res.status(401).json({ error: 'Auth required' });
        const { body, author } = req.body;
        if (!body) return res.status(400).json({ error: 'Missing body' });
        const reply = { id: genId(), body, author: author || u, timestamp: Date.now() };
        const r = await db.collection('threads').updateOne({ id: seg[1] }, { $push: { replies: reply } as any });
        if (r.matchedCount === 0) return res.status(404).json({ error: 'Not found' });
        return res.status(201).json({ reply });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ---- CHAT ----
    if (seg[0] === 'chat') {
      const db = await getDb();
      if (req.method === 'GET') {
        const ch = String(req.query?.channel || 'general').toLowerCase();
        if (!CHANNELS.includes(ch)) return res.status(400).json({ error: 'Invalid channel' });
        const msgs = await db.collection('chat').find({ channel: ch }).sort({ timestamp: -1 }).limit(50).toArray();
        return res.status(200).json({ messages: msgs.reverse() });
      }
      if (req.method === 'POST') {
        const u = await getUser(req);
        if (!u) return res.status(401).json({ error: 'Auth required' });
        const { channel, body, author } = req.body;
        if (!channel || !body) return res.status(400).json({ error: 'Missing fields' });
        const ch = channel.toLowerCase();
        if (!CHANNELS.includes(ch)) return res.status(400).json({ error: 'Invalid channel' });
        const msg = { id: genId(), author: author || u, body, channel: ch, timestamp: Date.now() };
        await db.collection('chat').insertOne(msg);
        return res.status(201).json({ message: msg });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
