import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './BackCodeStudio.module.css';

interface Props {
  windowId: string;
}

const DEFAULT_HTML = `<div class="page">
  <h1>Welcome to BackNET</h1>
  <p>This site was built with BackCode Studio™</p>
  <p>You are now part of the Backrooms.</p>
  <button onclick="document.querySelector('h1').textContent = 'You cannot leave.'">
    Click me
  </button>
</div>`;

const DEFAULT_CSS = `body {
  background: #0d0d00;
  color: #FFD700;
  font-family: 'Courier New', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
}

.page {
  text-align: center;
  padding: 40px;
}

h1 {
  font-size: 32px;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  margin-bottom: 16px;
}

p {
  color: #B8960F;
  margin-bottom: 8px;
}

button {
  background: #FFD700;
  color: #000;
  border: none;
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 16px;
}

button:hover {
  background: #FFC000;
}`;

const DEFAULT_JS = `// BackCode Studio™ — JavaScript
// The backrooms object is available globally

console.log("Initializing BackOS script...");
console.log("Current level:", backrooms.getLevel());
console.log("Nearest entity:", backrooms.getEntity());
console.log("Area scan:", backrooms.scanArea());
console.log("Exit probability:", backrooms.exitProbability);

// Try modifying this code and click Run!`;

interface ConsoleLine {
  text: string;
  type: 'log' | 'error';
  timestamp: number;
}

interface Suggestion {
  label: string;
  detail?: string;
}

const JS_KEYWORDS: Suggestion[] = [
  { label: 'function', detail: 'keyword' },
  { label: 'const', detail: 'keyword' },
  { label: 'let', detail: 'keyword' },
  { label: 'var', detail: 'keyword' },
  { label: 'if', detail: 'keyword' },
  { label: 'else', detail: 'keyword' },
  { label: 'for', detail: 'keyword' },
  { label: 'while', detail: 'keyword' },
  { label: 'return', detail: 'keyword' },
  { label: 'class', detail: 'keyword' },
  { label: 'import', detail: 'keyword' },
  { label: 'export', detail: 'keyword' },
  { label: 'document', detail: 'object' },
  { label: 'console', detail: 'object' },
  { label: 'backrooms', detail: 'object' },
  { label: 'Math', detail: 'object' },
  { label: 'JSON', detail: 'object' },
  { label: 'Array', detail: 'object' },
  { label: 'querySelector', detail: 'method' },
  { label: 'getElementById', detail: 'method' },
  { label: 'addEventListener', detail: 'method' },
  { label: 'setTimeout', detail: 'function' },
  { label: 'setInterval', detail: 'function' },
];

const DOT_SUGGESTIONS: Record<string, Suggestion[]> = {
  'console': [
    { label: 'log', detail: 'method' },
    { label: 'warn', detail: 'method' },
    { label: 'error', detail: 'method' },
    { label: 'clear', detail: 'method' },
  ],
  'document': [
    { label: 'querySelector()', detail: 'method' },
    { label: 'getElementById()', detail: 'method' },
    { label: 'createElement()', detail: 'method' },
    { label: 'body', detail: 'property' },
    { label: 'title', detail: 'property' },
  ],
  'backrooms': [
    { label: 'getLevel()', detail: 'Returns current level' },
    { label: 'getEntity()', detail: 'Returns nearby entity' },
    { label: 'scanArea()', detail: 'Scans surroundings' },
    { label: 'exitProbability', detail: 'float' },
    { label: 'fluorescenceLevel', detail: 'float' },
  ],
  'Math': [
    { label: 'random()', detail: 'method' },
    { label: 'floor()', detail: 'method' },
    { label: 'ceil()', detail: 'method' },
    { label: 'round()', detail: 'method' },
    { label: 'PI', detail: 'constant' },
  ],
  'JSON': [
    { label: 'parse()', detail: 'method' },
    { label: 'stringify()', detail: 'method' },
  ],
};

