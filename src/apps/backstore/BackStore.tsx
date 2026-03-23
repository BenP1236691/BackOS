import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './BackStore.module.css';

interface Props {
  windowId: string;
}

interface Game {
  id: string;
  title: string;
  genre: string;
  description: string;
  gradient: string;
}

const games: Game[] = [
  {
    id: 'hallway-runner',
    title: 'Infinite Hallway Runner',
    genre: 'Endless Runner',
    description: "Run through procedurally generated hallways. Don't look back.",
    gradient: 'linear-gradient(135deg, #3a3000, #706020, #B8960F)',
  },
  {
    id: 'entity-escape',
    title: 'Entity Escape',
    genre: 'Horror/Stealth',
    description: 'Stealth-based survival. Avoid entities at all costs.',
    gradient: 'linear-gradient(135deg, #1a0000, #4a0000, #8B0000)',
  },
  {
    id: 'level-explorer',
    title: 'Level Explorer 3D',
    genre: 'Exploration',
    description: 'Map the unmappable. Document every level you find.',
    gradient: 'linear-gradient(135deg, #001a1a, #004040, #006060)',
  },
  {
    id: 'threshold',
    title: 'The Threshold',
    genre: 'Puzzle/Philosophical',
    description: 'Cross between levels. But at what cost?',
    gradient: 'linear-gradient(135deg, #1a001a, #400040, #600060)',
  },
];

