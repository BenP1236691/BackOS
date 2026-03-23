import { useState } from 'react';
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

export default function BackStore({ windowId: _windowId }: Props) {
  const { state } = useAppContext();
  const [installed, setInstalled] = useState<Set<string>>(new Set());

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
                    <button className={styles.installedBtn}>
                      Installed {'\u2713'}
                    </button>
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
