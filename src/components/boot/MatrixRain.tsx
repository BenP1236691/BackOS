import { useRef, useEffect } from 'react';

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%^&*(){}[]|;:<>?/~';
const FONT_SIZE = 16;

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let columns: number;
    let drops: number[];
    let speeds: number[];
    let opacities: number[];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      columns = Math.floor(canvas!.width / FONT_SIZE);
      drops = Array.from({ length: columns }, () => Math.random() * -100);
      speeds = Array.from({ length: columns }, () => 0.5 + Math.random() * 1.5);
      opacities = Array.from({ length: columns }, () => 0.3 + Math.random() * 0.7);
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx!.fillStyle = 'rgba(0, 0, 0, 0.06)';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      for (let i = 0; i < columns; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        // Bright leading character
        ctx!.font = `${FONT_SIZE}px 'VT323', monospace`;
        ctx!.fillStyle = `rgba(255, 255, 200, ${opacities[i]})`;
        ctx!.fillText(char, x, y);

        // Trailing glow
        ctx!.fillStyle = `rgba(255, 215, 0, ${opacities[i] * 0.6})`;
        ctx!.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y - FONT_SIZE);

        drops[i] += speeds[i];

        if (drops[i] * FONT_SIZE > canvas!.height && Math.random() > 0.975) {
          drops[i] = 0;
          speeds[i] = 0.5 + Math.random() * 1.5;
          opacities[i] = 0.3 + Math.random() * 0.7;
        }
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#000',
      }}
    />
  );
}
