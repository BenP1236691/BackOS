import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import styles from './BackCodeStudio.module.css';

interface Props {
  windowId: string;
}

const DEFAULT_CODE = `// BackRoom Entity Monitoring System v3.14
// Author: [REDACTED]
// DO NOT RUN THIS ON LEVEL 4

#include <backrooms.h>
#include <entity_detection.h>

// WARNING: Modifying these values may
// attract unwanted attention

const float fluorescenceLevel = 0.847;
const int MAX_SAFE_DISTANCE = 15; // meters
const float exitProbability = 0.00000001;

struct EntityTracker {
    float entityDistance;
    int threatLevel;
    bool isVisible;
    char name[64];
    // DO NOT add a 'friendly' field
    // They are never friendly
};

void monitorHallway(int levelId) {
    float ambientHum = getAmbientFrequency();
    // The hum should be 60Hz
    // If it changes, RUN

    EntityTracker tracker;
    tracker.entityDistance = scanRadius(50.0);

    if (tracker.entityDistance < MAX_SAFE_DISTANCE) {
        // Do not scream
        // Do not run (they sense movement)
        // Do not look at them directly
        activateProtocol("FREEZE");
        logIncident("Entity detected at %f meters",
            tracker.entityDistance);
    }

    // This loop has been running since 1989
    // It has never exited normally
    while (fluorescenceLevel > 0.0) {
        updateWallpaper(); // The walls are alive
        checkExits(); // returns NULL, always
        decrementSanity(0.01);

        if (exitProbability > random()) {
            // This branch has never executed
            // But we keep it here
            // Just in case
            openExit(); // undefined behavior
        }
    }
}

// TODO: Find out why this function
// runs even when the program is closed
void theWatcher() {
    while (true) {
        observe();
        // =)
    }
}`;

const LANGUAGES = ['SGML', 'HTML', 'CSS', 'JavaScript', 'C', 'C++', 'Python'];

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
  { label: 'true', detail: 'literal' },
  { label: 'false', detail: 'literal' },
  { label: 'null', detail: 'literal' },
  { label: 'undefined', detail: 'literal' },
  { label: 'console', detail: 'object' },
  { label: 'backrooms', detail: 'object' },
  { label: 'Math', detail: 'object' },
  { label: 'Array', detail: 'object' },
  { label: 'Object', detail: 'object' },
  { label: 'String', detail: 'object' },
  { label: 'JSON', detail: 'object' },
  { label: 'setTimeout', detail: 'function' },
  { label: 'setInterval', detail: 'function' },
];

const DOT_SUGGESTIONS: Record<string, Suggestion[]> = {
  'console': [
    { label: 'log', detail: 'method' },
    { label: 'warn', detail: 'method' },
    { label: 'error', detail: 'method' },
    { label: 'clear', detail: 'method' },
    { label: 'info', detail: 'method' },
    { label: 'table', detail: 'method' },
  ],
  'backrooms': [
    { label: 'getLevel()', detail: 'method - Returns current level' },
    { label: 'getEntity()', detail: 'method - Returns nearby entity' },
    { label: 'scanArea()', detail: 'method - Scans surrounding area' },
    { label: 'exitProbability', detail: 'property - float' },
    { label: 'fluorescenceLevel', detail: 'property - float' },
  ],
  'Math': [
    { label: 'random()', detail: 'method' },
    { label: 'floor()', detail: 'method' },
    { label: 'ceil()', detail: 'method' },
    { label: 'round()', detail: 'method' },
    { label: 'abs()', detail: 'method' },
    { label: 'max()', detail: 'method' },
    { label: 'min()', detail: 'method' },
    { label: 'PI', detail: 'constant' },
  ],
  'JSON': [
    { label: 'parse()', detail: 'method' },
    { label: 'stringify()', detail: 'method' },
  ],
  'Array': [
    { label: 'isArray()', detail: 'method' },
    { label: 'from()', detail: 'method' },
  ],
  'Object': [
    { label: 'keys()', detail: 'method' },
    { label: 'values()', detail: 'method' },
    { label: 'entries()', detail: 'method' },
    { label: 'assign()', detail: 'method' },
  ],
};

