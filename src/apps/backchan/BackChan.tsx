import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './BackChan.module.css';

interface Props {
  windowId: string;
}

interface Reply {
  id: string;
  body: string;
  author: string;
  timestamp: number;
}

interface Post {
  id: string;
  board: string;
  title: string;
  body: string;
  author: string;
  timestamp: number;
  replies: Reply[];
}

const BOARDS = [
  { id: 'random', slug: '/b/', name: 'Random' },
  { id: 'levels', slug: '/l/', name: 'Levels' },
  { id: 'entities', slug: '/e/', name: 'Entities' },
  { id: 'survival', slug: '/s/', name: 'Survival' },
  { id: 'general', slug: '/g/', name: 'General' },
];

function formatDate(ts: number): string {
  const d = new Date(ts);
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  const yr = String(d.getFullYear()).slice(2);
  const hr = String(d.getHours()).padStart(2, '0');
  const mn = String(d.getMinutes()).padStart(2, '0');
  const sc = String(d.getSeconds()).padStart(2, '0');
  return `${mo}/${dy}/${yr}(???) ${hr}:${mn}:${sc}`;
}

function renderBody(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('>')) {
      return (
        <div key={i} className={styles.greenText}>{line}</div>
      );
    }
    return <div key={i}>{line || '\u00A0'}</div>;
  });
}

export default function BackChan({ windowId: _windowId }: Props) {
  const { state } = useAppContext();
  const [board, setBoard] = useState('random');
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const token = state.user?.token;
  const username = state.user?.username;
  const displayName = username || 'Anonymous';

  const currentBoard = BOARDS.find((b) => b.id === board) || BOARDS[0];

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts?board=${encodeURIComponent(board)}`);
      if (!res.ok) throw new Error('Failed to fetch threads');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [board]);

  useEffect(() => {
    if (state.isOnline) fetchPosts();
  }, [state.isOnline, board, fetchPosts]);

  const fetchPost = async (id: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setSelectedPost(data.post);
    } catch {
      // silent
    }
  };

  const handleCreateThread = async () => {
    if (!token || !formTitle.trim() || !formBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          board,
          title: formTitle.trim(),
          body: formBody.trim(),
          author: displayName,
        }),
      });
      if (!res.ok) throw new Error('Failed to create thread');
      setShowForm(false);
      setFormTitle('');
      setFormBody('');
      fetchPosts();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!token || !selectedPost || !replyText.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/posts/${selectedPost.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          body: replyText.trim(),
          author: displayName,
        }),
      });
      if (!res.ok) throw new Error('Failed to reply');
      setReplyText('');
      await fetchPost(selectedPost.id);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setReplySubmitting(false);
    }
  };

  if (!state.isOnline) {
    return (
      <div className={styles.container}>
        <div className={styles.boardBar}>
          <span className={styles.boardBarLabel}>BackChan</span>
        </div>
        <div className={styles.offlineContainer}>
          <div className={styles.offlineTitle}>Connection Error</div>
          <div>The servers are unreachable. Perhaps they have moved to another level.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.boardBar}>
        <span className={styles.boardBarLabel}>BackChan</span>
        {BOARDS.map((b) => (
          <button
            key={b.id}
            className={`${styles.boardLink} ${board === b.id ? styles.boardLinkActive : ''}`}
            onClick={() => { setBoard(b.id); setSelectedPost(null); }}
          >
            {b.slug}
          </button>
        ))}
      </div>

      <div className={styles.header}>
        <div>
          <span className={styles.headerTitle}>{currentBoard.slug} - {currentBoard.name}</span>
          <div className={styles.headerSub}>BackChan Imageboard - The Backrooms Edition</div>
        </div>
        {token && !selectedPost && (
          <button className={styles.newThreadBtn} onClick={() => setShowForm(true)}>
            Start a Thread
          </button>
        )}
      </div>

      {selectedPost ? (
        <div className={styles.detailView}>
          <button className={styles.backBtn} onClick={() => setSelectedPost(null)}>
            &larr; Back to {currentBoard.slug}
          </button>

          <div className={styles.opPost}>
            <div className={styles.opTitle}>{selectedPost.title}</div>
            <div className={styles.opMeta}>
              <span className={styles.anonLabel}>{selectedPost.author || 'Anonymous'}</span>
              {' '}{formatDate(selectedPost.timestamp)}
              {' '}<span className={styles.postNumber}>No.{selectedPost.id}</span>
            </div>
            <div className={styles.opBody}>{renderBody(selectedPost.body)}</div>
          </div>

          {selectedPost.replies.map((r) => (
            <div key={r.id} className={styles.replyPost}>
              <div className={styles.replyHeader}>
                <span className={styles.replyAuthor}>{r.author || 'Anonymous'}</span>
                <span className={styles.replyTime}>{formatDate(r.timestamp)}</span>
                <span className={styles.replyId}>No.{r.id}</span>
              </div>
              <div className={styles.replyBody}>{renderBody(r.body)}</div>
            </div>
          ))}

          {token && (
            <div className={styles.replyForm}>
              <div className={styles.replyFormLabel}>Reply</div>
              <textarea
                className={styles.replyInput}
                placeholder="Type your reply... (lines starting with > will be green)"
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
      ) : (
        <div className={styles.content}>
          {loading && <div className={styles.loading}>Fetching threads from the void...</div>}
          {error && <div className={styles.error}>Error: {error}</div>}
          {!loading && !error && posts.length === 0 && (
            <div className={styles.empty}>No threads on {currentBoard.slug}. The board is empty. As it should be.</div>
          )}
          {posts.map((post) => (
            <div key={post.id} className={styles.thread}>
              <div
                className={styles.threadHeader}
                onClick={() => { setSelectedPost(post); fetchPost(post.id); }}
              >
                <div>
                  <span className={styles.threadTitle}>{post.title}</span>
                  <div className={styles.threadMeta}>
                    <span className={styles.anonLabel}>{post.author || 'Anonymous'}</span>
                    {' '}{formatDate(post.timestamp)}
                    {' '}<span className={styles.postNumber}>No.{post.id}</span>
                  </div>
                </div>
              </div>
              <div className={styles.threadBody}>
                {renderBody(post.body.slice(0, 200) + (post.body.length > 200 ? '...' : ''))}
              </div>
              <div className={styles.threadReplyCount}>
                {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className={styles.formOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.formWindow} onClick={(e) => e.stopPropagation()}>
            <div className={styles.formTitleBar}>
              <span>Start a Thread on {currentBoard.slug}</span>
              <button className={styles.formCloseBtn} onClick={() => setShowForm(false)}>X</button>
            </div>
            <div className={styles.formBody}>
              <input
                className={styles.formInput}
                placeholder="Subject"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
              <textarea
                className={styles.formTextarea}
                placeholder="Comment (lines starting with > will appear green)"
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
              />
              <button
                className={styles.formSubmitBtn}
                onClick={handleCreateThread}
                disabled={submitting || !formTitle.trim() || !formBody.trim()}
              >
                {submitting ? 'Posting...' : 'Post Thread'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.statusBar}>
        <span>{currentBoard.slug} | {posts.length} threads</span>
        <span>BackChan v1.0</span>
      </div>
    </div>
  );
}
