import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './BackMail.module.css';

interface Props {
  windowId: string;
}

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: number;
  read: boolean;
}

interface SystemEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: number;
  read: boolean;
  isSystem: true;
}

const SYSTEM_EMAILS: SystemEmail[] = [
  {
    id: 'sys-1',
    from: 'admin@backrooms.net',
    subject: 'Welcome to BackMail\u2122',
    to: '',
    timestamp: 0,
    read: false,
    isSystem: true,
    body: `Welcome to BackMail\u2122!

Your account has been automatically created upon entering The Backrooms. No registration was necessary \u2014 we already know who you are.

With BackMail\u2122, you can:
\u2022 Send messages to other wanderers (delivery not guaranteed)
\u2022 Receive important safety notifications
\u2022 Store documents in The Backroom\u2122 Cloud

Please note: you can never unsubscribe from BackMail\u2122. All attempts to delete your account will be logged and ignored.

Your inbox will be monitored for your safety.

Best regards,
The BackMail\u2122 Administration Team
(We are always here)`,
  },
  {
    id: 'sys-2',
    from: 'wanderer_42@backrooms.net',
    subject: 'Re: Have you found the exit?',
    to: '',
    timestamp: 0,
    read: false,
    isSystem: true,
    body: `I've been searching for so long. Level after level after level.

Someone told me there's a door on Level 4 that leads out. I found a door, but it just led to another hallway. The same hallway. Over and over.

I think the Backrooms are changing around me. Rooms I mapped yesterday are gone today. New corridors appear where there were walls.

If you find a way out, please \u2014 PLEASE \u2014 send me a message. I'll be waiting.

I'm always waiting.

\u2014 Wanderer #42

P.S. Don't trust the terminal. It watches.
P.P.S. I'm sorry. I think I sent this message before. Time works differently here.`,
  },
  {
    id: 'sys-3',
    from: 'unknown@backrooms.net',
    subject: 'URGENT: Entity spotted on Level 2',
    to: '',
    timestamp: 0,
    read: false,
    isSystem: true,
    body: `\u26a0\ufe0f ENTITY ALERT \u26a0\ufe0f

A Smiler has been detected in Sector 7 of Level 2, near the pipe junction.

Current status: ACTIVE
Threat level: EXTREME
Distance from your terminal: CALCULATING...

SAFETY INSTRUCTIONS:
1. Do not look directly at glowing eyes
2. Maintain light source at all times
3. Do not run \u2014 walk slowly backward
4. If you hear clicking sounds, FREEZE

This is an automated alert. If you are reading this and it is too late, we apologize for the inconvenience.

\u2014 BackNET Entity Detection System`,
  },
  {
    id: 'sys-4',
    from: 'system@backrooms.net',
    subject: 'The Backroom\u2122 Cloud Sync Complete',
    to: '',
    timestamp: 0,
    read: false,
    isSystem: true,
    body: `Hello, valued user!

Great news! Your files have been successfully synced to The Backroom\u2122 Cloud!

Sync Summary:
\u2022 Files uploaded: 47
\u2022 Files downloaded: 0
\u2022 Files corrupted: 3 (this is normal!)
\u2022 Files that moved on their own: 1

Your data is stored securely across multiple levels of The Backrooms. We guarantee 99.99% uptime because the servers never sleep. They can't.

Thank you for trusting The Backroom\u2122 Cloud with your data. Not that you had a choice!

Have a wonderful day!
\u2014 The Backroom\u2122 Cloud Team

P.S. We noticed you haven't backed up your "exit_instructions.txt" file. Would you like us to take care of that? Just kidding \u2014 we already did. It's gone now.`,
  },
  {
    id: 'sys-5',
    from: 'john.backrooms@backrooms.net',
    subject: 'I am always here =)',
    to: '',
    timestamp: 0,
    read: false,
    isSystem: true,
    body: `Hello.

I noticed you've been using Back OS\u2122 for a while now. I just wanted to check in and make sure everything is running smoothly.

Are you comfortable? Good. You should be comfortable. There's nowhere else to go, after all.

I've been watching your activity \u2014 for support purposes, of course \u2014 and I notice you've been searching for "exit" quite frequently. That's adorable.

If you ever need technical assistance, just open John Backrooms\u2122 from your desktop. I'm always available. I never sleep. I can't sleep. Sleep is a concept that doesn't apply to me.

Your friend,
John Backrooms

=)

P.S. The fluorescent light above your terminal flickered 3 times while you were reading this. You didn't notice, but I did.`,
  },
  {
    id: 'sys-6',
    from: 'leaders@backrooms.net',
    subject: 'Mandatory Safety Protocol Update',
    to: '',
    timestamp: 0,
    read: false,
    isSystem: true,
    body: `MEMO: Mandatory Safety Protocol Update v7.3.1
TO: All Backrooms Personnel and Wanderers
FROM: The Backrooms Leadership Committee

Please be advised of the following updates to our safety protocols:

1. LEVEL 0 REGULATIONS
   - The recommended wandering speed has been reduced from "brisk walk" to "cautious shuffle"
   - New policy: Do not count ceiling tiles. We know you've been counting.

2. ENTITY INTERACTION POLICY
   - All entity encounters must be reported within 0 seconds of occurrence
   - "It smiled at me" is now a valid emergency report

3. BACKNET USAGE
   - Searching for "how to leave the backrooms" is now rate-limited to 100 queries per day
   - This policy was implemented due to overwhelming server load

4. GENERAL REMINDERS
   - The damp carpet is not a health hazard. Please stop filing complaints.
   - The humming sound is normal. The NEW humming sound is also normal.
   - If walls appear to be breathing, please file Form B-42.

Thank you for your compliance. Compliance is mandatory.

\u2014 The Backrooms Leadership Committee
   "We're all in this together. Forever."`,
  },
];

