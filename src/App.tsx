import { useCallback, useEffect } from 'react';
import { useAppContext } from './store/AppContext';
import { getAppDef } from './apps/registry';
import BootScreen from './components/boot/BootScreen';
import LoginScreen from './components/login/LoginScreen';
import Desktop from './components/desktop/Desktop';
import Taskbar from './components/taskbar/Taskbar';
import Window from './components/window/Window';
import SettingsPanel from './components/settings/SettingsPanel';
import NotificationManager from './components/Notification';

import BackNetExplorer from './apps/backnet-explorer/BackNetExplorer';
import BackCodeStudio from './apps/backcode-studio/BackCodeStudio';
import BackFilesExplorer from './apps/backfiles-explorer/BackFilesExplorer';
import BackOffice from './apps/back-office/BackOffice';
import BackMail from './apps/backmail/BackMail';
import BackStore from './apps/backstore/BackStore';
import DrawBack from './apps/drawback/DrawBack';
import JohnBackrooms from './apps/john-backrooms/JohnBackrooms';
import BackNetDeploy from './apps/backnet-deploy/BackNetDeploy';
import TheBackRoom from './apps/the-backroom/TheBackRoom';

import './styles/themes.css';
import './styles/global.css';
import './styles/win95.css';

const APP_COMPONENTS: Record<string, React.FC<{ windowId: string }>> = {
  'backnet-explorer': BackNetExplorer,
  'backcode-studio': BackCodeStudio,
  'backfiles-explorer': BackFilesExplorer,
  'back-office': BackOffice,
  'backmail': BackMail,
  'backstore': BackStore,
  'drawback': DrawBack,
  'john-backrooms': JohnBackrooms,
  'backnet-deploy': BackNetDeploy,
  'the-backroom': TheBackRoom,
};

function AppShell() {
  const { state, dispatch } = useAppContext();

  const handleBootComplete = useCallback(() => {
    if (state.user) {
      dispatch({ type: 'SET_PHASE', phase: 'desktop' });
    } else {
      dispatch({ type: 'SET_PHASE', phase: 'login' });
    }
  }, [state.user, dispatch]);

  // CTRL+ALT+DEL handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'Delete') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_SETTINGS' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  if (state.phase === 'boot') {
    return <BootScreen onComplete={handleBootComplete} />;
  }

  if (state.phase === 'login') {
    return <LoginScreen />;
  }

  return (
    <>
      <Desktop />

      {state.windows.map(win => {
        const AppComponent = APP_COMPONENTS[win.appId];
        const appDef = getAppDef(win.appId);
        if (!AppComponent) return null;

        return (
          <Window
            key={win.id}
            state={win}
            icon={appDef?.icon}
            isFocused={state.focusedWindowId === win.id}
          >
            <AppComponent windowId={win.id} />
          </Window>
        );
      })}

      <Taskbar />

      {state.settingsOpen && <SettingsPanel />}

      <NotificationManager />
    </>
  );
}

export default function App() {
  return <AppShell />;
}
