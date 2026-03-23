import { useState } from 'react';
import styles from './BackOffice.module.css';
import WordTab from './WordTab';
import SheetTab from './SheetTab';
import PointTab from './PointTab';

interface Props {
  windowId: string;
}

type TabId = 'word' | 'sheet' | 'point';

const tabs: { id: TabId; label: string }[] = [
  { id: 'word', label: 'Word\u2122' },
  { id: 'sheet', label: 'Sheet\u2122' },
  { id: 'point', label: 'Point\u2122' },
];

export default function BackOffice({ windowId: _windowId }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('word');

  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'word' && <WordTab />}
      {activeTab === 'sheet' && <SheetTab />}
      {activeTab === 'point' && <PointTab />}
    </div>
  );
}
