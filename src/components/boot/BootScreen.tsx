import { useState, useEffect } from 'react';
import MatrixRain from './MatrixRain';
import LogoSplash from './LogoSplash';

interface BootScreenProps {
  onComplete: () => void;
}

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [phase, setPhase] = useState<'rain' | 'logo'>('rain');

  useEffect(() => {
    const rainTimer = setTimeout(() => setPhase('logo'), 3000);
    const logoTimer = setTimeout(() => onComplete(), 5500);

    return () => {
      clearTimeout(rainTimer);
      clearTimeout(logoTimer);
    };
  }, [onComplete]);

  return phase === 'rain' ? <MatrixRain /> : <LogoSplash />;
}
