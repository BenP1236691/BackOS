import { useState, useCallback, type MouseEvent } from 'react';
import { useAppContext } from '../../store/AppContext';
import { APP_REGISTRY } from '../../apps/registry';
import DesktopIcon from './DesktopIcon';
import styles from './Desktop.module.css';

export default function Desktop() {
  const { state, dispatch } = useAppContext();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleOpenApp = useCallback((appId: string, name: string, width: number, height: number) => {
    dispatch({ type: 'OPEN_WINDOW', appId, title: name, width, height });
  }, [dispatch]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleAbout = () => {
    setContextMenu(null);
    dispatch({
      type: 'ADD_NOTIFICATION',
      message: 'Back OS™ v4.0.011\nNamed by popular vote in 1990 (78% — The Leaders)\nInstalled via: Pre-installed (native device)\n\n"The only functional OS on the BackNET."\n\nOrigin: Unknown. Possibly human. Possibly not.',
      notifType: 'info',
    });
  };

  return (
    <div
      className={`${styles.desktop} ${styles[`wallpaper-${state.wallpaper}`] || styles['wallpaper-backos']}`}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      <div className={styles.iconGrid}>
        {APP_REGISTRY.filter(a => a.showOnDesktop).map(app => (
          <DesktopIcon
            key={app.id}
            icon={app.icon}
            label={app.name}
            onDoubleClick={() => handleOpenApp(app.id, app.name, app.defaultWidth, app.defaultHeight)}
          />
        ))}
      </div>

      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.contextMenuItem} onClick={() => { setContextMenu(null); }}>
            Refresh
          </div>
          <div className={styles.contextSeparator} />
          <div className={styles.contextMenuItem} onClick={() => {
            setContextMenu(null);
            dispatch({ type: 'TOGGLE_SETTINGS' });
          }}>
            Settings
          </div>
          <div className={styles.contextSeparator} />
          <div className={styles.contextMenuItem} onClick={handleAbout}>
            About Back OS™
          </div>
        </div>
      )}
    </div>
  );
}
