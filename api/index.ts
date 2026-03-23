import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_lib/db';

async function getCrypto() {
  return await import('node:crypto');
}

// ============================================================
// Shared types
// ============================================================

interface UserRecord {
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

interface SiteData {
  id: string;
  title: string;
  html: string;
  css: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  views: number;
}

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: number;
  read: boolean;
}

interface PostReply {
  id: string;
  body: string;
  author: string;
  timestamp: number;
}

interface Post {
  id: string;
  board: string;
  title: string;
  body: string;
  author: string;
  timestamp: number;
  replies: PostReply[];
}

interface Thread {
  id: string;
  title: string;
  body: string;
  author: string;
  category: string;
  timestamp: number;
  replies: PostReply[];
}

interface ChatMessage {
  id: string;
  author: string;
  body: string;
  channel: string;
  timestamp: number;
}

// ============================================================
// Shared helpers
// ============================================================

async function hashPassword(password: string, salt: string): Promise<string> {
  const crypto = await getCrypto();
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

async function generateToken(): Promise<string> {
  const crypto = await getCrypto();
  return crypto.randomBytes(32).toString('hex');
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function authenticate(req: VercelRequest): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const db = await getDb();
  const session = await db.collection('sessions').findOne({ token });
  return session?.username ?? null;
}

function parseRoute(url: string): { segments: string[]; path: string } {
  const parsed = new URL(url, 'http://localhost');
  const pathname = parsed.pathname;
  const withoutApi = pathname.replace(/^\/api\/?/, '');
  const segments = withoutApi.split('/').filter(Boolean);
  return { segments, path: withoutApi };
}

// ============================================================
// Constants
// ============================================================

const VALID_POST_BOARDS = ['general', 'levels', 'entities', 'survival', 'random'];

const VALID_FORUM_CATEGORIES = [
  'General Discussion',
  'Level Reports',
  'Entity Sightings',
  'Technical Help',
  'Trading Post',
];

const VALID_CHAT_CHANNELS = ['general', 'level-0', 'level-1', 'entity-alerts', 'off-topic'];

const EXAMPLE_SITES: SiteData[] = [
  {
    id: 'level0guide',
    title: 'Level 0 Survival Guide',
    html: `<div class="guide"><h1>🏢 Level 0 — Survival Guide</h1><div class="warning">⚠ MANDATORY READING FOR ALL WANDERERS ⚠</div><h2>Overview</h2><p>Level 0 is an expansive non-linear space. The fluorescent lights hum at exactly 60Hz. The carpet is perpetually damp.</p><h2>Rules</h2><ul><li>Do NOT run. Walking pace only.</li><li>If the lights flicker, stop moving and close your eyes for 10 seconds.</li><li>The buzzing is normal. If it stops — that is NOT normal.</li><li>Do not enter rooms with moving wallpaper.</li><li>If you smell almonds, leave the area in 30 seconds.</li></ul><div class="footer">Published via BackNET Deploy™</div></div>`,
    css: `@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');body{margin:0;background:#0a0a00;color:#FFD700;font-family:'VT323',monospace}.guide{max-width:600px;margin:0 auto;padding:30px 20px}h1{font-size:28px;text-shadow:0 0 15px rgba(255,215,0,0.5)}h2{font-size:20px;color:#FFC000;margin-top:24px;border-bottom:1px solid #333;padding-bottom:4px}.warning{background:rgba(255,0,0,0.15);border:1px solid #aa3333;color:#ff6666;padding:10px;text-align:center;font-size:18px;margin:16px 0}p,li{color:#B8960F;line-height:1.6}.footer{margin-top:40px;font-size:12px;color:#555;text-align:center;border-top:1px solid #222;padding-top:12px}`,
    author: 'system', createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 * 2, views: 1247,
  },
  {
    id: 'entitydb',
    title: 'Entity Database Terminal',
    html: `<div class="terminal"><div class="header"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div><span class="header-text">entity_database.exe</span></div><div class="output"><p class="sys">[SYSTEM] Entity Database v2.7 initialized...</p><p class="cmd">> LIST ENTITIES --threat-level HIGH</p><table><tr><th>ID</th><th>Name</th><th>Threat</th><th>Status</th></tr><tr><td>001</td><td>Smiler</td><td class="high">EXTREME</td><td>ACTIVE</td></tr><tr><td>007</td><td>Hound</td><td class="high">HIGH</td><td>ACTIVE</td></tr><tr><td>012</td><td>Skin-Stealer</td><td class="high">EXTREME</td><td>ACTIVE</td></tr></table><p class="cmd">> QUERY proximity</p><p class="warn">[WARNING] 3 entities within 200m. Nearest: SMILER — 47m — APPROACHING</p><p class="cursor">_</p></div></div>`,
    css: `@import url('https://fonts.googleapis.com/css2?family=Fira+Code&display=swap');body{margin:0;background:#000;font-family:'Fira Code',monospace;font-size:13px}.terminal{height:100vh;display:flex;flex-direction:column}.header{background:#1a1600;padding:8px 12px;display:flex;align-items:center;gap:6px}.dot{width:10px;height:10px;border-radius:50%}.red{background:#ff5f56}.yellow{background:#ffbd2e}.green{background:#27c93f}.header-text{color:#8B7500;margin-left:8px;font-size:11px}.output{flex:1;padding:16px;overflow-y:auto;background:#0a0800}p{margin:2px 0}.sys{color:#8B7500}.cmd{color:#FFD700}.warn{color:#ff6600}.high{color:#ff4444;font-weight:bold}table{border-collapse:collapse;margin:4px 0;width:100%}td,th{border:1px solid #333;padding:4px 10px;color:#B8960F;text-align:left}th{background:#1a1600;color:#FFD700}.cursor{color:#FFD700;animation:blink 1s step-end infinite}@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}`,
    author: 'system', createdAt: Date.now() - 86400000 * 14, updatedAt: Date.now() - 86400000 * 5, views: 3891,
  },
  {
    id: 'exitmap',
    title: '██████ EXIT PROTOCOL ██████',
    html: `<div class="page"><h1>EXIT PROTOCOL</h1><div class="classified">CLASSIFIED — THE LEADERS EYES ONLY</div><div class="content"><p>If you are reading this, you have Level 5 clearance.</p><h2>Step 1: ████████████</h2><p>Navigate to Level ██ and locate the ████████.</p><h2>Step 2: ████████████████</h2><p>Once you have ████████, proceed to the ████████ on Level ██.</p><h2>Step 3: The Threshold</h2><p class="corrupt">T̸h̷e̵ ̶e̷x̸i̶t̴ ̵d̸o̷e̸s̵ ̶n̸o̶t̷ ̵e̶x̵i̸s̷t̶.̷</p></div><div class="footer">This document will self-corrupt in ██:██:██</div></div>`,
    css: `@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');body{margin:0;background:#050500;color:#FFD700;font-family:'VT323',monospace}.page{max-width:600px;margin:0 auto;padding:30px 20px}h1{font-size:32px;text-align:center;text-shadow:0 0 20px rgba(255,0,0,0.5);color:#ff4444;letter-spacing:4px}h2{font-size:18px;color:#FFD700;margin-top:20px}.classified{text-align:center;background:rgba(255,0,0,0.2);border:1px solid #aa0000;color:#ff4444;padding:8px;margin:12px 0 24px;font-size:14px;letter-spacing:2px;animation:pulse 2s infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}.content p{color:#B8960F;line-height:1.7;margin:6px 0}.corrupt{color:#ff4444;font-size:14px;margin-top:20px;animation:glitch .5s infinite}@keyframes glitch{0%{transform:translate(0)}20%{transform:translate(-2px,1px)}40%{transform:translate(1px,-1px)}60%{transform:translate(-1px,2px)}80%{transform:translate(2px,-1px)}100%{transform:translate(0)}}.footer{margin-top:40px;text-align:center;color:#553300;font-size:14px}`,
    author: 'unknown', createdAt: Date.now() - 86400000 * 30, updatedAt: Date.now() - 86400000 * 30, views: 8204,
  },
];

// ============================================================
// Route handlers
// ============================================================

async function handleAuthLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    const cleanUsername = String(username).trim().toLowerCase();
    const db = await getDb();
    const user = await db.collection('users').findOne({ username: cleanUsername }) as UserRecord | null;
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    const hash = await hashPassword(String(password), user.salt);
    if (hash !== user.passwordHash) return res.status(401).json({ error: 'Invalid username or password' });
    const token = await generateToken();
    await db.collection('sessions').insertOne({ token, username: cleanUsername, createdAt: new Date() });
    return res.status(200).json({ username: cleanUsername, token });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleAuthRegister(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanUsername.length < 2 || cleanUsername.length > 30) return res.status(400).json({ error: 'Username must be 2-30 characters' });
    if (!/^[a-z0-9_-]+$/.test(cleanUsername)) return res.status(400).json({ error: 'Username can only contain letters, numbers, hyphens, and underscores' });
    if (String(password).length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
    const db = await getDb();
    const existing = await db.collection('users').findOne({ username: cleanUsername });
    if (existing) return res.status(409).json({ error: 'Username already taken' });
    const crypto = await getCrypto();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(String(password), salt);
    await db.collection('users').insertOne({ username: cleanUsername, passwordHash, salt, createdAt: Date.now() });
    const token = await generateToken();
    await db.collection('sessions').insertOne({ token, username: cleanUsername, createdAt: new Date() });
    return res.status(201).json({ username: cleanUsername, token });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleAuthVerify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const db = await getDb();
    const session = await db.collection('sessions').findOne({ token });
    if (!session) return res.status(401).json({ error: 'Invalid or expired session' });
    return res.status(200).json({ username: session.username });
  } catch (err: any) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleAuthPassword(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const db = await getDb();
    const session = await db.collection('sessions').findOne({ token });
    if (!session) return res.status(401).json({ error: 'Invalid or expired session' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
    if (String(newPassword).length < 4) return res.status(400).json({ error: 'New password must be at least 4 characters' });
    const user = await db.collection('users').findOne({ username: session.username }) as UserRecord | null;
    if (!user) return res.status(404).json({ error: 'User not found' });
    const currentHash = await hashPassword(String(currentPassword), user.salt);
    if (currentHash !== user.passwordHash) return res.status(401).json({ error: 'Current password is incorrect' });
    const crypto = await getCrypto();
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = await hashPassword(String(newPassword), newSalt);
    await db.collection('users').updateOne({ username: session.username }, { $set: { passwordHash: newHash, salt: newSalt } });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Password change error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleSitesList(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getDb();
    if (req.method === 'GET') {
      const sites = await db.collection('sites').find({}, { projection: { html: 0, css: 0 } }).sort({ updatedAt: -1 }).toArray();
      return res.status(200).json(sites);
    }
    if (req.method === 'POST') {
      let author = 'anonymous';
      const authUser = await authenticate(req);
      if (authUser) author = authUser;
      const { title, html, css } = req.body;
      if (!title || !html) return res.status(400).json({ error: 'Title and HTML are required' });
      const id = generateId();
      const now = Date.now();
      const site: SiteData = { id, title: String(title).slice(0, 100), html: String(html).slice(0, 50000), css: String(css || '').slice(0, 20000), author, createdAt: now, updatedAt: now, views: 0 };
      await db.collection('sites').insertOne(site);
      return res.status(201).json({ id, url: `/site/${id}` });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Sites API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleSiteById(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) return res.status(400).json({ error: 'Missing site ID' });
  try {
    const db = await getDb();
    if (req.method === 'GET') {
      const site = await db.collection('sites').findOne({ id });
      if (!site) return res.status(404).json({ error: 'Site not found' });
      await db.collection('sites').updateOne({ id }, { $inc: { views: 1 } });
      return res.status(200).json(site);
    }
    if (req.method === 'PUT') {
      const authUser = await authenticate(req);
      if (!authUser) return res.status(401).json({ error: 'Authentication required' });
      const existing = await db.collection('sites').findOne({ id });
      if (!existing) return res.status(404).json({ error: 'Site not found' });
      if (existing.author !== authUser) return res.status(403).json({ error: 'You can only edit your own sites' });
      const { title, html, css } = req.body;
      await db.collection('sites').updateOne({ id }, { $set: { title: title ? String(title).slice(0, 100) : existing.title, html: html ? String(html).slice(0, 50000) : existing.html, css: css !== undefined ? String(css).slice(0, 20000) : existing.css, updatedAt: Date.now() } });
      const updated = await db.collection('sites').findOne({ id });
      return res.status(200).json(updated);
    }
    if (req.method === 'DELETE') {
      const authUser = await authenticate(req);
      if (!authUser) return res.status(401).json({ error: 'Authentication required' });
      const existing = await db.collection('sites').findOne({ id });
      if (!existing) return res.status(404).json({ error: 'Site not found' });
      if (existing.author !== authUser) return res.status(403).json({ error: 'You can only delete your own sites' });
      await db.collection('sites').deleteOne({ id });
      return res.status(200).json({ deleted: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Site API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleWiki(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { path } = req.query;
  if (!path || typeof path !== 'string') return res.status(400).json({ error: 'Missing wiki path' });
  const cleanPath = String(path).replace(/[^a-zA-Z0-9\-\/]/g, '');
  try {
    const url = `https://backrooms-wiki.wikidot.com/${cleanPath}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'BackOS/4.0.011 BackNET-Explorer' } });
    if (!response.ok) return res.status(response.status).json({ error: 'Page not found on the wiki' });
    const html = await response.text();
    const contentMatch = html.match(/<div id="page-content">([\s\S]*?)<\/div>\s*<\/div>\s*<div/);
    const titleMatch = html.match(/<div id="page-title">\s*([\s\S]*?)\s*<\/div>/);
    const pageTitle = titleMatch ? titleMatch[1].trim() : cleanPath;
    let pageContent = contentMatch ? contentMatch[1] : '';
    pageContent = pageContent.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/href="\//g, 'href="https://backrooms-wiki.wikidot.com/').replace(/src="\//g, 'src="https://backrooms-wiki.wikidot.com/');
    return res.status(200).json({ title: pageTitle, content: pageContent, url, path: cleanPath });
  } catch (err: any) {
    console.error('Wiki fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch wiki page' });
  }
}

async function handleSeed(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const db = await getDb();
    let seeded = 0;
    for (const site of EXAMPLE_SITES) {
      const existing = await db.collection('sites').findOne({ id: site.id });
      if (!existing) {
        await db.collection('sites').insertOne(site);
        seeded++;
      }
    }
    return res.status(200).json({ message: `Seeded ${seeded} example sites`, total: EXAMPLE_SITES.length });
  } catch (err: any) {
    console.error('Seed error:', err);
    return res.status(500).json({ error: 'Failed to seed' });
  }
}

async function handleMessages(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getDb();
    if (req.method === 'GET') {
      const user = req.query.user as string;
      if (!user) return res.status(400).json({ error: 'Missing user parameter' });
      const messages = await db.collection('messages').find({ to: user.toLowerCase() }).sort({ timestamp: -1 }).toArray();
      return res.status(200).json({ messages });
    }
    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) return res.status(401).json({ error: 'Authentication required' });
      const { to, from, subject, body } = req.body;
      if (!to || !subject || !body) return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
      const message: Message = { id: generateId(), from: from || username, to: to.toLowerCase(), subject, body, timestamp: Date.now(), read: false };
      await db.collection('messages').insertOne(message);
      return res.status(201).json({ message });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Messages API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePostsList(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getDb();
    if (req.method === 'GET') {
      const board = (req.query.board as string || 'general').toLowerCase();
      if (!VALID_POST_BOARDS.includes(board)) return res.status(400).json({ error: `Invalid board` });
      const posts = await db.collection('posts').find({ board }).sort({ timestamp: -1 }).toArray();
      return res.status(200).json({ posts });
    }
    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) return res.status(401).json({ error: 'Authentication required' });
      const { board, title, body, author } = req.body;
      if (!board || !title || !body) return res.status(400).json({ error: 'Missing required fields: board, title, body' });
      const boardLower = board.toLowerCase();
      if (!VALID_POST_BOARDS.includes(boardLower)) return res.status(400).json({ error: `Invalid board` });
      const post: Post = { id: generateId(), board: boardLower, title, body, author: author || username, timestamp: Date.now(), replies: [] };
      await db.collection('posts').insertOne(post);
      return res.status(201).json({ post });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Posts API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePostById(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) return res.status(400).json({ error: 'Missing post ID' });
  try {
    const db = await getDb();
    if (req.method === 'GET') {
      const post = await db.collection('posts').findOne({ id });
      if (!post) return res.status(404).json({ error: 'Post not found' });
      return res.status(200).json({ post });
    }
    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) return res.status(401).json({ error: 'Authentication required' });
      const { body, author } = req.body;
      if (!body) return res.status(400).json({ error: 'Missing required field: body' });
      const reply: PostReply = { id: generateId(), body, author: author || username, timestamp: Date.now() };
      const result = await db.collection('posts').updateOne({ id }, { $push: { replies: reply } as any });
      if (result.matchedCount === 0) return res.status(404).json({ error: 'Post not found' });
      return res.status(201).json({ reply });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Post detail API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleForumList(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getDb();
    if (req.method === 'GET') {
      const threads = await db.collection('threads').find({}).sort({ timestamp: -1 }).toArray();
      return res.status(200).json({ threads });
    }
    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) return res.status(401).json({ error: 'Authentication required' });
      const { title, body, author, category } = req.body;
      if (!title || !body || !category) return res.status(400).json({ error: 'Missing required fields: title, body, category' });
      if (!VALID_FORUM_CATEGORIES.includes(category)) return res.status(400).json({ error: `Invalid category` });
      const thread: Thread = { id: generateId(), title, body, author: author || username, category, timestamp: Date.now(), replies: [] };
      await db.collection('threads').insertOne(thread);
      return res.status(201).json({ thread });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Forum API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleForumById(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) return res.status(400).json({ error: 'Missing thread ID' });
  try {
    const db = await getDb();
    if (req.method === 'GET') {
      const thread = await db.collection('threads').findOne({ id });
      if (!thread) return res.status(404).json({ error: 'Thread not found' });
      return res.status(200).json({ thread });
    }
    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) return res.status(401).json({ error: 'Authentication required' });
      const { body, author } = req.body;
      if (!body) return res.status(400).json({ error: 'Missing required field: body' });
      const reply: PostReply = { id: generateId(), body, author: author || username, timestamp: Date.now() };
      const result = await db.collection('threads').updateOne({ id }, { $push: { replies: reply } as any });
      if (result.matchedCount === 0) return res.status(404).json({ error: 'Thread not found' });
      return res.status(201).json({ reply });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Forum thread API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleChat(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getDb();
    if (req.method === 'GET') {
      const channel = (req.query.channel as string || 'general').toLowerCase();
      if (!VALID_CHAT_CHANNELS.includes(channel)) return res.status(400).json({ error: `Invalid channel` });
      const messages = await db.collection('chat').find({ channel }).sort({ timestamp: -1 }).limit(50).toArray();
      return res.status(200).json({ messages: messages.reverse() });
    }
    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) return res.status(401).json({ error: 'Authentication required' });
      const { channel, body, author } = req.body;
      if (!channel || !body) return res.status(400).json({ error: 'Missing required fields: channel, body' });
      const channelLower = channel.toLowerCase();
      if (!VALID_CHAT_CHANNELS.includes(channelLower)) return res.status(400).json({ error: `Invalid channel` });
      const message: ChatMessage = { id: generateId(), author: author || username, body, channel: channelLower, timestamp: Date.now() };
      await db.collection('chat').insertOne(message);
      return res.status(201).json({ message });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================
// Main router
// ============================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { segments } = parseRoute(req.url || '');

    // Health check
    if (segments[0] === 'health') {
      try {
        const db = await getDb();
        await db.command({ ping: 1 });
        return res.status(200).json({ status: 'ok', db: 'connected' });
      } catch (err: any) {
        return res.status(500).json({ status: 'error', error: err.message });
      }
    }

    if (segments[0] === 'auth' && segments[1] === 'login') return handleAuthLogin(req, res);
    if (segments[0] === 'auth' && segments[1] === 'register') return handleAuthRegister(req, res);
    if (segments[0] === 'auth' && segments[1] === 'verify') return handleAuthVerify(req, res);
    if (segments[0] === 'auth' && segments[1] === 'password') return handleAuthPassword(req, res);

    if (segments[0] === 'sites') {
      if (segments.length === 1 || segments[1] === '') return handleSitesList(req, res);
      return handleSiteById(req, res, segments[1]);
    }

    if (segments[0] === 'wiki') return handleWiki(req, res);
    if (segments[0] === 'seed') return handleSeed(req, res);
    if (segments[0] === 'messages') return handleMessages(req, res);

    if (segments[0] === 'posts') {
      if (segments.length === 1 || segments[1] === '') return handlePostsList(req, res);
      return handlePostById(req, res, segments[1]);
    }

    if (segments[0] === 'forum') {
      if (segments.length === 1 || segments[1] === '') return handleForumList(req, res);
      return handleForumById(req, res, segments[1]);
    }

    if (segments[0] === 'chat') return handleChat(req, res);

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('Unhandled API error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
