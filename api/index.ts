import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import crypto from 'crypto';

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
  timestamp: number;
}

// ============================================================
// Shared helpers
// ============================================================

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateToken(): string {
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
  const session = await kv.get<{ username: string }>(`session:${token}`);
  return session?.username ?? null;
}

function parseRoute(url: string): { segments: string[]; path: string } {
  const parsed = new URL(url, 'http://localhost');
  const pathname = parsed.pathname;
  // Remove /api prefix and split
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
    html: `<div class="guide">
  <h1>🏢 Level 0 — Survival Guide</h1>
  <div class="warning">⚠ MANDATORY READING FOR ALL WANDERERS ⚠</div>
  <h2>Overview</h2>
  <p>Level 0 is an expansive non-linear space resembling the backrooms of a retail building. The fluorescent lights hum at exactly 60Hz. The carpet is perpetually damp. You are <em>never</em> truly alone here.</p>
  <h2>Rules</h2>
  <ul>
    <li>Do NOT run. Walking pace only.</li>
    <li>If the lights flicker, stop moving immediately and close your eyes for 10 seconds.</li>
    <li>The buzzing is normal. If it stops — that is NOT normal.</li>
    <li>Do not enter rooms with wallpaper that appears to be moving.</li>
    <li>If you smell almonds, you have approximately 30 seconds to leave the area.</li>
  </ul>
  <h2>Navigation</h2>
  <p>There is no reliable map. Corridors shift. Mark your path with anything you have — but do not be surprised when your marks disappear.</p>
  <div class="footer">Published via BackNET Deploy™ — Back OS™ v4.0.011</div>
</div>`,
    css: `@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
body { margin: 0; background: #0a0a00; color: #FFD700; font-family: 'VT323', monospace; }
.guide { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
h1 { font-size: 28px; text-shadow: 0 0 15px rgba(255,215,0,0.5); margin-bottom: 8px; }
h2 { font-size: 20px; color: #FFC000; margin-top: 24px; border-bottom: 1px solid #333; padding-bottom: 4px; }
.warning { background: rgba(255,0,0,0.15); border: 1px solid #aa3333; color: #ff6666; padding: 10px; text-align: center; font-size: 18px; margin: 16px 0; animation: blink 2s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.7} }
p { color: #B8960F; line-height: 1.6; margin: 8px 0; }
ul { color: #B8960F; margin: 8px 0 8px 20px; }
li { margin: 6px 0; line-height: 1.4; }
em { color: #FFD700; }
.footer { margin-top: 40px; font-size: 12px; color: #555; text-align: center; border-top: 1px solid #222; padding-top: 12px; }`,
    author: 'system',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2,
    views: 1247,
  },
  {
    id: 'entitydb',
    title: 'Entity Database Terminal',
    html: `<div class="terminal">
  <div class="header">
    <div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div>
    <span class="header-text">entity_database.exe — Back OS™ Terminal</span>
  </div>
  <div class="output">
    <p class="sys">[SYSTEM] Entity Database v2.7 initialized...</p>
    <p class="sys">[SYSTEM] Connected to BackNET node 0x4F2A...</p>
    <p class="sys">[SYSTEM] Loading entity records...</p>
    <br>
    <p class="cmd">> LIST ENTITIES --threat-level HIGH</p>
    <br>
    <table>
      <tr><th>ID</th><th>Name</th><th>Level</th><th>Threat</th><th>Status</th></tr>
      <tr><td>001</td><td>Smiler</td><td>0-3</td><td class="high">EXTREME</td><td>ACTIVE</td></tr>
      <tr><td>007</td><td>Hound</td><td>1-4</td><td class="high">HIGH</td><td>ACTIVE</td></tr>
      <tr><td>012</td><td>Skin-Stealer</td><td>2-5</td><td class="high">EXTREME</td><td>ACTIVE</td></tr>
      <tr><td>019</td><td>Clump</td><td>0-2</td><td class="med">MEDIUM</td><td>DORMANT</td></tr>
      <tr><td>034</td><td>Wretcher</td><td>1-3</td><td class="high">HIGH</td><td>ACTIVE</td></tr>
    </table>
    <br>
    <p class="cmd">> QUERY proximity --current-level</p>
    <p class="warn">[WARNING] 3 entities detected within 200m of your location.</p>
    <p class="warn">[WARNING] Nearest entity: SMILER — 47m — APPROACHING</p>
    <p class="sys">[SYSTEM] Recommend immediate relocation.</p>
    <p class="cursor">_</p>
  </div>
</div>`,
    css: `@import url('https://fonts.googleapis.com/css2?family=Fira+Code&display=swap');
body { margin: 0; background: #000; font-family: 'Fira Code', monospace; font-size: 13px; }
.terminal { height: 100vh; display: flex; flex-direction: column; }
.header { background: #1a1600; padding: 8px 12px; display: flex; align-items: center; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.red { background: #ff5f56; }
.yellow { background: #ffbd2e; }
.green { background: #27c93f; }
.header-text { color: #8B7500; margin-left: 8px; font-size: 11px; }
.output { flex: 1; padding: 16px; overflow-y: auto; background: #0a0800; }
p { margin: 2px 0; }
.sys { color: #8B7500; }
.cmd { color: #FFD700; }
.warn { color: #ff6600; }
.high { color: #ff4444; font-weight: bold; }
.med { color: #ffaa00; }
table { border-collapse: collapse; margin: 4px 0; width: 100%; }
td, th { border: 1px solid #333; padding: 4px 10px; color: #B8960F; text-align: left; }
th { background: #1a1600; color: #FFD700; }
.cursor { color: #FFD700; animation: blink 1s step-end infinite; }
@keyframes blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }`,
    author: 'system',
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000 * 5,
    views: 3891,
  },
  {
    id: 'exitmap',
    title: '██████ EXIT PROTOCOL ██████',
    html: `<div class="page">
  <h1>EXIT PROTOCOL</h1>
  <div class="classified">CLASSIFIED — THE LEADERS EYES ONLY</div>
  <div class="content">
    <p>If you are reading this, you have been granted Level 5 clearance.</p>
    <p>The following information details the theoretical exit procedure from the Backrooms.</p>
    <br>
    <h2>Step 1: ████████████</h2>
    <p>Navigate to Level ██ and locate the ████████ near the ██████████. You will need to ████████████████████████.</p>
    <h2>Step 2: ████████████████</h2>
    <p>Once you have ████████, proceed to the ████████ on Level ██. Do NOT ████████ under any circumstances. The ████████ will ████████████.</p>
    <h2>Step 3: The Threshold</h2>
    <p>At the ████████, you will see a ████████ that ████████████████████████████████████████████████████████████████████████.</p>
    <p class="corrupt">T̸h̷e̵ ̶e̷x̸i̶t̴ ̵d̸o̷e̸s̵ ̶n̸o̶t̷ ̵e̶x̵i̸s̷t̶.̷ ̵T̶h̴e̵ ̸e̴x̶i̸t̸ ̵d̵o̶e̴s̷ ̷n̶o̸t̵ ̷e̸x̸i̴s̵t̸.̵ ̸T̵h̷e̵ ̸e̸x̷i̴t̸ ̶d̷o̸e̶s̷ ̶n̵o̴t̷ ̶e̸x̸i̷s̶t̴.̵</p>
  </div>
  <div class="footer">This document will self-corrupt in ██:██:██</div>
</div>`,
    css: `@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
body { margin: 0; background: #050500; color: #FFD700; font-family: 'VT323', monospace; }
.page { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
h1 { font-size: 32px; text-align: center; text-shadow: 0 0 20px rgba(255,0,0,0.5); color: #ff4444; letter-spacing: 4px; }
h2 { font-size: 18px; color: #FFD700; margin-top: 20px; }
.classified { text-align: center; background: rgba(255,0,0,0.2); border: 1px solid #aa0000; color: #ff4444; padding: 8px; margin: 12px 0 24px; font-size: 14px; letter-spacing: 2px; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
.content p { color: #B8960F; line-height: 1.7; margin: 6px 0; }
.corrupt { color: #ff4444; font-size: 14px; margin-top: 20px; animation: glitch 0.5s infinite; }
@keyframes glitch { 0%{transform:translate(0)} 20%{transform:translate(-2px,1px)} 40%{transform:translate(1px,-1px)} 60%{transform:translate(-1px,2px)} 80%{transform:translate(2px,-1px)} 100%{transform:translate(0)} }
.footer { margin-top: 40px; text-align: center; color: #553300; font-size: 14px; }`,
    author: 'unknown',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 30,
    views: 8204,
  },
];