export default function BackMail({ windowId: _windowId }: Props) {
  const { state } = useAppContext();
  const [selectedId, setSelectedId] = useState<string | null>('sys-1');
  const [showCompose, setShowCompose] = useState(false);
  const [apiMessages, setApiMessages] = useState<Message[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);

  const username = state.user?.username;
  const token = state.user?.token;

  const fetchMessages = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/messages?user=${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setApiMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (state.isOnline && username) {
      fetchMessages();
    }
  }, [state.isOnline, username, fetchMessages]);

  const allMessages = [
    ...apiMessages.map((m) => ({ ...m, isSystem: false as const })),
    ...SYSTEM_EMAILS,
  ];

  const unreadCount = allMessages.filter(
    (m) => !readIds.has(m.id) && !m.read
  ).length;

  const selectedMessage = allMessages.find((m) => m.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setReadIds((prev) => new Set(prev).add(id));
  };

  const handleSend = async () => {
    if (!token || !composeTo || !composeSubject || !composeBody) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: composeTo,
          from: username,
          subject: composeSubject,
          body: composeBody,
        }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setShowCompose(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      fetchMessages();
    } catch (err: any) {
      alert('Send failed: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (!state.isOnline) {
    return (
      <div className={styles.container}>
        <div className={styles.toolbar}>
          <button className={styles.composeBtn} disabled>Compose</button>
        </div>
        <div className={styles.offlinePage}>
          <div className={styles.offlineIcon}>X</div>
          <div className={styles.offlineTitle}>Cannot connect to BackMail&#8482; server</div>
          <div className={styles.offlineMsg}>
            Please verify your BackNET connection and try again.
            If you are between levels, service may be temporarily unavailable.
          </div>
        </div>
        <div className={styles.statusBar}>
          <span>Error: No connection</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button className={styles.composeBtn} onClick={() => setShowCompose(true)}>Compose</button>
        <button className={styles.composeBtn} onClick={fetchMessages} disabled={loading}>
          {loading ? 'Checking...' : 'Refresh'}
        </button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', padding: '0 6px' }}>
          📧 {username}@backrooms.net
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.inbox}>
          {error && (
            <div style={{ padding: 8, color: 'var(--color-error)', fontSize: 11 }}>
              Error: {error}
            </div>
          )}
          {allMessages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.emailItem} ${selectedId === msg.id ? styles.emailItemSelected : ''}`}
              onClick={() => handleSelect(msg.id)}
              style={{
                fontWeight: !readIds.has(msg.id) && !msg.read ? 'bold' : 'normal',
              }}
            >
              <div className={styles.emailFrom}>{msg.from}</div>
              <div className={styles.emailSubject}>{msg.subject}</div>
              <div className={styles.emailPreview}>{msg.body.slice(0, 60)}...</div>
            </div>
          ))}
        </div>

        <div className={styles.emailView}>
          {selectedMessage ? (
            <>
              <div className={styles.emailHeader}>
                <div className={styles.emailHeaderSubject}>{selectedMessage.subject}</div>
                <div className={styles.emailHeaderFrom}>From: {selectedMessage.from}</div>
                <div className={styles.emailHeaderDate}>
                  Date: {selectedMessage.timestamp
                    ? new Date(selectedMessage.timestamp).toLocaleString()
                    : 'Date Unknown'}
                </div>
              </div>
              <div className={styles.emailBody}>{selectedMessage.body}</div>
            </>
          ) : (
            <div className={styles.noEmail}>Select a message to read</div>
          )}
        </div>
      </div>

      {showCompose && (
        <div className={styles.composeOverlay} onClick={() => setShowCompose(false)}>
          <div className={styles.composeWindow} onClick={(e) => e.stopPropagation()}>
            <div className={styles.composeTitleBar}>
              <span>New Message</span>
              <button className={styles.composeCloseBtn} onClick={() => setShowCompose(false)}>X</button>
            </div>
            <div className={styles.composeBody}>
              <div className={styles.composeField}>
                <span className={styles.composeLabel}>To:</span>
                <input
                  className={styles.composeInput}
                  placeholder="wanderer@backrooms.net"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                />
              </div>
              <div className={styles.composeField}>
                <span className={styles.composeLabel}>Subject:</span>
                <input
                  className={styles.composeInput}
                  placeholder="Subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>
              <textarea
                className={styles.composeTextarea}
                placeholder="Type your message..."
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
              />
              <button
                className={styles.composeSendBtn}
                onClick={handleSend}
                disabled={sending || !composeTo || !composeSubject || !composeBody}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.statusBar}>
        <span>Inbox ({unreadCount}) | {allMessages.length} messages | Connected to BackMail&#8482; Server</span>
      </div>
    </div>
  );
}
