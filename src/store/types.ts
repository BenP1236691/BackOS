export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  preMaxBounds?: { x: number; y: number; width: number; height: number };
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  showOnDesktop: boolean;
}

export type AppPhase = 'boot' | 'login' | 'desktop';
export type ThemeMode = 'light' | 'dark';
export type WallpaperOption = 'backos' | 'nostalgia' | 'frutiger-aero' | 'retro';

export interface UserSession {
  username: string;
}

export interface AppState {
  phase: AppPhase;
  theme: ThemeMode;
  wallpaper: WallpaperOption;
  user: UserSession | null;
  windows: WindowState[];
  nextZIndex: number;
  focusedWindowId: string | null;
  settingsOpen: boolean;
  isOnline: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: number;
}

export type AppAction =
  | { type: 'SET_PHASE'; phase: AppPhase }
  | { type: 'SET_THEME'; theme: ThemeMode }
  | { type: 'SET_WALLPAPER'; wallpaper: WallpaperOption }
  | { type: 'SET_USER'; user: UserSession | null }
  | { type: 'OPEN_WINDOW'; appId: string; title: string; width: number; height: number }
  | { type: 'CLOSE_WINDOW'; id: string }
  | { type: 'FOCUS_WINDOW'; id: string }
  | { type: 'MINIMIZE_WINDOW'; id: string }
  | { type: 'MAXIMIZE_WINDOW'; id: string }
  | { type: 'RESTORE_WINDOW'; id: string }
  | { type: 'UPDATE_WINDOW_POSITION'; id: string; x: number; y: number }
  | { type: 'UPDATE_WINDOW_SIZE'; id: string; x: number; y: number; width: number; height: number }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'TOGGLE_ONLINE' }
  | { type: 'ADD_NOTIFICATION'; message: string; notifType: 'info' | 'warning' | 'error' }
  | { type: 'REMOVE_NOTIFICATION'; id: string };