const BACKROOMS_CONTEXT = {
  getLevel: () => {
    const levels = ['Level 0 - The Lobby', 'Level 1 - Habitable Zone', 'Level 2 - Pipe Dreams',
      'Level 3 - Electrical Station', 'Level 4 - Abandoned Office', 'Level 5 - The Hotel',
      'Level 6 - Lights Out', 'Level ! - Run For Your Life'];
    return levels[Math.floor(Math.random() * levels.length)];
  },
  getEntity: () => {
    const entities = ['Smiler (distance: 12m)', 'Skin-Stealer (distance: 45m)',
      'Hound (distance: 8m)', 'Wretched (distance: 100m)',
      'The Partygoer (distance: 3m) =)', 'Unknown Entity (distance: ???)'];
    return entities[Math.floor(Math.random() * entities.length)];
  },
  scanArea: () => {
    const results = [
      '{ walls: "yellow", carpet: "damp", lights: "flickering", exits: 0 }',
      '{ walls: "peeling", carpet: "none", lights: "buzzing", exits: 1, exitLeadsTo: "unknown" }',
      '{ walls: "breathing", carpet: "wet", lights: "off", exits: 0, sound: "footsteps behind you" }',
      '{ walls: "normal?", carpet: "clean", lights: "stable", exits: 3, note: "too perfect, do not trust" }',
    ];
    return results[Math.floor(Math.random() * results.length)];
  },
  exitProbability: 0.00000001,
  fluorescenceLevel: 0.847,
};

