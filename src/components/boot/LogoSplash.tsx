import { useEffect, useState } from 'react';

export default function LogoSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.8s ease-in',
    }}>
      {/* Windows 95-style flag logo but in yellow */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <div style={{
            width: '40px', height: '40px', background: '#FFD700',
            clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          }} />
          <div style={{
            width: '40px', height: '40px', background: '#FFC000',
            clipPath: 'polygon(0% 0%, 80% 0%, 100% 100%, 0% 100%)',
            boxShadow: '0 0 20px rgba(255, 192, 0, 0.5)',
          }} />
          <div style={{
            width: '40px', height: '40px', background: '#B8960F',
            clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 0% 100%)',
            boxShadow: '0 0 20px rgba(184, 150, 15, 0.5)',
          }} />
          <div style={{
            width: '40px', height: '40px', background: '#8B7500',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 20% 100%)',
            boxShadow: '0 0 20px rgba(139, 117, 0, 0.5)',
          }} />
        </div>
      </div>

      <div style={{
        fontFamily: "'VT323', monospace",
        fontSize: '48px',
        color: '#FFD700',
        textShadow: '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3)',
        letterSpacing: '4px',
        marginBottom: '8px',
      }}>
        Back OS™
      </div>

      <div style={{
        fontFamily: "'VT323', monospace",
        fontSize: '16px',
        color: '#B8960F',
        letterSpacing: '2px',
      }}>
        v4.0.011
      </div>

      <div style={{
        marginTop: '40px',
        width: '200px',
        height: '4px',
        background: '#1a1600',
        overflow: 'hidden',
        borderRadius: '2px',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #FFD700, #B8960F)',
          animation: 'bootProgress 2s ease-in-out',
        }} />
      </div>

      <style>{`
        @keyframes bootProgress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}
