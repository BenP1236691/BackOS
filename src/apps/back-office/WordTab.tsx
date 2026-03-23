import { useState } from 'react';
import styles from './BackOffice.module.css';

const DEFAULT_TEXT = `JOURNAL OF AN UNKNOWN WANDERER
==============================
Date: Day ???

I don't know how many days it's been. The fluorescent lights never change — always that same sickly yellow glow. I've been walking through these rooms for what feels like weeks, but my watch stopped the moment I arrived.

The carpet is always damp. I've stopped wondering why. Some questions are better left unanswered in this place.

Today I found a room that was different. The wallpaper was peeling, and behind it... there was another layer of wallpaper. And behind that, another. I pulled seven layers before I stopped. Each one had the same pattern, but slightly wrong. Like someone was trying to copy something from memory and failing each time.

I heard humming today. Not the fluorescent lights — something else. Something that sounded almost like a voice. It was singing a song I recognized but couldn't name. When I tried to follow it, it moved away. Always just around the next corner.

I found a note on the floor. It was in my handwriting. It said "DO NOT TRUST THE TERMINAL." I don't remember writing it.

I'm writing this on the terminal anyway.

What choice do I have?

The walls are the same shade of yellow as my childhood bedroom. I'm sure that's a coincidence. I'm sure of it.

I need to keep moving. Staying still feels dangerous. The hum gets louder when I stop.

If you're reading this, I'm sorry. It means you're here too.

Don't look behind you.`;

export default function WordTab() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [fontSize, setFontSize] = useState('13');

  return (
    <div className={styles.tabContent}>
      <div className={styles.wordToolbar}>
        <button
          className={`${styles.wordToolbarBtn} ${bold ? styles.wordToolbarBtnActive : ''}`}
          onClick={() => setBold(!bold)}
          title="Bold"
        >
          <b>B</b>
        </button>
        <button
          className={`${styles.wordToolbarBtn} ${italic ? styles.wordToolbarBtnActive : ''}`}
          onClick={() => setItalic(!italic)}
          title="Italic"
        >
          <i>I</i>
        </button>
        <button
          className={`${styles.wordToolbarBtn} ${underline ? styles.wordToolbarBtnActive : ''}`}
          onClick={() => setUnderline(!underline)}
          title="Underline"
        >
          <u>U</u>
        </button>
        <select
          className={styles.fontSizeSelect}
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
        >
          {['8', '10', '12', '13', '14', '16', '18', '20', '24', '28', '36'].map((s) => (
            <option key={s} value={s}>{s}pt</option>
          ))}
        </select>
      </div>
      <textarea
        className={styles.wordEditor}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          fontWeight: bold ? 'bold' : 'normal',
          fontStyle: italic ? 'italic' : 'normal',
          textDecoration: underline ? 'underline' : 'none',
          fontSize: `${fontSize}px`,
        }}
        spellCheck={false}
      />
    </div>
  );
}
