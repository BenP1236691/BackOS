import { useState, useMemo } from 'react';
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

export default function BackCodeStudio({ windowId }: Props) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('C');
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  const lineCount = useMemo(() => code.split('\n').length, [code]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (value.includes('HALL OF TORTURED SOULS')) {
      setShowEasterEgg(true);
    }
  };

  const cursorInfo = useMemo(() => {
    const lines = code.split('\n');
    return { line: lines.length, col: (lines[lines.length - 1]?.length ?? 0) + 1 };
  }, [code]);

  return (
    <div className={styles.container}>
      <div className={styles.menuBar}>
        <span className={styles.menuItem}>File</span>
        <span className={styles.menuItem}>Edit</span>
        <span className={styles.menuItem}>Run</span>
        <span className={styles.menuItem}>Help</span>
      </div>

      <div className={styles.editorArea}>
        <div className={styles.lineNumbers}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          className={styles.codeInput}
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          spellCheck={false}
        />
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
