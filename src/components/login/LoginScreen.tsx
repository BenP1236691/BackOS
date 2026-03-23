import { useState, useEffect, type FormEvent } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './LoginScreen.module.css';
import '../../styles/win95.css';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { state, dispatch } = useAppContext();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-login if we have a stored token
  useEffect(() => {
    const stored = localStorage.getItem('backos-user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.token) {
          setLoading(true);
          fetch('/api/auth/verify', {
            method: 'POST',
            headers: { Authorization: `Bearer ${user.token}` },
          })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (data) {
                dispatch({ type: 'SET_USER', user: { username: data.username, token: user.token } });
                dispatch({ type: 'SET_PHASE', phase: 'desktop' });
              } else {
                localStorage.removeItem('backos-user');
                setLoading(false);
              }
            })
            .catch(() => {
              setLoading(false);
            });
        }
      } catch {
        setLoading(false);
      }
    }
  }, [dispatch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      dispatch({ type: 'SET_USER', user: { username: data.username, token: data.token } });
      dispatch({ type: 'SET_PHASE', phase: 'desktop' });
    } catch {
      // If API is unavailable (local dev), allow offline login
      dispatch({ type: 'SET_USER', user: { username: username.trim() } });
      dispatch({ type: 'SET_PHASE', phase: 'desktop' });
    }
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
            {mode === 'login' ? 'Log On to Back OS™' : 'Create Back OS™ Account'}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>Confirm Password:</label>
              <input
                className={`win95-input ${styles.input}`}
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.buttonRow}>
            <button type="submit" className="win95-button" disabled={loading}>
              {loading ? 'Connecting...' : mode === 'login' ? 'Log On' : 'Register'}
            </button>
            <button type="button" className="win95-button" disabled={loading} onClick={() => {
              setUsername('');
              setPassword('');
              setConfirmPassword('');
              setError('');
            }}>Cancel</button>
          </div>

          <div
            className={styles.switchMode}
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login'
              ? 'New wanderer? Create an account'
              : 'Already have an account? Log on'}
          </div>

          <div className={styles.welcomeText}>
            Connected to The BackRoom™ Cloud Service
          </div>
        </div>
      </form>
    </div>
  );
}