const BACKROOMS_CONTEXT = {
  getLevel: () => {
    const levels = ['Level 0 - The Lobby', 'Level 1 - Habitable Zone', 'Level 2 - Pipe Dreams', 'Level ! - Run For Your Life'];
    return levels[Math.floor(Math.random() * levels.length)];
  },
  getEntity: () => {
    const entities = ['Smiler (12m)', 'Skin-Stealer (45m)', 'Hound (8m)', 'The Partygoer (3m) =)'];
    return entities[Math.floor(Math.random() * entities.length)];
  },
  scanArea: () => {
    const results = ['{ walls: "yellow", carpet: "damp", exits: 0 }', '{ walls: "breathing", lights: "off", sound: "footsteps" }'];
    return results[Math.floor(Math.random() * results.length)];
  },
  exitProbability: 0.00000001,
  fluorescenceLevel: 0.847,
};

type EditorTab = 'html' | 'css' | 'js';

export default function BackCodeStudio({ windowId: _windowId }: Props) {
  const { state } = useAppContext();
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  const [activeTab, setActiveTab] = useState<EditorTab>('html');
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionPos, setSuggestionPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [suggestionPrefix, setSuggestionPrefix] = useState('');
  const [deployTitle, setDeployTitle] = useState('My BackNET Site');
  const [deploying, setDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const currentCode = activeTab === 'html' ? html : activeTab === 'css' ? css : js;

  const setCurrentCode = (value: string) => {
    if (activeTab === 'html') setHtml(value);
    else if (activeTab === 'css') setCss(value);
    else setJs(value);
    if (value.includes('HALL OF TORTURED SOULS')) setShowEasterEgg(true);
  };

  const lineCount = useMemo(() => currentCode.split('\n').length, [currentCode]);

  const cursorInfo = useMemo(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const lines = currentCode.split('\n');
      return { line: lines.length, col: (lines[lines.length - 1]?.length ?? 0) + 1 };
    }
    const pos = textarea.selectionStart;
    const textBefore = currentCode.substring(0, pos);
    const lines = textBefore.split('\n');
    return { line: lines.length, col: lines[lines.length - 1].length + 1 };
  }, [currentCode]);

  // Update preview
  useEffect(() => {
    if (!previewRef.current) return;
    const doc = previewRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`);
    doc.close();
  }, [html, css, js]);

  // IntelliSense
  const computeSuggestions = useCallback(() => {
    if (activeTab !== 'js') { setSuggestions([]); return; }
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const textBefore = js.substring(0, pos);
    const lines = textBefore.split('\n');
    const currentLine = lines[lines.length - 1];

    const dotMatch = currentLine.match(/(\w+)\.\s*$/);
    if (dotMatch && DOT_SUGGESTIONS[dotMatch[1]]) {
      setSuggestions(DOT_SUGGESTIONS[dotMatch[1]]);
      setSuggestionPrefix('');
      setSelectedSuggestion(0);
      positionDropdown(lines.length - 1, currentLine.length);
      return;
    }

    const dotPartialMatch = currentLine.match(/(\w+)\.(\w+)$/);
    if (dotPartialMatch && DOT_SUGGESTIONS[dotPartialMatch[1]]) {
      const filtered = DOT_SUGGESTIONS[dotPartialMatch[1]].filter(s => s.label.toLowerCase().startsWith(dotPartialMatch[2].toLowerCase()));
      if (filtered.length > 0) {
        setSuggestions(filtered);
        setSuggestionPrefix(dotPartialMatch[2]);
        setSelectedSuggestion(0);
        positionDropdown(lines.length - 1, currentLine.length - dotPartialMatch[2].length);
        return;
      }
    }

    const wordMatch = currentLine.match(/(\w{2,})$/);
    if (wordMatch) {
      const partial = wordMatch[1].toLowerCase();
      const filtered = JS_KEYWORDS.filter(s => s.label.toLowerCase().startsWith(partial) && s.label.toLowerCase() !== partial);
      if (filtered.length > 0 && filtered.length <= 12) {
        setSuggestions(filtered);
        setSuggestionPrefix(wordMatch[1]);
        setSelectedSuggestion(0);
        positionDropdown(lines.length - 1, currentLine.length - wordMatch[1].length);
        return;
      }
    }
    setSuggestions([]);
  }, [js, activeTab]);

  const positionDropdown = (lineIdx: number, colIdx: number) => {
    const scrollTop = textareaRef.current?.scrollTop ?? 0;
    setSuggestionPos({ top: 8 + lineIdx * 19.5 - scrollTop + 19.5, left: 48 + colIdx * 7.8 });
  };

  const acceptSuggestion = useCallback((suggestion: Suggestion) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const before = js.substring(0, pos - suggestionPrefix.length);
    const after = js.substring(pos);
    setJs(before + suggestion.label + after);
    setSuggestions([]);
    setTimeout(() => {
      const newPos = pos - suggestionPrefix.length + suggestion.label.length;
      textarea.selectionStart = newPos;
      textarea.selectionEnd = newPos;
      textarea.focus();
    }, 0);
  }, [js, suggestionPrefix]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === 'Tab' || e.key === 'Enter') { e.preventDefault(); acceptSuggestion(suggestions[selectedSuggestion]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setSuggestions([]); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedSuggestion(p => Math.min(p + 1, suggestions.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedSuggestion(p => Math.max(p - 1, 0)); return; }
    }
  };

  useEffect(() => {
    const timer = setTimeout(computeSuggestions, 100);
    return () => clearTimeout(timer);
  }, [js, computeSuggestions]);

  // Run JS
  const runCode = () => {
    setConsoleOpen(true);
    const output: ConsoleLine[] = [];
    const now = Date.now();
    const fakeConsole = {
      log: (...args: unknown[]) => output.push({ text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), type: 'log', timestamp: now + output.length }),
      warn: (...args: unknown[]) => output.push({ text: '[WARN] ' + args.map(String).join(' '), type: 'log', timestamp: now + output.length }),
      error: (...args: unknown[]) => output.push({ text: '[ERROR] ' + args.map(String).join(' '), type: 'error', timestamp: now + output.length }),
      info: (...args: unknown[]) => output.push({ text: '[INFO] ' + args.map(String).join(' '), type: 'log', timestamp: now + output.length }),
      clear: () => { output.length = 0; },
    };
    try {
      const fn = new Function('console', 'backrooms', js);
      fn(fakeConsole, BACKROOMS_CONTEXT);
    } catch (err: unknown) {
      output.push({ text: err instanceof Error ? err.message : String(err), type: 'error', timestamp: now + output.length });
    }
    setConsoleLines(prev => [...prev, ...output]);
  };

  // Deploy
  const handleDeploy = async () => {
    if (!deployTitle.trim() || !html.trim()) return;
    const token = state.user?.token;
    if (!token) { setDeployStatus('Log in to deploy'); return; }
    setDeploying(true);
    setDeployStatus('Deploying...');
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: deployTitle, html, css }),
      });
      if (!res.ok) throw new Error('Deploy failed');
      const data = await res.json();
      setDeployStatus(`Live at ${window.location.origin}/site/${data.id}`);
    } catch {
      setDeployStatus('Deploy failed');
    } finally {
      setDeploying(false);
    }
  };

  const formatTimestamp = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className={styles.container}>
      {/* Menu bar */}
      <div className={styles.menuBar}>
        <span className={styles.menuItem}>File</span>
        <span className={styles.menuItem}>Edit</span>
        <span className={`${styles.menuItem} ${styles.runButton}`} onClick={runCode} title="Run JavaScript">
          ▶ Run JS
        </span>
        <span className={styles.menuItem}>Help</span>
      </div>

      {/* Editor tabs */}
      <div className={styles.editorTabs}>
        <button className={`${styles.editorTab} ${activeTab === 'html' ? styles.editorTabActive : ''}`} onClick={() => setActiveTab('html')}>
          HTML
        </button>
        <button className={`${styles.editorTab} ${activeTab === 'css' ? styles.editorTabActive : ''}`} onClick={() => setActiveTab('css')}>
          CSS
        </button>
        <button className={`${styles.editorTab} ${activeTab === 'js' ? styles.editorTabActive : ''}`} onClick={() => setActiveTab('js')}>
          JavaScript
        </button>
      </div>

      {/* Editor + Preview */}
      <div className={styles.editorWrapper}>
        <div className={styles.editorAndPreview}>
          {/* Code editor */}
          <div className={styles.editorColumn}>
            <div ref={editorAreaRef} className={styles.editorArea}>
              <div className={styles.lineNumbers}>
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className={styles.codeInput}
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
              />
              {suggestions.length > 0 && (
                <div className={styles.autocompleteDropdown} style={{ top: suggestionPos.top, left: suggestionPos.left }}>
                  {suggestions.map((s, i) => (
                    <div
                      key={s.label}
                      className={`${styles.autocompleteItem} ${i === selectedSuggestion ? styles.autocompleteItemSelected : ''}`}
                      onMouseDown={(e) => { e.preventDefault(); acceptSuggestion(s); }}
                      onMouseEnter={() => setSelectedSuggestion(i)}
                    >
                      <span className={styles.autocompleteLabel}>{s.label}</span>
                      {s.detail && <span className={styles.autocompleteDetail}>{s.detail}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div className={styles.previewPane}>
            <div className={styles.previewHeader}>Preview</div>
            <iframe ref={previewRef} className={styles.previewFrame} sandbox="allow-same-origin allow-scripts" title="Preview" />
          </div>
        </div>

        {/* Console */}
        {consoleOpen && (
          <div className={styles.consolePanel}>
            <div className={styles.consoleTitleBar}>
              <span>Console</span>
              <div className={styles.consoleBtns}>
                <button className={styles.consoleClearBtn} onClick={() => setConsoleLines([])}>Clear</button>
                <button className={styles.consoleCloseBtn} onClick={() => setConsoleOpen(false)}>✕</button>
              </div>
            </div>
            <div className={styles.consoleBody}>
              {consoleLines.length === 0 && <div className={styles.consoleEmpty}>No output yet.</div>}
              {consoleLines.map((line, i) => (
                <div key={i} className={`${styles.consoleLine} ${line.type === 'error' ? styles.consoleError : ''}`}>
                  <span className={styles.consoleTimestamp}>[{formatTimestamp(line.timestamp)}]</span>
                  <span>{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Deploy bar */}
      <div className={styles.deployBar}>
        <span style={{ fontWeight: 'bold' }}>🚀</span>
        <input
          className={styles.deployInput}
          value={deployTitle}
          onChange={e => setDeployTitle(e.target.value)}
          placeholder="Site title..."
        />
        <button className={styles.deployBtn} onClick={handleDeploy} disabled={deploying || !deployTitle.trim()}>
          {deploying ? 'Deploying...' : 'Deploy to BackNET'}
        </button>
        {deployStatus && <span className={styles.deployStatus}>{deployStatus}</span>}
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span>{activeTab.toUpperCase()}</span>
          <span>Ln {cursorInfo.line}, Col {cursorInfo.col}</span>
        </div>
        <div className={styles.statusRight}>
          <span>BackCode Studio™</span>
        </div>
      </div>

      {showEasterEgg && (
        <div className={styles.easterEggOverlay} onClick={() => setShowEasterEgg(false)}>
          <div className={styles.flickerText}>YOU FOUND THE HALL OF TORTURED SOULS</div>
          <div className={styles.flickerTextSlow}>
            They have been waiting for you.<br />
            The fluorescent lights remember your name.<br /><br />=)
          </div>
        </div>
      )}
    </div>
  );
}
