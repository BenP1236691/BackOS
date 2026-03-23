import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

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
