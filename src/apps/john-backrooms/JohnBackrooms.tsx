import { useState, useRef, useEffect, type FormEvent } from 'react';
import styles from './JohnBackrooms.module.css';
import { getRandomResponse } from './responses';

interface Props {
  windowId: string;
}

interface Message {
  id: number;
  sender: 'john' | 'user';
  text: string;
}

let nextId = 1;

export default function JohnBackrooms({ windowId: _windowId }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId++,
      sender: 'john',
      text: 'Welcome to John Backrooms\u2122 Technical Support. How may I assist you today? =)',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { id: nextId++, sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      const response = getRandomResponse();
      const johnMsg: Message = { id: nextId++, sender: 'john', text: response };
      setMessages((prev) => [...prev, johnMsg]);
      setIsTyping(false);
    }, delay);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>{'\uD83E\uDD16'}</span>
        <span>John Backrooms&trade; &mdash; Technical Support Assistant</span>
      </div>

      <div className={styles.chatArea}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageBubble} ${msg.sender === 'john' ? styles.messageJohn : styles.messageUser}`}
          >
            {msg.sender === 'john' && (
              <div className={styles.messageAvatar}>{'\uD83E\uDD16'}</div>
            )}
            <div className={styles.messageText}>{msg.text}</div>
          </div>
        ))}
        {isTyping && (
          <div className={styles.typingIndicator}>
            <div className={styles.messageAvatar}>{'\uD83E\uDD16'}</div>
            John is typing<span className={styles.dots}></span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form className={styles.inputArea} onSubmit={handleSend}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isTyping}
        />
        <button type="submit" className={styles.sendBtn} disabled={isTyping}>
          Send
        </button>
      </form>
    </div>
  );
}
