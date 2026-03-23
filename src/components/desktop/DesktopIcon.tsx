import { type MouseEvent } from 'react';

interface DesktopIconProps {
  appId: string;
  icon: string;
  label: string;
  selected: boolean;
  onClick: (e: MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: MouseEvent) => void;
}

export default function DesktopIcon({ appId, icon, label, selected, onClick, onDoubleClick, onContextMenu }: DesktopIconProps) {
  return (
    <div
      data-icon={appId}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '75px',
        padding: '4px',
        cursor: 'pointer',
        gap: '2px',
      }}
    >
      <div style={{
        fontSize: '32px',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: selected ? 'rgba(255, 215, 0, 0.3)' : 'transparent',
        border: selected ? '1px dotted #FFD700' : '1px solid transparent',
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: '11px',
        color: '#FFD700',
        textShadow: '1px 1px 2px #000, -1px -1px 2px #000',
        textAlign: 'center',
        lineHeight: '1.2',
        padding: '1px 2px',
        background: selected ? 'rgba(255, 215, 0, 0.3)' : 'transparent',
        wordBreak: 'break-word',
        maxWidth: '75px',
      }}>
        {label}
      </span>
    </div>
  );
}
