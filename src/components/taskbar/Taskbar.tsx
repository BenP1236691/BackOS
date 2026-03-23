import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../store/AppContext';
import { APP_REGISTRY, getAppDef } from '../../apps/registry';
import styles from './Taskbar.module.css';

export default function Taskbar() {
  const { state, dispatch } = useAppContext();
  const [startOpen, setStartOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenApp = useCallback((appId: string) => {
    const app = getAppDef(appId);
    if (!app) return;
    dispatch({ type: 'OPEN_WINDOW', appId, title: app.name, width: app.defaultWidth, height: app.defaultHeight });
    setStartOpen(false);
  }, [dispatch]);

  const handleWindowButtonClick = useCallback((windowId: string, minimized: boolean) => {
    if (minimized) {
      dispatch({ type: 'FOCUS_WINDOW', id: windowId });
    } else if (state.focusedWindowId === windowId) {
      dispatch({ type: 'MINIMIZE_WINDOW', id: windowId });
    } else {
      dispatch({ type: 'FOCUS_WINDOW', id: windowId });
    }
  }, [dispatch, state.focusedWindowId]);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className={styles.taskbar}>
        <button
          className={`${styles.startButton} ${startOpen ? styles.active : ''}`}
          onClick={() => setStartOpen(!startOpen)}
        >
          <span className={styles.startIcon}>⊞</span>
          Start
        </button>

        <div className={styles.divider} />

        <div className={styles.windowButtons}>
          {state.windows.map(win => {
            const app = getAppDef(win.appId);
            return (
              <button
                key={win.id}
                className={`${styles.windowButton} ${state.focusedWindowId === win.id && !win.minimized ? styles.focused : ''}`}
                onClick={() => handleWindowButtonClick(win.id, win.minimized)}
                title={win.title}
              >
                <span className={styles.windowButtonIcon}>{app?.icon || '📄'}</span>
                <span className={styles.windowButtonText}>{win.title}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.tray}>
          <span
            className={styles.trayIcon}
            title={state.isOnline ? 'BackNET: Connected' : 'BackNET: Offline'}
            onClick={() => dispatch({ type: 'TOGGLE_ONLINE' })}
          >
            {state.isOnline ? '📶' : '📵'}
          </span>
          <span
            className={styles.trayIcon}
            title="The BackRoom™ Cloud"
          >
            ☁️
          </span>
          <span
            className={styles.trayIcon}
            title={`Volume`}
          >
            🔊
          </span>
          <span className={styles.clock}>{timeStr}</span>
        </div>
      </div>

      {startOpen && (
        <>
          <div
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10000 }}
            onClick={() => setStartOpen(false)}
          />
          <div className={styles.startMenu}>
            <div className={styles.startMenuSidebar}>
              <span className={styles.startMenuSidebarText}>Back OS™</span>
            </div>
            <div className={styles.startMenuItems}>
              {APP_REGISTRY.map(app => (
                <div
                  key={app.id}
                  className={styles.startMenuItem}
                  onClick={() => handleOpenApp(app.id)}
                >
                  <span className={styles.startMenuIcon}>{app.icon}</span>
                  {app.name}
                </div>
              ))}
              <div className={styles.startMenuSeparator} />
              <div
                className={styles.startMenuItem}
                onClick={() => {
                  setStartOpen(false);
                  dispatch({ type: 'TOGGLE_SETTINGS' });
                }}
              >
                <span className={styles.startMenuIcon}>⚙️</span>
                Settings
              </div>
              <div className={styles.startMenuSeparator} />
              <div
                className={styles.startMenuItem}
                onClick={() => {
                  setStartOpen(false);
                  dispatch({ type: 'SET_USER', user: null });
                  dispatch({ type: 'SET_PHASE', phase: 'login' });
                }}
              >
                <span className={styles.startMenuIcon}>🚪</span>
                Log Off
              </div>
              <div className={styles.startMenuVersion}>
                Back OS™ v4.0.011
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
