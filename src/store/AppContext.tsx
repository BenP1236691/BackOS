import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react';
import type { AppState, AppAction, ThemeMode, WallpaperOption } from './types';

const generateId = () => crypto.randomUUID();

const initialState: AppState = {
  phase: 'boot',
  theme: (localStorage.getItem('backos-theme') as ThemeMode) || 'light',
  wallpaper: (localStorage.getItem('backos-wallpaper') as WallpaperOption) || 'backos',
  user: localStorage.getItem('backos-user') ? JSON.parse(localStorage.getItem('backos-user')!) : null,
  windows: [],
  nextZIndex: 100,
  focusedWindowId: null,
  settingsOpen: false,
  isOnline: true,
  notifications: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'SET_THEME':
      localStorage.setItem('backos-theme', action.theme);
      return { ...state, theme: action.theme };

    case 'SET_WALLPAPER':
      localStorage.setItem('backos-wallpaper', action.wallpaper);
      return { ...state, wallpaper: action.wallpaper };

    case 'SET_USER':
      if (action.user) {
        localStorage.setItem('backos-user', JSON.stringify(action.user));
      } else {
        localStorage.removeItem('backos-user');
      }
      return { ...state, user: action.user };

    case 'OPEN_WINDOW': {
      const id = generateId();
      const offset = (state.windows.length % 8) * 30;
      const newWindow = {
        id,
        appId: action.appId,
        title: action.title,
        x: 80 + offset,
        y: 60 + offset,
        width: action.width,
        height: action.height,
        zIndex: state.nextZIndex,
        minimized: false,
        maximized: false,
      };
      return {
        ...state,
        windows: [...state.windows, newWindow],
        nextZIndex: state.nextZIndex + 1,
        focusedWindowId: id,
      };
    }

    case 'CLOSE_WINDOW':
      return {
        ...state,
        windows: state.windows.filter(w => w.id !== action.id),
        focusedWindowId: state.focusedWindowId === action.id ? null : state.focusedWindowId,
      };

    case 'FOCUS_WINDOW':
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.id ? { ...w, zIndex: state.nextZIndex, minimized: false } : w
        ),
        nextZIndex: state.nextZIndex + 1,
        focusedWindowId: action.id,
      };

    case 'MINIMIZE_WINDOW':
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.id ? { ...w, minimized: true } : w
        ),
        focusedWindowId: state.focusedWindowId === action.id ? null : state.focusedWindowId,
      };

    case 'MAXIMIZE_WINDOW':
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.id
            ? {
                ...w,
                maximized: true,
                preMaxBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
                x: 0,
                y: 0,
                width: window.innerWidth,
                height: window.innerHeight - 36,
                zIndex: state.nextZIndex,
              }
            : w
        ),
        nextZIndex: state.nextZIndex + 1,
        focusedWindowId: action.id,
      };

    case 'RESTORE_WINDOW':
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.id && w.preMaxBounds
            ? {
                ...w,
                maximized: false,
                x: w.preMaxBounds.x,
                y: w.preMaxBounds.y,
                width: w.preMaxBounds.width,
                height: w.preMaxBounds.height,
                preMaxBounds: undefined,
                zIndex: state.nextZIndex,
              }
            : w
        ),
        nextZIndex: state.nextZIndex + 1,
        focusedWindowId: action.id,
      };

    case 'UPDATE_WINDOW_POSITION':
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.id ? { ...w, x: action.x, y: action.y } : w
        ),
      };

    case 'UPDATE_WINDOW_SIZE':
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.id
            ? { ...w, x: action.x, y: action.y, width: action.width, height: action.height }
            : w
        ),
      };

    case 'TOGGLE_SETTINGS':
      return { ...state, settingsOpen: !state.settingsOpen };

    case 'TOGGLE_ONLINE':
      return { ...state, isOnline: !state.isOnline };

    case 'ADD_NOTIFICATION': {
      const notif = {
        id: generateId(),
        message: action.message,
        type: action.notifType,
        timestamp: Date.now(),
      };
      return { ...state, notifications: [...state.notifications, notif] };
    }

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id),
      };

    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
