import { useState, type FormEvent } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './LoginScreen.module.css';
import '../../styles/win95.css';

export default function LoginScreen() {
  const { dispatch } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    dispatch({ type: 'SET_USER', user: { username: username.trim() } });
    dispatch({ type: 'SET_PHASE', phase: 'desktop' });
  };

  return (
    <div className={`${styles.container} ${styles.flicker}`}>
      <div className={styles.logo}>
        <div className={styles.logoBlock} style={{
          background: '#FFD700',
          clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)',
        }} />
        <div className={styles.logoBlock} style={{
          background: '#FFC000',
          clipPath: 'polygon(0% 0%, 80% 0%, 100% 100%, 0% 100%)',
        }} />
        <div className={styles.logoBlock} style={{
          background: '#B8960F',
          clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 0% 100%)',
        }} />
        <div className={styles.logoBlock} style={{
          background: '#8B7500',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 20% 100%)',
        }} />
      </div>

      <div className={styles.title}>Back OS™</div>
      <div className={styles.version}>v4.0.011</div>

      <form onSubmit={handleSubmit}>
        <div className={styles.loginBox}>
          <div className={styles.loginTitle}>
            <span className={styles.loginIcon}>🔑</span>
            Log On to Back OS™
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Username:</label>
            <input
              className={`win95-input ${styles.input}`}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              placeholder="wanderer"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password:</label>
            <input
              className={`win95-input ${styles.input}`}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className={styles.buttonRow}>
            <button type="submit" className="win95-button">OK</button>
            <button type="button" className="win95-button" onClick={() => {
              setUsername('');
              setPassword('');
            }}>Cancel</button>
          </div>

          <div className={styles.welcomeText}>
            Connected to The BackRoom™ Cloud Service
          </div>
        </div>
      </form>
    </div>
  );
}
