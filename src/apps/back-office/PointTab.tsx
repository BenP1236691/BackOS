import { useState } from 'react';
import styles from './BackOffice.module.css';

interface Slide {
  title: string;
  content: string;
}

const slides: Slide[] = [
  {
    title: 'Welcome to Back OS\u2122',
    content:
      'The only operating system designed for\nThe Backrooms.\n\nFeatures:\n\u2022 Entity Detection & Monitoring\n\u2022 BackNET Connectivity\n\u2022 Level Navigation Tools\n\u2022 Automatic Sanity Tracking\n\nVersion 95.backrooms\n\nYou didn\'t choose Back OS.\nBack OS chose you.',
  },
  {
    title: 'BackNET Safety Protocol',
    content:
      'MANDATORY SAFETY GUIDELINES:\n\n1. Never share your level location online\n2. Do not download files from unknown entities\n3. BackMail messages from "unknown@backrooms.net"\n   should be reported immediately\n4. The BackNET is monitored for your protection\n5. VPN usage is futile \u2014 all traffic is routed\n   through The Backroom\u2122 Cloud\n\nRemember: We are always watching.\nFor your safety.',
  },
  {
    title: 'Entity Avoidance Guide',
    content:
      'CRITICAL SURVIVAL INFORMATION:\n\n\u2022 Smilers: Avoid dark areas. Do not make\n  eye contact. Do not smile back.\n\n\u2022 Hounds: Remain silent. Do not run.\n  They hunt by sound.\n\n\u2022 Skin-Stealers: Verify identity of anyone\n  you meet. Trust no one.\n\nGeneral Rules:\n\u2022 Stay in lit areas\n\u2022 Keep moving\n\u2022 Document everything\n\u2022 Do not count the rooms\n\nSurvival is not guaranteed.\nBut we appreciate your optimism.',
  },
];

export default function PointTab() {
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <div className={styles.pointContainer}>
      <div className={styles.slideView}>
        <div className={styles.slide}>
          <div className={styles.slideTitle}>{slides[currentSlide].title}</div>
          <div className={styles.slideContent} style={{ whiteSpace: 'pre-line' }}>
            {slides[currentSlide].content}
          </div>
        </div>
      </div>
      <div className={styles.slideNav}>
        <button
          className={styles.slideNavBtn}
          disabled={currentSlide === 0}
          onClick={() => setCurrentSlide((s) => s - 1)}
        >
          {'< Prev'}
        </button>
        <span className={styles.slideCounter}>
          Slide {currentSlide + 1} of {slides.length}
        </span>
        <button
          className={styles.slideNavBtn}
          disabled={currentSlide === slides.length - 1}
          onClick={() => setCurrentSlide((s) => s + 1)}
        >
          {'Next >'}
        </button>
      </div>
    </div>
  );
}