// ============================================================
// Route handlers
// ============================================================

async function handleAuthLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = String(username).trim().toLowerCase();

    const user = await kv.get<UserRecord>(`user:${cleanUsername}`);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const hash = hashPassword(String(password), user.salt);
    if (hash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken();
    await kv.set(`session:${token}`, { username: cleanUsername }, { ex: 60 * 60 * 24 * 30 });

    return res.status(200).json({
      username: cleanUsername,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleAuthRegister(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = String(username).trim().toLowerCase();

    if (cleanUsername.length < 2 || cleanUsername.length > 30) {
      return res.status(400).json({ error: 'Username must be 2-30 characters' });
    }

    if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, hyphens, and underscores' });
    }

    if (String(password).length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const existing = await kv.get(`user:${cleanUsername}`);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(String(password), salt);

    const user: UserRecord = {
      username: cleanUsername,
      passwordHash,
      salt,
      createdAt: Date.now(),
    };

    await kv.set(`user:${cleanUsername}`, user);
    await kv.sadd('users:index', cleanUsername);

    const token = generateToken();
    await kv.set(`session:${token}`, { username: cleanUsername }, { ex: 60 * 60 * 24 * 30 });

    return res.status(201).json({
      username: cleanUsername,
      token,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleAuthVerify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const session = await kv.get<{ username: string }>(`session:${token}`);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

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

    const currentHash = hashPassword(String(currentPassword), user.salt);
    if (currentHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

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

async function handleSitesList(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const siteIds: string[] = (await kv.smembers('sites:index')) || [];
      const sites: SiteData[] = [];

      for (const id of siteIds) {
        const site = await kv.get<SiteData>(`site:${id}`);
        if (site) {
          sites.push({ ...site, html: '', css: '' });
        }
      }

      sites.sort((a, b) => b.updatedAt - a.updatedAt);
      return res.status(200).json(sites);
    }

    if (req.method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      let author = 'anonymous';
      if (token) {
        const session = await kv.get<{ username: string }>(`session:${token}`);
        if (session) {
          author = session.username;
        }
      }

      const { title, html, css } = req.body;

      if (!title || !html) {
        return res.status(400).json({ error: 'Title and HTML are required' });
      }

      const id = generateId();
      const now = Date.now();

      const site: SiteData = {
        id,
        title: String(title).slice(0, 100),
        html: String(html).slice(0, 50000),
        css: String(css || '').slice(0, 20000),
        author,
        createdAt: now,
        updatedAt: now,
        views: 0,
      };

      await kv.set(`site:${id}`, site);
      await kv.sadd('sites:index', id);

      return res.status(201).json({ id, url: `/site/${id}` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Sites API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleSiteById(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) {
    return res.status(400).json({ error: 'Missing site ID' });
  }

  try {
    if (req.method === 'GET') {
      const site = await kv.get<SiteData>(`site:${id}`);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      await kv.set(`site:${id}`, { ...site, views: site.views + 1 });

      return res.status(200).json(site);
    }

    if (req.method === 'PUT') {
      const authUser = await authenticate(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const existing = await kv.get<SiteData>(`site:${id}`);
      if (!existing) {
        return res.status(404).json({ error: 'Site not found' });
      }

      if (existing.author !== authUser) {
        return res.status(403).json({ error: 'You can only edit your own sites' });
      }

      const { title, html, css } = req.body;

      const updated: SiteData = {
        ...existing,
        title: title ? String(title).slice(0, 100) : existing.title,
        html: html ? String(html).slice(0, 50000) : existing.html,
        css: css ? String(css || '').slice(0, 20000) : existing.css,
        updatedAt: Date.now(),
      };

      await kv.set(`site:${id}`, updated);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const authUser = await authenticate(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const existing = await kv.get<SiteData>(`site:${id}`);
      if (!existing) {
        return res.status(404).json({ error: 'Site not found' });
      }

      if (existing.author !== authUser) {
        return res.status(403).json({ error: 'You can only delete your own sites' });
      }

      await kv.del(`site:${id}`);
      await kv.srem('sites:index', id);
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
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Missing wiki path' });
  }

  const cleanPath = String(path).replace(/[^a-zA-Z0-9\-\/]/g, '');

  try {
    const url = `https://backrooms-wiki.wikidot.com/${cleanPath}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BackOS/4.0.011 BackNET-Explorer',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Page not found on the wiki' });
    }

    const html = await response.text();

    const contentMatch = html.match(/<div id="page-content">([\s\S]*?)<\/div>\s*<\/div>\s*<div/);
    const titleMatch = html.match(/<div id="page-title">\s*([\s\S]*?)\s*<\/div>/);

    const pageTitle = titleMatch ? titleMatch[1].trim() : cleanPath;
    let pageContent = contentMatch ? contentMatch[1] : '';

    pageContent = pageContent
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/href="\//g, 'href="https://backrooms-wiki.wikidot.com/')
      .replace(/src="\//g, 'src="https://backrooms-wiki.wikidot.com/');

    return res.status(200).json({
      title: pageTitle,
      content: pageContent,
      url: url,
      path: cleanPath,
    });
  } catch (err: any) {
    console.error('Wiki fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch wiki page' });
  }
}

async function handleSeed(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    let seeded = 0;
    for (const site of EXAMPLE_SITES) {
      const existing = await kv.get(`site:${site.id}`);
      if (!existing) {
        await kv.set(`site:${site.id}`, site);
        await kv.sadd('sites:index', site.id);
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
    if (req.method === 'GET') {
      const user = req.query.user as string;
      if (!user) {
        return res.status(400).json({ error: 'Missing user parameter' });
      }

      const messages = await kv.lrange<Message>(`messages:${user.toLowerCase()}`, 0, -1);
      return res.status(200).json({ messages: messages || [] });
    }

    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { to, from, subject, body } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
      }

      const message: Message = {
        id: Math.random().toString(36).substring(2, 10),
        from: from || username,
        to: to.toLowerCase(),
        subject,
        body,
        timestamp: Date.now(),
        read: false,
      };

      await kv.lpush(`messages:${to.toLowerCase()}`, message);

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
    if (req.method === 'GET') {
      const board = (req.query.board as string || 'general').toLowerCase();
      if (!VALID_POST_BOARDS.includes(board)) {
        return res.status(400).json({ error: `Invalid board. Valid boards: ${VALID_POST_BOARDS.join(', ')}` });
      }

      const postIds = await kv.smembers(`posts:${board}`);
      if (!postIds || postIds.length === 0) {
        return res.status(200).json({ posts: [] });
      }

      const posts: Post[] = [];
      for (const id of postIds) {
        const post = await kv.get<Post>(`post:${id}`);
        if (post) posts.push(post);
      }

      posts.sort((a, b) => b.timestamp - a.timestamp);
      return res.status(200).json({ posts });
    }

    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { board, title, body, author } = req.body;
      if (!board || !title || !body) {
        return res.status(400).json({ error: 'Missing required fields: board, title, body' });
      }

      const boardLower = board.toLowerCase();
      if (!VALID_POST_BOARDS.includes(boardLower)) {
        return res.status(400).json({ error: `Invalid board. Valid boards: ${VALID_POST_BOARDS.join(', ')}` });
      }

      const post: Post = {
        id: Math.random().toString(36).substring(2, 10),
        board: boardLower,
        title,
        body,
        author: author || username,
        timestamp: Date.now(),
        replies: [],
      };

      await kv.set(`post:${post.id}`, post);
      await kv.sadd(`posts:${boardLower}`, post.id);

      return res.status(201).json({ post });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Posts API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePostById(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) {
    return res.status(400).json({ error: 'Missing post ID' });
  }

  try {
    if (req.method === 'GET') {
      const post = await kv.get<Post>(`post:${id}`);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      return res.status(200).json({ post });
    }

    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { body, author } = req.body;
      if (!body) {
        return res.status(400).json({ error: 'Missing required field: body' });
      }

      const post = await kv.get<Post>(`post:${id}`);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const reply: PostReply = {
        id: Math.random().toString(36).substring(2, 10),
        body,
        author: author || username,
        timestamp: Date.now(),
      };

      post.replies.push(reply);
      await kv.set(`post:${post.id}`, post);

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
    if (req.method === 'GET') {
      const threadIds = await kv.smembers('forum:index');
      if (!threadIds || threadIds.length === 0) {
        return res.status(200).json({ threads: [] });
      }

      const threads: Thread[] = [];
      for (const id of threadIds) {
        const thread = await kv.get<Thread>(`thread:${id}`);
        if (thread) threads.push(thread);
      }

      threads.sort((a, b) => b.timestamp - a.timestamp);
      return res.status(200).json({ threads });
    }

    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { title, body, author, category } = req.body;
      if (!title || !body || !category) {
        return res.status(400).json({ error: 'Missing required fields: title, body, category' });
      }

      if (!VALID_FORUM_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Invalid category. Valid categories: ${VALID_FORUM_CATEGORIES.join(', ')}` });
      }

      const thread: Thread = {
        id: Math.random().toString(36).substring(2, 10),
        title,
        body,
        author: author || username,
        category,
        timestamp: Date.now(),
        replies: [],
      };

      await kv.set(`thread:${thread.id}`, thread);
      await kv.sadd('forum:index', thread.id);

      return res.status(201).json({ thread });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Forum API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleForumById(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) {
    return res.status(400).json({ error: 'Missing thread ID' });
  }

  try {
    if (req.method === 'GET') {
      const thread = await kv.get<Thread>(`thread:${id}`);
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      return res.status(200).json({ thread });
    }

    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { body, author } = req.body;
      if (!body) {
        return res.status(400).json({ error: 'Missing required field: body' });
      }

      const thread = await kv.get<Thread>(`thread:${id}`);
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      const reply: PostReply = {
        id: Math.random().toString(36).substring(2, 10),
        body,
        author: author || username,
        timestamp: Date.now(),
      };

      thread.replies.push(reply);
      await kv.set(`thread:${thread.id}`, thread);

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
    if (req.method === 'GET') {
      const channel = (req.query.channel as string || 'general').toLowerCase();
      if (!VALID_CHAT_CHANNELS.includes(channel)) {
        return res.status(400).json({ error: `Invalid channel. Valid channels: ${VALID_CHAT_CHANNELS.join(', ')}` });
      }

      const messages = await kv.lrange<ChatMessage>(`chat:${channel}`, 0, 49);
      return res.status(200).json({ messages: (messages || []).reverse() });
    }

    if (req.method === 'POST') {
      const username = await authenticate(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { channel, body, author } = req.body;
      if (!channel || !body) {
        return res.status(400).json({ error: 'Missing required fields: channel, body' });
      }

      const channelLower = channel.toLowerCase();
      if (!VALID_CHAT_CHANNELS.includes(channelLower)) {
        return res.status(400).json({ error: `Invalid channel. Valid channels: ${VALID_CHAT_CHANNELS.join(', ')}` });
      }

      const message: ChatMessage = {
        id: Math.random().toString(36).substring(2, 10),
        author: author || username,
        body,
        timestamp: Date.now(),
      };

      await kv.lpush(`chat:${channelLower}`, message);
      await kv.ltrim(`chat:${channelLower}`, 0, 99);

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

  const { segments } = parseRoute(req.url || '');

  // Route: /api/auth/login
  if (segments[0] === 'auth' && segments[1] === 'login') {
    return handleAuthLogin(req, res);
  }

  // Route: /api/auth/register
  if (segments[0] === 'auth' && segments[1] === 'register') {
    return handleAuthRegister(req, res);
  }

  // Route: /api/auth/verify
  if (segments[0] === 'auth' && segments[1] === 'verify') {
    return handleAuthVerify(req, res);
  }

  // Route: /api/auth/password
  if (segments[0] === 'auth' && segments[1] === 'password') {
    return handleAuthPassword(req, res);
  }

  // Route: /api/sites or /api/sites/SOMEID
  if (segments[0] === 'sites') {
    if (segments.length === 1 || segments[1] === '') {
      return handleSitesList(req, res);
    }
    return handleSiteById(req, res, segments[1]);
  }

  // Route: /api/wiki
  if (segments[0] === 'wiki') {
    return handleWiki(req, res);
  }

  // Route: /api/seed
  if (segments[0] === 'seed') {
    return handleSeed(req, res);
  }

  // Route: /api/messages
  if (segments[0] === 'messages') {
    return handleMessages(req, res);
  }

  // Route: /api/posts or /api/posts/SOMEID
  if (segments[0] === 'posts') {
    if (segments.length === 1 || segments[1] === '') {
      return handlePostsList(req, res);
    }
    return handlePostById(req, res, segments[1]);
  }

  // Route: /api/forum or /api/forum/SOMEID
  if (segments[0] === 'forum') {
    if (segments.length === 1 || segments[1] === '') {
      return handleForumList(req, res);
    }
    return handleForumById(req, res, segments[1]);
  }

  // Route: /api/chat
  if (segments[0] === 'chat') {
    return handleChat(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}
