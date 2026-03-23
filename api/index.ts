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
    // Vercel rewrites /site/:id to /api/index?id=xxx
    // Only trigger if seg is empty/index (rewritten) and id query param exists, OR seg[0] is 'site'
    if (seg[0] === 'site' || (seg.length === 0 && req.query?.id) || (seg[0] === 'index' && req.query?.id)) {
      const id = String(seg[0] === 'site' ? seg[1] : req.query?.id || '');
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
        { id: 'wikihow-exit', title: 'WikiHow: How to Exit the Backrooms in 7 Steps', html: '<div class="wikihow"><div class="header"><div class="logo">Wiki<span>How</span></div><div class="breadcrumb">Home &rsaquo; Survival &rsaquo; Backrooms</div></div><h1>How to Exit the Backrooms in 7 Steps</h1><div class="meta">Co-authored by <b>The Leaders</b> and <b>3 other wanderers</b><br>Last Updated: ████-██-██ &middot; 47,291 views &middot; <span class="verified">&#9989; Entity-Verified</span></div><div class="intro"><p><b>Exiting the Backrooms</b> can seem impossible, but with the right preparation and a bit of luck (approximately 0.00000001%), you might find your way out. This article will guide you through the most commonly theorized exit procedure. <i>Results may vary. Most wanderers do not survive past Step 3.</i></p></div><div class="step"><div class="step-num">1</div><div class="step-content"><h2>Stay calm and assess your current level.</h2><p>Panic attracts entities. Take a deep breath (if the air is breathable). Look for landmarks — yellow wallpaper means Level 0, concrete means Level 1, pipes mean Level 2. <b>Do not</b> count the rooms. The number changes every time you count.</p><div class="tip">&#128161; <b>Tip:</b> If the carpet is damp, you\'re in Level 0. This is actually one of the safer levels. Relatively.</div></div></div><div class="step"><div class="step-num">2</div><div class="step-content"><h2>Find Almond Water and stock up.</h2><p>Almond Water is the most important resource in the Backrooms. It keeps you hydrated, sane, and partially invisible to some entities. Check vending machines, puddles that smell like almonds, and other wanderers\' abandoned supplies.</p><div class="warning">&#9888;&#65039; <b>Warning:</b> Do NOT drink any liquid that is not Almond Water. Especially if it\'s warm.</div></div></div><div class="step"><div class="step-num">3</div><div class="step-content"><h2>Navigate to a level transition point.</h2><p>Level transitions occur at random, but some spots are more reliable: doors that shouldn\'t exist, walls that feel thin, floors that seem to vibrate. Walk into walls repeatedly — sometimes you clip through. This is how most people got here in the first place.</p><div class="tip">&#128161; <b>Tip:</b> If you hear elevator music, follow it. Unless it stops. If it stops, run.</div></div></div><div class="step"><div class="step-num">4</div><div class="step-content"><h2>Reach Level 3999.</h2><p>According to recovered documents, Level 3999 is the "True Exit Level." Nobody has confirmed this because nobody has returned from Level 3999. But the documents seem trustworthy. They were written in a very official font.</p><div class="warning">&#9888;&#65039; <b>Warning:</b> Levels above 1000 are theoretical. You may be walking into a hallucination. Or worse — a Smiler\'s territory.</div></div></div><div class="step"><div class="step-num">5</div><div class="step-content"><h2>Locate "The Door."</h2><p>The Door is described as an ordinary wooden door that feels wrong. It might be warm to the touch. The handle is always on the wrong side. Behind it, you should see a bright white light — not fluorescent, but natural. Sunlight. <i>Remember sunlight?</i></p><div class="tip">&#128161; <b>Tip:</b> If the door has a peephole, do NOT look through it. Something will look back.</div></div></div><div class="step"><div class="step-num">6</div><div class="step-content"><h2>S̸a̷y̵ ̵t̸h̵e̷ ̵w̶o̴r̵d̸s̷.</h2><p>The recovered documents mention "words" that must be spoken before turning the handle. The exact words have been c̸o̴r̶r̵u̸p̸t̶e̵d̷ in every copy we\'ve found. Some say it\'s your real name. Some say it\'s the name of someone you\'ve forgotten. Others say it doesn\'t matter what you say, because y̷o̸u̶\'̸r̷e̵ ̸n̴o̷t̶ ̴g̵e̸t̶t̵i̷n̸g̶ ̵o̸u̴t̷.</p></div></div><div class="step last-step"><div class="step-num">7</div><div class="step-content"><h2>T̸̢̧u̴̢r̶n̷ ̸t̶h̸e̷ ̸h̴a̵n̶d̵l̴e̸.</h2><p class="corrupted">J̶u̷s̵t̷ ̸k̶i̷d̴d̶i̶n̷g̸.̵ ̶T̸h̶e̷r̸e̶ ̷i̸s̵ ̴n̸o̴ ̶S̸t̷e̵p̸ ̸7̵.̷ ̶T̸h̵e̵r̸e̴ ̸i̵s̵ ̷n̷o̸ ̶e̶x̸i̶t̷.̶ ̴T̵h̶e̴ ̶B̸a̸c̴k̸r̸o̵o̷m̶s̷ ̸a̶r̸e̷ ̶f̸o̴r̷e̶v̷e̶r̵.̴ ̵Y̸o̶u̶ ̸k̴n̵e̶w̸ ̵t̸h̵i̸s̵.̵ ̴Y̷o̸u̵ ̸a̷l̷w̸a̸y̵s̷ ̸k̴n̷e̸w̸ ̸t̸h̵i̵s̵.̶ ̶≠)̵</p></div></div><div class="footer"><p>Was this article helpful?</p><div class="vote-btns"><button class="vote-btn yes" onclick="this.textContent=\'Yes (47,292)\'">&#128077; Yes (47,291)</button><button class="vote-btn no" onclick="this.textContent=\'Thanks for your feedback. It doesn\\\'t matter. =)\'">&#128078; No (0)</button></div><div class="related"><b>Related Articles:</b><ul><li>How to Identify a Skin-Stealer</li><li>How to Survive Level 6 (Lights Out)</li><li>How to Brew Almond Water</li><li>How to Accept That You Live Here Now</li></ul></div></div></div>', css: '@import url("https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap");*{margin:0;padding:0;box-sizing:border-box}body{background:#f5f5f5;color:#333;font-family:"Open Sans",sans-serif;font-size:15px;line-height:1.6}.wikihow{max-width:720px;margin:0 auto;background:#fff;min-height:100vh}.header{background:#93b874;padding:12px 24px}.logo{font-size:24px;font-weight:700;color:#fff}.logo span{color:#fff;font-weight:400}.breadcrumb{font-size:12px;color:rgba(255,255,255,.8);margin-top:2px}h1{font-size:26px;font-weight:700;padding:24px 24px 8px;color:#333;line-height:1.3}.meta{padding:0 24px 16px;font-size:13px;color:#888;border-bottom:1px solid #eee}.verified{color:#2a9d2a}.intro{padding:16px 24px;background:#f9f9f9;border-bottom:1px solid #eee}.intro p{color:#555}.step{display:flex;padding:20px 24px;border-bottom:1px solid #eee}.step-num{width:40px;height:40px;border-radius:50%;background:#93b874;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0;margin-right:16px;margin-top:4px}.step-content{flex:1}.step-content h2{font-size:18px;font-weight:600;margin-bottom:8px;color:#333}.step-content p{color:#555;margin-bottom:8px}.tip{background:#e8f5e9;border-left:4px solid #4caf50;padding:10px 14px;margin:8px 0;font-size:13px;color:#2e7d32;border-radius:0 4px 4px 0}.warning{background:#fff3e0;border-left:4px solid #ff9800;padding:10px 14px;margin:8px 0;font-size:13px;color:#e65100;border-radius:0 4px 4px 0}.last-step{background:#1a0000}.last-step .step-num{background:#aa0000}.last-step h2{color:#ff4444}.corrupted{color:#ff4444;font-size:16px;animation:glitch .3s infinite alternate}@keyframes glitch{0%{transform:translate(0)}25%{transform:translate(-2px,1px)}50%{transform:translate(1px,-1px)}75%{transform:translate(-1px,2px)}100%{transform:translate(2px,-1px)}}.footer{padding:24px;text-align:center;border-top:2px solid #eee}.footer p{font-size:16px;font-weight:600;margin-bottom:12px}.vote-btns{display:flex;gap:12px;justify-content:center;margin-bottom:20px}.vote-btn{padding:8px 20px;border:2px solid #ddd;border-radius:20px;background:#fff;cursor:pointer;font-size:14px;transition:all .2s}.vote-btn.yes:hover{border-color:#4caf50;background:#e8f5e9}.vote-btn.no:hover{border-color:#f44336;background:#fce4ec}.related{text-align:left;max-width:400px;margin:0 auto}.related b{font-size:14px;color:#333}.related ul{margin:8px 0 0 20px}.related li{font-size:13px;color:#1a73e8;cursor:pointer;margin:4px 0}', author: 'the-leaders', createdAt: Date.now() - 864000000, updatedAt: Date.now() - 86400000, views: 47291 },
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

    // ---- FILES ----
    if (seg[0] === 'files') {
      const db = await getDb();
      const u = await getUser(req);

      if (req.method === 'GET') {
        // List files for a user at a path
        const owner = String(req.query?.owner || u || 'anonymous').toLowerCase();
        const path = String(req.query?.path || '/');
        const files = await db.collection('files').find({ owner, path }).sort({ type: 1, name: 1 }).toArray();
        return res.status(200).json({ files });
      }

      if (req.method === 'POST') {
        if (!u) return res.status(401).json({ error: 'Auth required' });
        const { name, path, type, content } = req.body;
        if (!name || !path) return res.status(400).json({ error: 'Name and path required' });
        const fileType = type === 'folder' ? 'folder' : 'file';
        // Check duplicate
        const exists = await db.collection('files').findOne({ owner: u, path, name });
        if (exists) return res.status(409).json({ error: 'File already exists' });
        const file = {
          id: genId(),
          owner: u,
          name: String(name).slice(0, 100),
          path: String(path),
          type: fileType,
          content: fileType === 'file' ? String(content || '').slice(0, 100000) : '',
          size: fileType === 'file' ? (content ? String(content).length : 0) : 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await db.collection('files').insertOne(file);
        return res.status(201).json({ file });
      }

      if (req.method === 'PUT') {
        if (!u) return res.status(401).json({ error: 'Auth required' });
        const { id, name, content } = req.body;
        if (!id) return res.status(400).json({ error: 'File ID required' });
        const file = await db.collection('files').findOne({ id, owner: u });
        if (!file) return res.status(404).json({ error: 'File not found' });
        const update: any = { updatedAt: Date.now() };
        if (name) update.name = String(name).slice(0, 100);
        if (content !== undefined) { update.content = String(content).slice(0, 100000); update.size = String(content).length; }
        await db.collection('files').updateOne({ id, owner: u }, { $set: update });
        return res.status(200).json(await db.collection('files').findOne({ id }));
      }

      if (req.method === 'DELETE') {
        if (!u) return res.status(401).json({ error: 'Auth required' });
        const id = req.query?.id || req.body?.id;
        if (!id) return res.status(400).json({ error: 'File ID required' });
        const file = await db.collection('files').findOne({ id: String(id), owner: u });
        if (!file) return res.status(404).json({ error: 'File not found' });
        // If folder, delete all children
        if (file.type === 'folder') {
          const folderPath = file.path === '/' ? `/${file.name}` : `${file.path}/${file.name}`;
          await db.collection('files').deleteMany({ owner: u, path: { $regex: `^${folderPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` } });
        }
        await db.collection('files').deleteOne({ id: String(id), owner: u });
        return res.status(200).json({ deleted: true });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