export default function BackCodeStudio({ windowId: _windowId }: Props) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('C');
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionPos, setSuggestionPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [suggestionPrefix, setSuggestionPrefix] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);

  const lineCount = useMemo(() => code.split('\n').length, [code]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (value.includes('HALL OF TORTURED SOULS')) {
      setShowEasterEgg(true);
    }
  };

  const cursorInfo = useMemo(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const lines = code.split('\n');
      return { line: lines.length, col: (lines[lines.length - 1]?.length ?? 0) + 1 };
    }
    const pos = textarea.selectionStart;
    const textBefore = code.substring(0, pos);
    const lines = textBefore.split('\n');
    return { line: lines.length, col: lines[lines.length - 1].length + 1 };
  }, [code]);

  const computeSuggestions = useCallback(() => {
    if (language !== 'JavaScript') {
      setSuggestions([]);
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const textBefore = code.substring(0, pos);
    const lines = textBefore.split('\n');
    const currentLine = lines[lines.length - 1];

    // Check for dot completion: word.
    const dotMatch = currentLine.match(/(\w+)\.\s*$/);
    if (dotMatch) {
      const obj = dotMatch[1];
      const dotSugs = DOT_SUGGESTIONS[obj];
      if (dotSugs) {
        setSuggestions(dotSugs);
        setSuggestionPrefix('');
        // dot completion
        setSelectedSuggestion(0);
        positionDropdown(lines.length - 1, currentLine.length);
        return;
      }
    }

    // Check for dot completion with partial: word.par
    const dotPartialMatch = currentLine.match(/(\w+)\.(\w+)$/);
    if (dotPartialMatch) {
      const obj = dotPartialMatch[1];
      const partial = dotPartialMatch[2].toLowerCase();
      const dotSugs = DOT_SUGGESTIONS[obj];
      if (dotSugs) {
        const filtered = dotSugs.filter(s => s.label.toLowerCase().startsWith(partial));
        if (filtered.length > 0) {
          setSuggestions(filtered);
          setSuggestionPrefix(dotPartialMatch[2]);
          // dot completion
          setSelectedSuggestion(0);
          positionDropdown(lines.length - 1, currentLine.length - partial.length);
          return;
        }
      }
    }

    // Keyword completion
    const wordMatch = currentLine.match(/(\w{2,})$/);
    if (wordMatch) {
      const partial = wordMatch[1].toLowerCase();
      const filtered = JS_KEYWORDS.filter(s => s.label.toLowerCase().startsWith(partial) && s.label.toLowerCase() !== partial);
      if (filtered.length > 0 && filtered.length <= 12) {
        setSuggestions(filtered);
        setSuggestionPrefix(wordMatch[1]);
        // keyword completion
        setSelectedSuggestion(0);
        positionDropdown(lines.length - 1, currentLine.length - wordMatch[1].length);
        return;
      }
    }

    setSuggestions([]);
  }, [code, language]);

  const positionDropdown = (lineIdx: number, colIdx: number) => {
    const editorArea = editorAreaRef.current;
    if (!editorArea) return;

    const charWidth = 7.8;
    const lineHeight = 19.5;
    const lineNumbersWidth = 40;
    const paddingTop = 8;
    const paddingLeft = 8;

    const textarea = textareaRef.current;
    const scrollTop = textarea?.scrollTop ?? 0;

    const top = paddingTop + lineIdx * lineHeight - scrollTop + lineHeight;
    const left = lineNumbersWidth + paddingLeft + colIdx * charWidth;

    setSuggestionPos({ top, left });
  };

  const acceptSuggestion = useCallback((suggestion: Suggestion) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const prefix = suggestionPrefix;
    const insertText = suggestion.label;

    const before = code.substring(0, pos - prefix.length);
    const after = code.substring(pos);
    const newCode = before + insertText + after;

    setCode(newCode);
    setSuggestions([]);

    setTimeout(() => {
      const newPos = pos - prefix.length + insertText.length;
      textarea.selectionStart = newPos;
      textarea.selectionEnd = newPos;
      textarea.focus();
    }, 0);
  }, [code, suggestionPrefix]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        acceptSuggestion(suggestions[selectedSuggestion]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestions([]);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => Math.max(prev - 1, 0));
        return;
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(computeSuggestions, 100);
    return () => clearTimeout(timer);
  }, [code, computeSuggestions]);

  const runCode = () => {
    if (language !== 'JavaScript') return;

    setConsoleOpen(true);
    const output: ConsoleLine[] = [];
    const now = Date.now();

    const backrooms = {
      getLevel: () => BACKROOMS_CONTEXT.getLevel(),
      getEntity: () => BACKROOMS_CONTEXT.getEntity(),
      scanArea: () => BACKROOMS_CONTEXT.scanArea(),
      exitProbability: BACKROOMS_CONTEXT.exitProbability,
      fluorescenceLevel: BACKROOMS_CONTEXT.fluorescenceLevel,
    };

    const fakeConsole = {
      log: (...args: unknown[]) => {
        output.push({ text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), type: 'log', timestamp: now + output.length });
      },
      warn: (...args: unknown[]) => {
        output.push({ text: '[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), type: 'log', timestamp: now + output.length });
      },
      error: (...args: unknown[]) => {
        output.push({ text: '[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), type: 'error', timestamp: now + output.length });
      },
      info: (...args: unknown[]) => {
        output.push({ text: '[INFO] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), type: 'log', timestamp: now + output.length });
      },
      clear: () => {
        output.length = 0;
      },
    };

    try {
      const fn = new Function('console', 'backrooms', code);
      fn(fakeConsole, backrooms);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      output.push({ text: message, type: 'error', timestamp: now + output.length });
    }

    setConsoleLines(prev => [...prev, ...output]);
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.menuBar}>
        <span className={styles.menuItem}>File</span>
        <span className={styles.menuItem}>Edit</span>
        <span
          className={`${styles.menuItem} ${language !== 'JavaScript' ? styles.menuItemDisabled : styles.runButton}`}
          onClick={language === 'JavaScript' ? runCode : undefined}
          title={language !== 'JavaScript' ? 'Only JavaScript can be executed' : 'Run code (JavaScript)'}
        >
          {'\u25B6'} Run
        </span>
        <span className={styles.menuItem}>Help</span>
      </div>

      <div className={styles.editorWrapper}>
        <div ref={editorAreaRef} className={styles.editorArea}>
          <div className={styles.lineNumbers}>
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            className={styles.codeInput}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />

          {suggestions.length > 0 && (
            <div
              className={styles.autocompleteDropdown}
              style={{ top: suggestionPos.top, left: suggestionPos.left }}
            >
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

        {consoleOpen && (
          <div className={styles.consolePanel}>
            <div className={styles.consoleTitleBar}>
              <span>Console Output</span>
              <div className={styles.consoleBtns}>
                <button className={styles.consoleClearBtn} onClick={() => setConsoleLines([])}>Clear</button>
                <button className={styles.consoleCloseBtn} onClick={() => setConsoleOpen(false)}>{'\u2715'}</button>
              </div>
            </div>
            <div className={styles.consoleBody}>
              {consoleLines.length === 0 && (
                <div className={styles.consoleEmpty}>No output. Run some JavaScript code.</div>
              )}
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

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span>
            Language:{' '}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                background: 'var(--color-surface)',
                border: 'none',
                color: 'var(--color-text)',
                fontSize: '11px',
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </span>
          <span>Ln {cursorInfo.line}, Col {cursorInfo.col}</span>
        </div>
        <div className={styles.statusRight}>
          <span>BackCode Studio&trade;</span>
        </div>
      </div>

      {showEasterEgg && (
        <div className={styles.easterEggOverlay} onClick={() => setShowEasterEgg(false)}>
          <div className={styles.flickerText}>
            YOU FOUND THE HALL OF TORTURED SOULS
          </div>
          <div className={styles.flickerTextSlow}>
            They have been waiting for you.
            <br />
            The fluorescent lights remember your name.
            <br />
            You cannot close this. But try clicking anyway.
            <br /><br />
            =)
          </div>
        </div>
      )}
    </div>
  );
}
