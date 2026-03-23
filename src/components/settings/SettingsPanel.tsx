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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [passwordError, setPasswordError] = useState('');

  const handleClose = () => dispatch({ type: 'TOGGLE_SETTINGS' });

  const handleSavePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) return;

    setPasswordStatus('saving');
    setPasswordError('');

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.user?.token || ''}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || 'Failed to change password');
        setPasswordStatus('error');
        return;
      }

      setPasswordStatus('saved');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordStatus('idle'), 2000);
    } catch {
      setPasswordError('Could not connect to server');
      setPasswordStatus('error');
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
          {/* Account */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Account</div>
            <div className={styles.field}>
              <span className={styles.label}>Logged in as:</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                {state.user?.username || 'anonymous'}
              </span>
            </div>
          </div>

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
          {state.user?.token && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Security</div>
              <div className={styles.field}>
                <span className={styles.label}>Current:</span>
                <input
                  className={`win95-input ${styles.input}`}
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>New:</span>
                <input
                  className={`win95-input ${styles.input}`}
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  className="win95-button"
                  onClick={handleSavePassword}
                  disabled={passwordStatus === 'saving'}
                  style={{ minWidth: '60px' }}
                >
                  {passwordStatus === 'saving' ? '...' : passwordStatus === 'saved' ? '✓' : 'Change'}
                </button>
              </div>
              {passwordError && (
                <div style={{ fontSize: '11px', color: '#cc4444', marginTop: '4px' }}>
                  {passwordError}
                </div>
              )}
            </div>
          )}

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
