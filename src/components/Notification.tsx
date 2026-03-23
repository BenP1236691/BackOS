import { useAppContext } from '../store/AppContext';
import '../styles/win95.css';

export default function NotificationManager() {
  const { state, dispatch } = useAppContext();

  if (state.notifications.length === 0) return null;

  const notif = state.notifications[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 30000,
    }} onClick={() => dispatch({ type: 'REMOVE_NOTIFICATION', id: notif.id })}>
      <div style={{
        width: '380px',
        background: 'var(--color-surface)',
        boxShadow: 'inset -1px -1px 0 0 #000, inset 1px 1px 0 0 var(--border-light), inset -2px -2px 0 0 var(--border-shadow), inset 2px 2px 0 0 var(--border-highlight), 4px 4px 20px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          background: 'linear-gradient(90deg, #B8960F, #FFD700)',
          color: '#fff',
          padding: '4px 8px',
          fontWeight: 'bold',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          {notif.type === 'error' ? '❌' : notif.type === 'warning' ? '⚠️' : 'ℹ️'} Back OS™
        </div>
        <div style={{ padding: '16px', display: 'flex', gap: '12px' }}>
          <div style={{ fontSize: '32px', flexShrink: 0 }}>
            {notif.type === 'error' ? '❌' : notif.type === 'warning' ? '⚠️' : 'ℹ️'}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--color-text)',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5',
          }}>
            {notif.message}
          </div>
        </div>
        <div style={{
          padding: '8px 16px 12px',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <button
            className="win95-button"
            onClick={() => dispatch({ type: 'REMOVE_NOTIFICATION', id: notif.id })}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
