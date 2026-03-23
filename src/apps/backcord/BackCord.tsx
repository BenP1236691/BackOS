import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './BackCord.module.css';

interface Props {
  windowId: string;
}

interface ChatMessage {
  id: string;
  author: string;
  body: string;
  timestamp: number;
}

const CHANNELS = [
  { id: 'general', name: 'general' },
  { id: 'level-0', name: 'level-0' },
  { id: 'level-1', name: 'level-1' },
  { id: 'entity-alerts', name: 'entity-alerts' },
  { id: 'off-topic', name: 'off-topic' },
];

function renderMessageBody(body: string): React.ReactNode {
  const imageRegex = /\[IMAGE\](.*?)\[\/IMAGE\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = imageRegex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push(body.substring(lastIndex, match.index));
    }
    parts.push(
      <img
        key={match.index}
        src={match[1]}
        alt="Shared drawing"
        style={{ maxWidth: '100%', maxHeight: 200, display: 'block', marginTop: 4, border: '1px solid #3a3000' }}
      />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push(body.substring(lastIndex));
  }

  return parts.length > 0 ? parts : body;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function avatarColor(name: string): string {
  const colors = ['#5865f2', '#ed4245', '#57f287', '#fee75c', '#eb459e', '#f47b67'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Discord({ windowId: _windowId }: Props) {
  const { state } = useAppContext();
  const [channel, setChannel] = useState('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = state.user?.token;
  const username = state.user?.username || 'Anonymous';

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?channel=${encodeURIComponent(channel)}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      // silent fail for polling
    }
  }, [channel]);

  useEffect(() => {
    if (!state.isOnline) return;
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
  }, [state.isOnline, channel, fetchMessages]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!state.isOnline) return;
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [state.isOnline, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !token) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel,
          body: input.trim(),
          author: username,
        }),
      });
      if (res.ok) {
        setInput('');
        await fetchMessages();
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!state.isOnline) {
    return (
      <div className={styles.container}>
        <div className={styles.offlineContainer}>
          <div className={styles.offlineTitle}>Connection Lost</div>
          <div>Cannot reach the Discord servers. The connection fades between levels...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.serverHeader}>
          <div className={styles.serverIcon}>B</div>
          <span>The Backrooms</span>
        </div>
        <div className={styles.channelList}>
          <div className={styles.channelLabel}>Text Channels</div>
          {CHANNELS.map((ch) => (
            <div
              key={ch.id}
              className={`${styles.channelItem} ${channel === ch.id ? styles.channelItemActive : ''}`}
              onClick={() => setChannel(ch.id)}
            >
              <span className={styles.channelHash}>#</span>
              {ch.name}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.mainArea}>
        <div className={styles.channelHeader}>
          <span>#</span>
          <span>{channel}</span>
        </div>

        <div className={styles.messages}>
          {loading && <div className={styles.loadingText}>Loading messages...</div>}
          {!loading && messages.length === 0 && (
            <div className={styles.emptyMessages}>
              <div>No messages yet in #{channel}</div>
              <div style={{ fontSize: 11 }}>Be the first to speak into the void...</div>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={styles.message}>
              <div className={styles.messageAvatar} style={{ background: avatarColor(msg.author) }}>
                {msg.author.charAt(0).toUpperCase()}
              </div>
              <div className={styles.messageContent}>
                <div className={styles.messageHeader}>
                  <span className={styles.messageAuthor}>{msg.author}</span>
                  <span className={styles.messageTime}>{formatTime(msg.timestamp)}</span>
                </div>
                <div className={styles.messageBody}>{renderMessageBody(msg.body)}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <input
              className={styles.input}
              placeholder={token ? `Message #${channel}` : 'Log in to send messages...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!token}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={sending || !input.trim() || !token}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className={styles.userPanel}>
        <div className={styles.userPanelLabel}>Online - 1</div>
        <div className={styles.currentUser}>
          <div className={styles.userDot} />
          <span className={styles.userName}>{username}</span>
        </div>
      </div>
    </div>
  );
}
