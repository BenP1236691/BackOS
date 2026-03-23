import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './TheBackRoom.module.css';

interface Props {
  windowId: string;
}

interface Reply {
  id: string;
  body: string;
  author: string;
  timestamp: number;
}

interface Thread {
  id: string;
  title: string;
  body: string;
  author: string;
  category: string;
  timestamp: number;
  replies: Reply[];
}

const CATEGORIES = [
  { name: 'General Discussion', icon: '\u{1F4AC}', desc: 'General chatter among wanderers' },
  { name: 'Level Reports', icon: '\u{1F5FA}', desc: 'Document your findings from explored levels' },
  { name: 'Entity Sightings', icon: '\u{1F441}', desc: 'Report and discuss entity encounters' },
  { name: 'Technical Help', icon: '\u{1F527}', desc: 'BackOS and BackNET technical support' },
  { name: 'Trading Post', icon: '\u{1F4E6}', desc: 'Trade supplies, almond water, and information' },
];

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type View = 'categories' | 'threads' | 'thread';

export default function TheBackRoom({ windowId: _windowId }: Props) {
  const { state } = useAppContext();
  const [view, setView] = useState<View>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0].name);
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const token = state.user?.token;
  const username = state.user?.username || 'Anonymous';

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forum');
      if (!res.ok) throw new Error('Failed to fetch threads');
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (state.isOnline) fetchThreads();
  }, [state.isOnline, fetchThreads]);

  const fetchThread = async (id: string) => {
    try {
      const res = await fetch(`/api/forum/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setSelectedThread(data.thread);
    } catch {
      // silent
    }
  };

  const handleOpenCategory = (cat: string) => {
    setSelectedCategory(cat);
    setView('threads');
  };

  const handleOpenThread = (thread: Thread) => {
    setSelectedThread(thread);
    setView('thread');
    fetchThread(thread.id);
  };

  const handleBack = () => {
    if (view === 'thread') {
      setView('threads');
      setSelectedThread(null);
    } else if (view === 'threads') {
      setView('categories');
      setSelectedCategory(null);
    }
  };

  const handleCreateThread = async () => {
    if (!token || !formTitle.trim() || !formBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formTitle.trim(),
          body: formBody.trim(),
          author: username,
          category: formCategory,
        }),
      });
      if (!res.ok) throw new Error('Failed to create thread');
      setShowForm(false);
      setFormTitle('');
      setFormBody('');
      fetchThreads();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!token || !selectedThread || !replyText.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/forum/${selectedThread.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          body: replyText.trim(),
          author: username,
        }),
      });
      if (!res.ok) throw new Error('Failed to reply');
      setReplyText('');
      await fetchThread(selectedThread.id);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setReplySubmitting(false);
    }
  };

  const categoryThreads = selectedCategory
    ? threads.filter((t) => t.category === selectedCategory)
    : [];

  const totalReplies = threads.reduce((sum, t) => sum + t.replies.length, 0);

  if (!state.isOnline) {
    return (
      <div className={styles.container}>
        <div className={styles.banner}>
          <div className={styles.bannerTitle}>The BackRoom&#8482; Forum</div>
        </div>
        <div className={styles.offlineContainer}>
          <div className={styles.offlineTitle}>Forum Offline</div>
          <div>The forum servers are unreachable. The hallways stretch endlessly between you and connectivity.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.banner}>
        <div className={styles.bannerTitle}>The BackRoom&#8482; Forum</div>
        <div className={styles.bannerSub}>Where wanderers gather to share knowledge. Est. Unknown.</div>
      </div>

      <div className={styles.breadcrumb}>
        <button className={styles.breadcrumbLink} onClick={() => { setView('categories'); setSelectedCategory(null); setSelectedThread(null); }}>
          Home
        </button>
        {selectedCategory && (
          <>
            <span className={styles.breadcrumbSep}>&gt;</span>
            <button
              className={view === 'threads' ? styles.breadcrumbCurrent : styles.breadcrumbLink}
              onClick={() => { setView('threads'); setSelectedThread(null); }}
            >
              {selectedCategory}
            </button>
          </>
        )}
        {selectedThread && (
          <>
            <span className={styles.breadcrumbSep}>&gt;</span>
            <span className={styles.breadcrumbCurrent}>{selectedThread.title}</span>
          </>
        )}
      </div>

      {view !== 'categories' && (
        <div className={styles.toolbar}>
          <button className={styles.newThreadBtn} onClick={handleBack}>
            &larr; Back
          </button>
          {view === 'threads' && token && (
            <button className={styles.newThreadBtn} onClick={() => { setFormCategory(selectedCategory || CATEGORIES[0].name); setShowForm(true); }}>
              New Thread
            </button>
          )}
        </div>
      )}

      {view === 'categories' && (
        <div className={styles.content}>
          {loading && <div className={styles.loading}>Loading forum data...</div>}
          {error && <div className={styles.error}>Error: {error}</div>}
          <table className={styles.categoryTable}>
            <thead>
              <tr className={styles.categoryTableHeader}>
                <th style={{ width: 36 }}></th>
                <th>Forum</th>
                <th style={{ width: 60, textAlign: 'center' }}>Threads</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => {
                const count = threads.filter((t) => t.category === cat.name).length;
                return (
                  <tr
                    key={cat.name}
                    className={styles.categoryRow}
                    onClick={() => handleOpenCategory(cat.name)}
                  >
                    <td className={styles.categoryIcon}>{cat.icon}</td>
                    <td>
                      <div className={styles.categoryName}>{cat.name}</div>
                      <div className={styles.categoryDesc}>{cat.desc}</div>
                    </td>
                    <td className={styles.categoryCount}>{count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'threads' && (
        <div className={styles.content}>
          {categoryThreads.length === 0 ? (
            <div className={styles.empty}>No threads in this category. The silence is deafening.</div>
          ) : (
            <table className={styles.threadTable}>
              <thead>
                <tr className={styles.threadTableHeader}>
                  <th>Thread</th>
                  <th style={{ width: 100 }}>Author</th>
                  <th style={{ width: 60, textAlign: 'center' }}>Replies</th>
                  <th style={{ width: 100 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {categoryThreads.map((thread) => (
                  <tr
                    key={thread.id}
                    className={styles.threadRow}
                    onClick={() => handleOpenThread(thread)}
                  >
                    <td className={styles.threadTitle}>{thread.title}</td>
                    <td className={styles.threadAuthor}>{thread.author}</td>
                    <td className={styles.threadReplies}>{thread.replies.length}</td>
                    <td className={styles.threadDate}>{formatDate(thread.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {view === 'thread' && selectedThread && (
        <div className={styles.detailView}>
          <div className={styles.opPost}>
            <div className={styles.opHeader}>
              <span className={styles.opTitle}>{selectedThread.title}</span>
              <span className={styles.opMeta}>
                by {selectedThread.author} | {formatDate(selectedThread.timestamp)}
              </span>
            </div>
            <div className={styles.opBody}>{selectedThread.body}</div>
          </div>

          {selectedThread.replies.map((r) => (
            <div key={r.id} className={styles.replyPost}>
              <div className={styles.replyHeader}>
                <span className={styles.replyAuthor}>{r.author}</span>
                <span className={styles.replyTime}>{formatDate(r.timestamp)}</span>
              </div>
              <div className={styles.replyBody}>{r.body}</div>
            </div>
          ))}

          {token && (
            <div className={styles.replyForm}>
              <div className={styles.replyFormLabel}>Post a Reply</div>
              <textarea
                className={styles.replyInput}
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button
                className={styles.replyBtn}
                onClick={handleReply}
                disabled={replySubmitting || !replyText.trim()}
              >
                {replySubmitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className={styles.formOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.formWindow} onClick={(e) => e.stopPropagation()}>
            <div className={styles.formTitleBar}>
              <span>New Thread</span>
              <button className={styles.formCloseBtn} onClick={() => setShowForm(false)}>X</button>
            </div>
            <div className={styles.formBody}>
              <div className={styles.formField}>
                <span className={styles.formLabel}>Category:</span>
                <select
                  className={styles.formSelect}
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <span className={styles.formLabel}>Title:</span>
                <input
                  className={styles.formInput}
                  placeholder="Thread title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <textarea
                className={styles.formTextarea}
                placeholder="Write your post..."
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
              />
              <button
                className={styles.formSubmitBtn}
                onClick={handleCreateThread}
                disabled={submitting || !formTitle.trim() || !formBody.trim()}
              >
                {submitting ? 'Creating...' : 'Create Thread'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.forumStats}>
        {threads.length} threads, {totalReplies} replies | The BackRoom&#8482; Forum v2.1.4
      </div>

      <div className={styles.statusBar}>
        <span>Connected to The BackRoom&#8482; Forum</span>
        <span>Logged in as: {username}</span>
      </div>
    </div>
  );
}
