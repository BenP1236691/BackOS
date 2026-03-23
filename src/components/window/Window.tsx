import { useRef, useCallback, type ReactNode, type PointerEvent } from 'react';
import { useAppContext } from '../../store/AppContext';
import type { WindowState } from '../../store/types';
import styles from './Window.module.css';

interface WindowProps {
  state: WindowState;
  icon?: string;
  isFocused: boolean;
  children: ReactNode;
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;

export default function Window({ state, icon, isFocused, children }: WindowProps) {
  const { dispatch } = useAppContext();
  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(null);
  const resizeRef = useRef<{
    dir: ResizeDir;
    startX: number;
    startY: number;
    winX: number;
    winY: number;
    winW: number;
    winH: number;
  } | null>(null);

  const handleFocus = useCallback(() => {
    if (!isFocused) {
      dispatch({ type: 'FOCUS_WINDOW', id: state.id });
    }
  }, [dispatch, state.id, isFocused]);

  // Drag handlers
  const onTitlePointerDown = useCallback((e: PointerEvent) => {
    if (state.maximized) return;
    e.preventDefault();
    handleFocus();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      winX: state.x,
      winY: state.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [state.maximized, state.x, state.y, handleFocus]);

  const onTitlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = dragRef.current.winX + dx;
    const newY = Math.max(0, dragRef.current.winY + dy);
    dispatch({ type: 'UPDATE_WINDOW_POSITION', id: state.id, x: newX, y: newY });
  }, [dispatch, state.id]);

  const onTitlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Resize handlers
  const onResizePointerDown = useCallback((dir: ResizeDir) => (e: PointerEvent) => {
    if (state.maximized) return;
    e.preventDefault();
    e.stopPropagation();
    handleFocus();
    resizeRef.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      winX: state.x,
      winY: state.y,
      winW: state.width,
      winH: state.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [state.maximized, state.x, state.y, state.width, state.height, handleFocus]);

  const onResizePointerMove = useCallback((e: PointerEvent) => {
    if (!resizeRef.current) return;
    const r = resizeRef.current;
    const dx = e.clientX - r.startX;
    const dy = e.clientY - r.startY;

    let x = r.winX, y = r.winY, w = r.winW, h = r.winH;

    if (r.dir.includes('e')) w = Math.max(MIN_WIDTH, r.winW + dx);
    if (r.dir.includes('w')) {
      w = Math.max(MIN_WIDTH, r.winW - dx);
      x = r.winX + (r.winW - w);
    }
    if (r.dir.includes('s')) h = Math.max(MIN_HEIGHT, r.winH + dy);
    if (r.dir.includes('n') && r.dir !== 'ne' && r.dir !== 'nw') {
      h = Math.max(MIN_HEIGHT, r.winH - dy);
      y = Math.max(0, r.winY + (r.winH - h));
    }
    if (r.dir === 'n') {
      h = Math.max(MIN_HEIGHT, r.winH - dy);
      y = Math.max(0, r.winY + (r.winH - h));
    }
    if (r.dir === 'ne') {
      h = Math.max(MIN_HEIGHT, r.winH - dy);
      y = Math.max(0, r.winY + (r.winH - h));
    }
    if (r.dir === 'nw') {
      h = Math.max(MIN_HEIGHT, r.winH - dy);
      y = Math.max(0, r.winY + (r.winH - h));
    }

    dispatch({ type: 'UPDATE_WINDOW_SIZE', id: state.id, x, y, width: w, height: h });
  }, [dispatch, state.id]);

  const onResizePointerUp = useCallback(() => {
    resizeRef.current = null;
  }, []);

  const handleMinimize = () => dispatch({ type: 'MINIMIZE_WINDOW', id: state.id });
  const handleMaximize = () => {
    if (state.maximized) {
      dispatch({ type: 'RESTORE_WINDOW', id: state.id });
    } else {
      dispatch({ type: 'MAXIMIZE_WINDOW', id: state.id });
    }
  };
  const handleClose = () => dispatch({ type: 'CLOSE_WINDOW', id: state.id });

  const resizeHandleProps = (dir: ResizeDir) => ({
    onPointerDown: onResizePointerDown(dir),
    onPointerMove: onResizePointerMove,
    onPointerUp: onResizePointerUp,
  });

  if (state.minimized) return null;

  return (
    <div
      className={styles.window}
      style={{
        left: state.x,
        top: state.y,
        width: state.width,
        height: state.height,
        zIndex: state.zIndex,
      }}
      onPointerDown={handleFocus}
    >
      {/* Title bar */}
      <div
        className={`${styles.titleBar} ${isFocused ? styles.active : styles.inactive}`}
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
        onDoubleClick={handleMaximize}
      >
        {icon && <span className={styles.titleIcon}>{icon}</span>}
        <span className={`${styles.titleText} ${isFocused ? styles.active : styles.inactive}`}>
          {state.title}
        </span>
        <div className={styles.titleButtons}>
          <button className={styles.titleButton} onClick={handleMinimize} title="Minimize">_</button>
          <button className={styles.titleButton} onClick={handleMaximize} title={state.maximized ? 'Restore' : 'Maximize'}>
            {state.maximized ? '❐' : '□'}
          </button>
          <button className={styles.titleButton} onClick={handleClose} title="Close">×</button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {children}
      </div>

      {/* Resize handles */}
      {!state.maximized && (
        <>
          <div className={styles.resizeN} {...resizeHandleProps('n')} />
          <div className={styles.resizeS} {...resizeHandleProps('s')} />
          <div className={styles.resizeE} {...resizeHandleProps('e')} />
          <div className={styles.resizeW} {...resizeHandleProps('w')} />
          <div className={styles.resizeNE} {...resizeHandleProps('ne')} />
          <div className={styles.resizeNW} {...resizeHandleProps('nw')} />
          <div className={styles.resizeSE} {...resizeHandleProps('se')} />
          <div className={styles.resizeSW} {...resizeHandleProps('sw')} />
        </>
      )}
    </div>
  );
}
