import { useState, useCallback, useRef, type MouseEvent } from 'react';
import { useAppContext } from '../../store/AppContext';
import { APP_REGISTRY } from '../../apps/registry';
import type { WallpaperOption } from '../../store/types';
import DesktopIcon from './DesktopIcon';
import styles from './Desktop.module.css';

interface ContextMenuState {
  x: number;
  y: number;
  type: 'desktop' | 'icon';
  appId?: string;
}

export default function Desktop() {
  const { state, dispatch } = useAppContext();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [wallpaperSubmenu, setWallpaperSubmenu] = useState(false);
  const [sortSubmenu, setSortSubmenu] = useState(false);
  const [selBox, setSelBox] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  const handleOpenApp = useCallback((appId: string, name: string, width: number, height: number) => {
    dispatch({ type: 'OPEN_WINDOW', appId, title: name, width, height });
  }, [dispatch]);

  const handleDesktopContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'desktop' });
    setWallpaperSubmenu(false);
    setSortSubmenu(false);
  }, []);

  const handleIconContextMenu = useCallback((e: MouseEvent, appId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'icon', appId });
    setWallpaperSubmenu(false);
    setSortSubmenu(false);
    if (!selectedIcons.has(appId)) {
      setSelectedIcons(new Set([appId]));
    }
  }, [selectedIcons]);

  const handleDesktopClick = useCallback(() => {
    setContextMenu(null);
    setSelectedIcons(new Set());
  }, []);

  const handleIconClick = useCallback((appId: string, e: MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);
    if (e.ctrlKey || e.metaKey) {
      setSelectedIcons(prev => {
        const next = new Set(prev);
        if (next.has(appId)) next.delete(appId);
        else next.add(appId);
        return next;
      });
    } else {
      setSelectedIcons(new Set([appId]));
    }
  }, []);

  const handleSelectAll = () => {
    setContextMenu(null);
    setSelectedIcons(new Set(APP_REGISTRY.filter(a => a.showOnDesktop).map(a => a.id)));
  };

  const handleAbout = () => {
    setContextMenu(null);
    dispatch({
      type: 'ADD_NOTIFICATION',
      message: 'Back OS™ v4.0.011\nNamed by popular vote in 1990 (78% — The Leaders)\nInstalled via: Pre-installed (native device)\n\n"The only functional OS on the BackNET."\n\nOrigin: Unknown. Possibly human. Possibly not.',
      notifType: 'info',
    });
  };

  const handleSetWallpaper = (wp: WallpaperOption) => {
    dispatch({ type: 'SET_WALLPAPER', wallpaper: wp });
    setContextMenu(null);
  };

  const handleOpenSelected = () => {
    setContextMenu(null);
    if (contextMenu?.appId) {
      const app = APP_REGISTRY.find(a => a.id === contextMenu.appId);
      if (app) handleOpenApp(app.id, app.name, app.defaultWidth, app.defaultHeight);
    }
  };

  const handleOpenAllSelected = () => {
    setContextMenu(null);
    selectedIcons.forEach(id => {
      const app = APP_REGISTRY.find(a => a.id === id);
      if (app) handleOpenApp(app.id, app.name, app.defaultWidth, app.defaultHeight);
    });
  };

  // Drag selection box
  const handleDesktopMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-icon]')) return;
    setSelBox({ startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY });
  };

  const handleDesktopMouseMove = (e: MouseEvent) => {
    if (!selBox) return;
    setSelBox({ ...selBox, x: e.clientX, y: e.clientY });

    // Check which icons are inside the selection box
    const rect = {
      left: Math.min(selBox.startX, e.clientX),
      top: Math.min(selBox.startY, e.clientY),
      right: Math.max(selBox.startX, e.clientX),
      bottom: Math.max(selBox.startY, e.clientY),
    };

    const selected = new Set<string>();
    const icons = desktopRef.current?.querySelectorAll('[data-icon]');
    icons?.forEach(el => {
      const r = el.getBoundingClientRect();
      const id = el.getAttribute('data-icon')!;
      if (r.left < rect.right && r.right > rect.left && r.top < rect.bottom && r.bottom > rect.top) {
        selected.add(id);
      }
    });
    setSelectedIcons(selected);
  };

  const handleDesktopMouseUp = () => {
    setSelBox(null);
  };

  const selBoxStyle = selBox ? {
    left: Math.min(selBox.startX, selBox.x),
    top: Math.min(selBox.startY, selBox.y),
    width: Math.abs(selBox.x - selBox.startX),
    height: Math.abs(selBox.y - selBox.startY),
  } : null;

  return (
    <div
      ref={desktopRef}
      className={`${styles.desktop} ${styles[`wallpaper-${state.wallpaper}`] || styles['wallpaper-backos']}`}
      onContextMenu={handleDesktopContextMenu}
      onClick={handleDesktopClick}
      onMouseDown={handleDesktopMouseDown}
      onMouseMove={handleDesktopMouseMove}
      onMouseUp={handleDesktopMouseUp}
    >
      <div className={styles.iconGrid}>
        {APP_REGISTRY.filter(a => a.showOnDesktop).map(app => (
          <DesktopIcon
            key={app.id}
            appId={app.id}
            icon={app.icon}
            label={app.name}
            selected={selectedIcons.has(app.id)}
            onClick={(e) => handleIconClick(app.id, e)}
            onDoubleClick={() => handleOpenApp(app.id, app.name, app.defaultWidth, app.defaultHeight)}
            onContextMenu={(e) => handleIconContextMenu(e, app.id)}
          />
        ))}
      </div>

      {/* Selection box */}
      {selBoxStyle && selBoxStyle.width > 3 && (
        <div className={styles.selectionBox} style={selBoxStyle} />
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.type === 'icon' ? (
            <>
              <div className={styles.contextMenuItem} onClick={handleOpenSelected}>
                Open
              </div>
              {selectedIcons.size > 1 && (
                <div className={styles.contextMenuItem} onClick={handleOpenAllSelected}>
                  Open All ({selectedIcons.size})
                </div>
              )}
              <div className={styles.contextSeparator} />
              <div className={styles.contextMenuItemDisabled}>
                Rename
              </div>
              <div className={styles.contextMenuItemDisabled}>
                Delete
              </div>
            </>
          ) : (
            <>
              <div className={styles.contextMenuItem} onClick={() => { setContextMenu(null); }}>
                Refresh
              </div>
              <div className={styles.contextSeparator} />
              <div
                className={`${styles.contextMenuItem} ${styles.contextSubmenu}`}
                onMouseEnter={() => { setSortSubmenu(true); setWallpaperSubmenu(false); }}
                onMouseLeave={() => setSortSubmenu(false)}
              >
                Sort Icons
                <span className={styles.contextSubmenuArrow}>▸</span>
                {sortSubmenu && (
                  <div className={styles.contextSubmenuItems}>
                    <div className={styles.contextMenuItem} onClick={() => setContextMenu(null)}>By Name</div>
                    <div className={styles.contextMenuItem} onClick={() => setContextMenu(null)}>By Type</div>
                  </div>
                )}
              </div>
              <div className={styles.contextMenuItem} onClick={handleSelectAll}>
                Select All
              </div>
              <div className={styles.contextSeparator} />
              <div
                className={`${styles.contextMenuItem} ${styles.contextSubmenu}`}
                onMouseEnter={() => { setWallpaperSubmenu(true); setSortSubmenu(false); }}
                onMouseLeave={() => setWallpaperSubmenu(false)}
              >
                Wallpaper
                <span className={styles.contextSubmenuArrow}>▸</span>
                {wallpaperSubmenu && (
                  <div className={styles.contextSubmenuItems}>
                    <div className={styles.contextMenuItem} onClick={() => handleSetWallpaper('backos')}>
                      {state.wallpaper === 'backos' ? '● ' : '○ '}Back OS
                    </div>
                    <div className={styles.contextMenuItem} onClick={() => handleSetWallpaper('nostalgia')}>
                      {state.wallpaper === 'nostalgia' ? '● ' : '○ '}Nostalgia
                    </div>
                    <div className={styles.contextMenuItem} onClick={() => handleSetWallpaper('frutiger-aero')}>
                      {state.wallpaper === 'frutiger-aero' ? '● ' : '○ '}Frutiger Aero
                    </div>
                    <div className={styles.contextMenuItem} onClick={() => handleSetWallpaper('retro')}>
                      {state.wallpaper === 'retro' ? '● ' : '○ '}Retro
                    </div>
                  </div>
                )}
              </div>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
