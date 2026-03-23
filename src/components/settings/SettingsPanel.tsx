import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import type { WallpaperOption } from '../../store/types';
import styles from './SettingsPanel.module.css';
import '../../styles/win95.css';

const WALLPAPERS: { id: WallpaperOption; name: string; color: string }[] = [
  { id: 'backos', name: 'Back OS', color: 'linear-gradient(135deg, #1a1600, #2a2400)' },
  { id: 'nostalgia', name: 'Nostalgia OS', color: 'linear-gradient(135deg, #2a2000, #3a3010)' },
  { id: 'frutiger-aero', name: 'Frutiger Aero', color: 'linear-gradient(135deg, #0a1520, #1a2a10)' },
  { id: 'retro', name: 'Retro', color: 'linear-gradient(135deg, #0d0d00, #1a1a00)' },
];

export default function SettingsPanel() {
  const { state, dispatch } = useAppContext();
  const [newPassword, setNewPassword] = useState('');
  const [saved, setSaved] = useState(false);

  const handleClose = () => dispatch({ type: 'TOGGLE_SETTINGS' });

  const handleSavePassword = () => {
    if (newPassword.trim()) {
      setSaved(true);
      setNewPassword('');
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.titleBar}>
          <span>⚙️ Back OS™ Settings</span>
          <button className={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        <div className={styles.body}>
          {/* Dark Mode */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Display</div>
            <div className={styles.field}>
              <span className={styles.label}>Dark Mode:</span>
              <button
                className={`${styles.toggle} ${state.theme === 'dark' ? styles.on : ''}`}
                onClick={() => dispatch({
                  type: 'SET_THEME',
                  theme: state.theme === 'dark' ? 'light' : 'dark',
                })}
              >
                <div className={styles.toggleKnob} />
              </button>
            </div>
          </div>

          {/* Wallpaper */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Wallpaper</div>
            <div className={styles.wallpaperGrid}>
              {WALLPAPERS.map(wp => (
                <div
                  key={wp.id}
                  className={`${styles.wallpaperOption} ${state.wallpaper === wp.id ? styles.selected : ''}`}
                  onClick={() => dispatch({ type: 'SET_WALLPAPER', wallpaper: wp.id })}
                >
                  <div className={styles.wallpaperPreview} style={{ background: wp.color }} />
                  {wp.name}
                </div>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Security</div>
            <div className={styles.field}>
              <span className={styles.label}>New Password:</span>
              <input
                className={`win95-input ${styles.input}`}
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button className="win95-button" onClick={handleSavePassword} style={{ minWidth: '60px' }}>
                {saved ? '✓ Saved' : 'Change'}
              </button>
            </div>
          </div>

          {/* Network */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Network</div>
            <div className={styles.field}>
              <span className={styles.label}>BackNET:</span>
              <button
                className={`${styles.toggle} ${state.isOnline ? styles.on : ''}`}
                onClick={() => dispatch({ type: 'TOGGLE_ONLINE' })}
              >
                <div className={styles.toggleKnob} />
              </button>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {state.isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>

          <div className={styles.info}>
            Back OS™ v4.0.011 | Installed via: Pre-installed (native device)<br />
            Back OS™ is immune to all known cyberattacks, including The Happy File Virus.<br />
            Named by popular vote in 1990 — 78% approval (The Leaders)
          </div>

          <div className={styles.buttonRow}>
            <button className="win95-button" onClick={handleClose}>OK</button>
            <button className="win95-button" onClick={handleClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
