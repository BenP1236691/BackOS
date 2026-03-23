import { useState, useCallback, type MouseEvent } from 'react';

interface DesktopIconProps {
  icon: string;
  label: string;
  onDoubleClick: () => void;
}

export default function DesktopIcon({ icon, label, onDoubleClick }: DesktopIconProps) {
  const [selected, setSelected] = useState(false);

  const handleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setSelected(true);
  }, []);

  return (
    <div
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      onBlur={() => setSelected(false)}
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