// ==================== HALLWAY RUNNER ====================
function HallwayRunner({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef({
    playerY: 0,
    velocityY: 0,
    isJumping: false,
    obstacles: [] as { x: number; width: number; height: number }[],
    score: 0,
    gameOver: false,
    groundY: 0,
    frameId: 0,
    speed: 4,
  });

  const resetGame = useCallback(() => {
    const g = gameRef.current;
    g.playerY = 0;
    g.velocityY = 0;
    g.isJumping = false;
    g.obstacles = [];
    g.score = 0;
    g.gameOver = false;
    g.speed = 4;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth ?? 400;
    canvas.height = canvas.parentElement?.clientHeight ?? 300;

    const g = gameRef.current;
    g.groundY = canvas.height - 40;
    g.playerY = g.groundY;

    let spawnTimer = 0;

    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'ArrowUp') && !g.isJumping && !g.gameOver) {
        e.preventDefault();
        g.velocityY = -12;
        g.isJumping = true;
      }
    };
    window.addEventListener('keydown', handleKey);

    const loop = () => {
      if (!ctx || !canvas) return;

      // Background - yellow hallway
      ctx.fillStyle = '#1a1800';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor
      ctx.fillStyle = '#3a3000';
      ctx.fillRect(0, g.groundY + 20, canvas.width, 20);

      // Ceiling lights
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.fillStyle = Math.random() > 0.05 ? '#FFD70040' : '#FFD70010';
        ctx.fillRect(x + 20, 5, 20, 3);
      }

      if (!g.gameOver) {
        // Physics
        g.velocityY += 0.6;
        g.playerY += g.velocityY;
        if (g.playerY >= g.groundY) {
          g.playerY = g.groundY;
          g.velocityY = 0;
          g.isJumping = false;
        }

        // Spawn obstacles
        spawnTimer++;
        if (spawnTimer > 80 + Math.random() * 60) {
          spawnTimer = 0;
          const h = 20 + Math.random() * 30;
          g.obstacles.push({ x: canvas.width, width: 20 + Math.random() * 15, height: h });
        }

        // Move obstacles
        g.obstacles.forEach(o => { o.x -= g.speed; });
        g.obstacles = g.obstacles.filter(o => o.x > -50);

        g.score++;
        g.speed = 4 + Math.floor(g.score / 500) * 0.5;

        // Collision
        const playerBox = { x: 40, y: g.playerY - 20, w: 20, h: 20 };
        for (const o of g.obstacles) {
          const obsBox = { x: o.x, y: g.groundY + 20 - o.height, w: o.width, h: o.height };
          if (
            playerBox.x < obsBox.x + obsBox.w &&
            playerBox.x + playerBox.w > obsBox.x &&
            playerBox.y + playerBox.h > obsBox.y
          ) {
            g.gameOver = true;
          }
        }
      }

      // Draw obstacles
      ctx.fillStyle = '#4a0000';
      for (const o of g.obstacles) {
        ctx.fillRect(o.x, g.groundY + 20 - o.height, o.width, o.height);
        ctx.strokeStyle = '#8B0000';
        ctx.strokeRect(o.x, g.groundY + 20 - o.height, o.width, o.height);
      }

      // Draw player
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(40, g.playerY - 20, 20, 20);
      ctx.strokeStyle = '#B8960F';
      ctx.strokeRect(40, g.playerY - 20, 20, 20);

      // Score
      ctx.fillStyle = '#FFD700';
      ctx.font = '14px "Courier New", monospace';
      ctx.fillText(`Score: ${Math.floor(g.score / 10)}`, 10, 25);

      // Floor line
      ctx.strokeStyle = '#706020';
      ctx.beginPath();
      ctx.moveTo(0, g.groundY + 20);
      ctx.lineTo(canvas.width, g.groundY + 20);
      ctx.stroke();

      if (g.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#FFD700';
        ctx.font = '16px "Courier New", monospace';
        ctx.fillText(`Score: ${Math.floor(g.score / 10)}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillStyle = '#706020';
        ctx.font = '12px "Courier New", monospace';
        ctx.fillText('The hallway claimed another victim.', canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = 'left';
      }

      g.frameId = requestAnimationFrame(loop);
    };

    g.frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(g.frameId);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onBack}>Back to Store</button>
        <span className={styles.gameTitle}>Infinite Hallway Runner</span>
        {gameRef.current.gameOver && (
          <button className={styles.retryBtn} onClick={resetGame}>Try Again</button>
        )}
      </div>
      <div className={styles.gameCanvas}>
        <canvas ref={canvasRef} />
      </div>
      <div className={styles.gameControls}>Space / Up Arrow = Jump</div>
    </div>
  );
}

// ==================== ENTITY ESCAPE ====================
function EntityEscape({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const gameRef = useRef({
    player: { x: 0, y: 0 },
    entities: [] as { x: number; y: number }[],
    exit: { x: 0, y: 0 },
    gridSize: 8,
    cellSize: 0,
  });

  const initLevel = useCallback((lvl: number) => {
    const g = gameRef.current;
    g.gridSize = 6 + lvl * 2;
    g.player = { x: 0, y: 0 };
    g.exit = { x: g.gridSize - 1, y: g.gridSize - 1 };
    g.entities = [];
    const entityCount = 2 + lvl;
    for (let i = 0; i < entityCount; i++) {
      let ex: number, ey: number;
      do {
        ex = Math.floor(Math.random() * g.gridSize);
        ey = Math.floor(Math.random() * g.gridSize);
      } while ((ex === 0 && ey === 0) || (ex === g.gridSize - 1 && ey === g.gridSize - 1));
      g.entities.push({ x: ex, y: ey });
    }
    setGameOver(false);
    setWon(false);
  }, []);

  useEffect(() => { initLevel(level); }, [level, initLevel]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const g = gameRef.current;
    g.cellSize = Math.min(Math.floor(canvas.width / g.gridSize), Math.floor(canvas.height / g.gridSize));
    const offsetX = (canvas.width - g.cellSize * g.gridSize) / 2;
    const offsetY = (canvas.height - g.cellSize * g.gridSize) / 2;

    ctx.fillStyle = '#0a0800';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    for (let y = 0; y < g.gridSize; y++) {
      for (let x = 0; x < g.gridSize; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#1a1800' : '#141200';
        ctx.fillRect(offsetX + x * g.cellSize, offsetY + y * g.cellSize, g.cellSize, g.cellSize);
        ctx.strokeStyle = '#3a3000';
        ctx.strokeRect(offsetX + x * g.cellSize, offsetY + y * g.cellSize, g.cellSize, g.cellSize);
      }
    }

    // Exit
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(
      offsetX + g.exit.x * g.cellSize + g.cellSize / 2,
      offsetY + g.exit.y * g.cellSize + g.cellSize / 2,
      g.cellSize / 3, 0, Math.PI * 2
    );
    ctx.fill();

    // Entities
    ctx.fillStyle = '#FF0000';
    for (const e of g.entities) {
      ctx.beginPath();
      ctx.arc(
        offsetX + e.x * g.cellSize + g.cellSize / 2,
        offsetY + e.y * g.cellSize + g.cellSize / 2,
        g.cellSize / 3, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // Player
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(
      offsetX + g.player.x * g.cellSize + g.cellSize / 2,
      offsetY + g.player.y * g.cellSize + g.cellSize / 2,
      g.cellSize / 3, 0, Math.PI * 2
    );
    ctx.fill();

    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AN ENTITY FOUND YOU', canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
    }

    if (won) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`LEVEL ${level} CLEARED!`, canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillStyle = '#FFD700';
      ctx.font = '14px "Courier New", monospace';
      ctx.fillText('Press any key for next level...', canvas.width / 2, canvas.height / 2 + 20);
      ctx.textAlign = 'left';
    }
  }, [gameOver, won, level]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const g = gameRef.current;

      if (won) {
        setLevel(prev => prev + 1);
        return;
      }
      if (gameOver) return;

      let dx = 0, dy = 0;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') dy = -1;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') dy = 1;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') dx = -1;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') dx = 1;
      if (dx === 0 && dy === 0) return;
      e.preventDefault();

      const nx = g.player.x + dx;
      const ny = g.player.y + dy;
      if (nx < 0 || nx >= g.gridSize || ny < 0 || ny >= g.gridSize) return;
      g.player = { x: nx, y: ny };

      // Move entities randomly
      for (const ent of g.entities) {
        const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const enx = ent.x + dir.x;
        const eny = ent.y + dir.y;
        if (enx >= 0 && enx < g.gridSize && eny >= 0 && eny < g.gridSize) {
          ent.x = enx;
          ent.y = eny;
        }
      }

      // Check collisions
      for (const ent of g.entities) {
        if (ent.x === g.player.x && ent.y === g.player.y) {
          setGameOver(true);
          draw();
          return;
        }
      }

      // Check exit
      if (g.player.x === g.exit.x && g.player.y === g.exit.y) {
        setWon(true);
      }

      draw();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameOver, won, draw]);

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onBack}>Back to Store</button>
        <span className={styles.gameTitle}>Entity Escape - Level {level}</span>
        {gameOver && (
          <button className={styles.retryBtn} onClick={() => initLevel(level)}>Try Again</button>
        )}
      </div>
      <div className={styles.gameCanvas}>
        <canvas ref={canvasRef} />
      </div>
      <div className={styles.gameControls}>WASD / Arrow Keys = Move | Yellow = You | Red = Entities | Green = Exit</div>
    </div>
  );
}

// ==================== LEVEL EXPLORER 3D ====================
function LevelExplorer3D({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [depth, setDepth] = useState(0);
  const posRef = useRef({ x: 0, z: 0, angle: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const w = canvas.width;
    const h = canvas.height;
    const pos = posRef.current;

    // Background - dark
    ctx.fillStyle = '#0a0800';
    ctx.fillRect(0, 0, w, h);

    // Corridor rendering - fake 3D perspective
    const numLayers = 12;
    const flickerBase = Math.sin(Date.now() / 200 + pos.x) * 0.05;

    for (let i = numLayers; i >= 0; i--) {
      const t = i / numLayers;
      const shrink = t * 0.4 + 0.05;

      const cx = w / 2 + Math.sin(pos.angle + i * 0.1) * (20 * t);
      const cy = h / 2 + Math.cos(pos.angle * 0.5 + i * 0.05) * (10 * t);

      const rectW = w * (1 - shrink * 2);
      const rectH = h * (1 - shrink * 2);
      const rx = cx - rectW / 2;
      const ry = cy - rectH / 2;

      // Walls
      const brightness = Math.max(0, Math.min(255, Math.floor(40 + (1 - t) * 30 + flickerBase * 100)));
      const yellowTint = Math.floor(brightness * 0.85);
      ctx.fillStyle = `rgb(${brightness}, ${yellowTint}, ${Math.floor(brightness * 0.2)})`;
      ctx.fillRect(rx, ry, rectW, rectH);

      // Inner darker area (floor/ceiling distinction)
      ctx.strokeStyle = `rgba(100, 80, 20, ${0.3 * (1 - t)})`;
      ctx.strokeRect(rx, ry, rectW, rectH);

      // Fluorescent light on ceiling
      if (i % 3 === 0) {
        const lightAlpha = (1 - t) * (0.4 + flickerBase + (Math.random() > 0.95 ? -0.3 : 0));
        ctx.fillStyle = `rgba(255, 215, 0, ${Math.max(0, lightAlpha)})`;
        const lightW = rectW * 0.3;
        ctx.fillRect(cx - lightW / 2, ry + 2, lightW, 3);
      }
    }

    // Center vanishing point glow
    ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 30, 0, Math.PI * 2);
    ctx.fill();

    // HUD
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText(`Depth: ${depth}m`, 10, 20);
    ctx.fillText(`Position: (${Math.floor(pos.x)}, ${Math.floor(pos.z)})`, 10, 36);
    ctx.fillStyle = '#706020';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('The hum is getting louder...', 10, h - 10);
  }, [depth]);

  useEffect(() => {
    draw();
    let animFrame: number;
    const animate = () => {
      draw();
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [draw]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const pos = posRef.current;
      const step = 1;
      if (e.key === 'ArrowUp' || e.key === 'w') {
        pos.z += step;
        setDepth(prev => prev + 1);
      }
      if (e.key === 'ArrowDown' || e.key === 's') {
        pos.z -= step;
        setDepth(prev => Math.max(0, prev - 1));
      }
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        pos.angle -= 0.15;
        pos.x -= step;
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        pos.angle += 0.15;
        pos.x += step;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onBack}>Back to Store</button>
        <span className={styles.gameTitle}>Level Explorer 3D</span>
      </div>
      <div className={styles.gameCanvas}>
        <canvas ref={canvasRef} />
      </div>
      <div className={styles.gameControls}>Arrow Keys / WASD = Move & Look around</div>
    </div>
  );
}

// ==================== THE THRESHOLD ====================
interface StoryNode {
  text: string;
  choices: { label: string; next: string }[];
}

const STORY: Record<string, StoryNode> = {
  start: {
    text: "You wake up in a yellow-carpeted room. The fluorescent lights buzz overhead. Three doors stand before you. The air smells like wet carpet and ozone. You don't remember how you got here.",
    choices: [
      { label: 'Open the left door', next: 'left_door' },
      { label: 'Open the middle door', next: 'middle_door' },
      { label: 'Open the right door', next: 'right_door' },
      { label: 'Stay and wait', next: 'wait' },
    ],
  },
  left_door: {
    text: "The door opens into an impossibly long hallway. The same yellow wallpaper stretches into infinity. You hear footsteps behind you, but when you turn, nothing is there. The footsteps continue.",
    choices: [
      { label: 'Run down the hallway', next: 'run_hallway' },
      { label: 'Stand still and close your eyes', next: 'close_eyes' },
      { label: 'Turn back through the door', next: 'turn_back' },
    ],
  },
  middle_door: {
    text: "A room identical to the one you just left. The same three doors. The same buzzing lights. But something is different. The walls seem to be breathing. Slowly. In. Out.",
    choices: [
      { label: 'Open the left door again', next: 'loop_room' },
      { label: 'Touch the breathing wall', next: 'touch_wall' },
      { label: 'Look at the ceiling closely', next: 'ceiling' },
    ],
  },
  right_door: {
    text: "Complete darkness. The door closes behind you. You can hear breathing that isn't yours. Something brushes past your arm. It's warm. It says, in a voice like crackling static: 'You're not supposed to be here. =)'",
    choices: [
      { label: 'Ask who they are', next: 'ask_entity' },
      { label: 'Stay completely silent', next: 'silent' },
      { label: 'Try to find the door handle', next: 'find_door' },
    ],
  },
  wait: {
    text: "Time passes. Hours? Days? The lights flicker. You notice the carpet is slowly getting damp. Water is rising from below. The buzzing gets louder. You notice writing on the wall that wasn't there before: 'THEY KNOW YOU'RE WAITING.'",
    choices: [
      { label: 'Finally open a door (left)', next: 'left_door' },
      { label: 'Read more of the writing', next: 'read_writing' },
    ],
  },
  run_hallway: {
    text: "You run. And run. The hallway doesn't end. The footsteps behind you get louder. Closer. Faster. Then suddenly - an exit. A normal door with an EXIT sign above it, glowing green. It seems too easy.",
    choices: [
      { label: 'Go through the exit', next: 'escape' },
      { label: 'Keep running past it', next: 'keep_running' },
    ],
  },
  close_eyes: {
    text: "The footsteps stop. The buzzing stops. Everything is silent. When you open your eyes, you're standing in a field of yellow flowers under a gray sky. There is no building. No hallway. Just flowers, stretching in every direction. You can't remember your name.",
    choices: [
      { label: 'Walk into the flowers', next: 'flowers_end' },
    ],
  },
  turn_back: {
    text: "The door is gone. There is only wall now. Yellow wallpaper. The footsteps are right behind you. You feel warm breath on your neck. A whisper: 'Don't turn around. Keep walking forward. I'll guide you. Trust me. =)'",
    choices: [
      { label: 'Trust the voice', next: 'trust_voice' },
      { label: 'Turn around anyway', next: 'turn_around_end' },
    ],
  },
  loop_room: {
    text: "The same room again. And again. You open doors, and find the same room. After the 47th iteration, you notice the lights have gotten dimmer. The carpet is different. The walls stopped breathing. They're watching instead.",
    choices: [
      { label: 'Accept the loop', next: 'loop_end' },
    ],
  },
  touch_wall: {
    text: "The wall is warm and soft. It pulses under your fingers. Then it opens. Behind the wallpaper is a window. Through the window, you can see the outside world. Your house. Your street. Normal life. But you can't break through. You can only watch. Something behind you whispers: 'This is what you left behind.'",
    choices: [
      { label: 'Try to break the window', next: 'break_window_end' },
      { label: 'Turn away from the window', next: 'start' },
    ],
  },
  ceiling: {
    text: "The ceiling is covered in faces. Hundreds of them. They're pressed into the plaster like death masks. Some have their eyes open. They're looking at you. One of them mouths the word: 'EXIT'. Its eyes flick to the floor. There's a trapdoor you hadn't noticed before.",
    choices: [
      { label: 'Open the trapdoor', next: 'escape' },
      { label: 'Look away from the faces', next: 'start' },
    ],
  },
  ask_entity: {
    text: "'I'm what's left of the last person who asked that question.' The static-voice laughs. It's a horrible sound. Then a light appears. A birthday party. Balloons. Cake. Party hats. Everything is yellow. 'Stay with us!' the voice says cheerfully. 'Stay forever! =)'",
    choices: [
      { label: 'Join the party', next: 'party_end' },
      { label: 'Refuse', next: 'find_door' },
    ],
  },
  silent: {
    text: "Your silence seems to work. The breathing fades. A dim light appears ahead - another room. This one has a desk with a computer on it. The screen shows a command prompt. It reads: 'TYPE YOUR NAME TO EXIT.' The cursor blinks.",
    choices: [
      { label: 'Type your name', next: 'escape' },
      { label: "Type 'HELP'", next: 'help_end' },
    ],
  },
  find_door: {
    text: "Your hands find the door handle. You turn it. Light floods in. You're back in the first room. But now there's only one door. And it's open. Through it, you can see a staircase going up. The buzzing sound is coming from above.",
    choices: [
      { label: 'Climb the stairs', next: 'escape' },
      { label: 'Go back into the dark room', next: 'right_door' },
    ],
  },
  read_writing: {
    text: "More text appears as you read: 'THE EXIT IS WHERE YOU STARTED. THE EXIT IS WHERE YOU STARTED. THE EXIT IS WHERE YOU STARTED.' The water is at your ankles now. The carpet floats. The writing changes: 'TOO LATE.'",
    choices: [
      { label: 'Accept your fate', next: 'drown_end' },
    ],
  },
  keep_running: {
    text: "You run past the exit. Why? Something told you not to trust it. The hallway continues. Then stops. A dead end. The wallpaper here is red. Written in the red wallpaper: 'YOU SHOULD HAVE TAKEN THE EXIT.' The footsteps arrive.",
    choices: [
      { label: '...', next: 'caught_end' },
    ],
  },
  trust_voice: {
    text: "The voice guides you through twisting corridors. Left. Right. Right. Down. Through a hole in the floor. Up a ladder. Through water. The voice never stops whispering. After what feels like years, you see light. Real sunlight. You step through. You're outside. Free. The voice whispers one last time: 'Tell no one about this place. =)'",
    choices: [
      { label: 'Walk into the light', next: 'escape' },
    ],
  },
  // Endings
  escape: {
    text: "You made it out. The sunlight is blinding after so long in fluorescent yellow. The air smells real. Behind you, there's nothing but an empty parking lot. No building. No doors. Just cracked asphalt and dandelions. You're free. But some nights, you still hear the buzzing.",
    choices: [
      { label: 'Play again', next: 'start' },
    ],
  },
  flowers_end: {
    text: "You walk through the flowers forever. There is no edge. No end. You forget everything. Your name. Your face. Your life. You become part of the yellow field. Another flower among millions. The sky hums at 60Hz. You are content. You are nothing. ENDING: THE FORGOTTEN",
    choices: [
      { label: 'Play again', next: 'start' },
    ],
  },
  turn_around_end: {
    text: "You turn around. You see it. You wish you hadn't. Your mind breaks like glass. The last thing you hear is that voice: 'I told you not to turn around. =)' Everything goes yellow. ENDING: THE SEEN",
    choices: [
      { label: 'Play again', next: 'start' },
    ],
  },
  loop_end: {
    text: "You sit down in the 48th room. The 49th. The 100th. You stop counting. The rooms stop changing. You become part of the loop. Another fixture. Another piece of furniture. Explorers who find this place wonder why there's always a figure sitting in the corner of every room, smiling. ENDING: THE FIXTURE",
    choices: [
      { label: 'Play again', next: 'start' },
    ],
  },
  break_window_end: {
    text: "You punch the window. It shatters. But behind it, there's only more wallpaper. And behind that wallpaper, more windows. Each showing a different life you could have lived. You tear through layer after layer. Window. Wallpaper. Window. Wallpaper. You never stop tearing. ENDING: THE PEELER",
    choices: [
      { label: 'Play again', next: 'start' },
    ],
  },
  party_end: {
    text: "You put on a party hat. You eat the yellow cake. You blow out the candles. The partygoers cheer. Their faces stretch into impossible smiles. You start smiling too. You can't stop smiling. You will never stop smiling. The party never ends. =) ENDING: THE PARTYGOER",
    choices: [
      { label: 'Play again', next: 'start' },
    ],
  },
  help_end: {
    text: "The screen flickers. 'THERE IS NO HELP.' Then: 'THERE WAS NEVER ANY HELP.' The computer shuts off. The room goes dark. The desk dissolves. You're standing in nothing. Complete void. Not black. Not white. Just... nothing. You exist here now. Nowhere. Forever. ENDING: THE VOID",
    choices: [
      { label: 'Play again', next: 'start' },
    ],
  },
  drown_end: {
    text: "The water rises. Warm. Yellow. It smells like old carpet and forgotten memories. You float for a while. Then you sink. The last thing you see is the fluorescent lights through the surface of the water, still buzzing. ENDING: THE SUBMERGED",
    choices: [
      { label: 'Play again', next: 'start' },
    ],
  },
  caught_end: {
    text: "The footsteps stop. Right behind you. You don't turn around. You already know. The last sound is the buzzing of the fluorescent lights, which somehow sounds like laughter. ENDING: THE CAUGHT",
    choices: [
      { label: 'Play again', next: 'start' },
    ],
  },
};

function TheThreshold({ onBack }: { onBack: () => void }) {
  const [currentNode, setCurrentNode] = useState('start');
  const node = STORY[currentNode];

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onBack}>Back to Store</button>
        <span className={styles.gameTitle}>The Threshold</span>
      </div>
      <div className={styles.thresholdContent}>
        <div className={styles.storyText}>{node.text}</div>
        <div className={styles.choiceList}>
          {node.choices.map((choice, i) => (
            <button
              key={i}
              className={styles.choiceBtn}
              onClick={() => setCurrentNode(choice.next)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN BACKSTORE ====================
export default function BackStore({ windowId: _windowId }: Props) {
  const { state } = useAppContext();
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState<string | null>(null);

  const handleInstall = (id: string) => {
    setInstalled((prev) => new Set(prev).add(id));
  };

  if (!state.isOnline) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>BackStore&trade;</div>
        </div>
        <div className={styles.offlinePage}>
          <div className={styles.offlineIcon}>X</div>
          <div className={styles.offlineTitle}>BackStore&trade; requires BackNET connection</div>
          <div className={styles.offlineMsg}>
            Please connect to BackNET to browse and install games.
          </div>
        </div>
      </div>
    );
  }

  if (playing === 'hallway-runner') return <HallwayRunner onBack={() => setPlaying(null)} />;
  if (playing === 'entity-escape') return <EntityEscape onBack={() => setPlaying(null)} />;
  if (playing === 'level-explorer') return <LevelExplorer3D onBack={() => setPlaying(null)} />;
  if (playing === 'threshold') return <TheThreshold onBack={() => setPlaying(null)} />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>BackStore&trade;</div>
        <div className={styles.headerSubtitle}>Digital Distribution for the Backrooms</div>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          {games.map((game) => (
            <div key={game.id} className={styles.card}>
              <div className={styles.cardImage} style={{ background: game.gradient }}>
                {game.id === 'hallway-runner' && '\u{1F3C3}'}
                {game.id === 'entity-escape' && '\u{1F440}'}
                {game.id === 'level-explorer' && '\u{1F5FA}'}
                {game.id === 'threshold' && '\u{1F6AA}'}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{game.title}</div>
                <div className={styles.cardGenre}>{game.genre}</div>
                <div className={styles.cardDesc}>{game.description}</div>
                <div className={styles.cardFooter}>
                  <div className={styles.stars}>{'\u2605'.repeat(5)}</div>
                  {installed.has(game.id) ? (
                    <div className={styles.installedBtns}>
                      <button
                        className={styles.playBtn}
                        onClick={() => setPlaying(game.id)}
                      >
                        Play
                      </button>
                      <span className={styles.installedLabel}>Installed {'\u2713'}</span>
                    </div>
                  ) : (
                    <button className={styles.installBtn} onClick={() => handleInstall(game.id)}>
                      Install
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
