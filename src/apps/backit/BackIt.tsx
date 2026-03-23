import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './BackIt.module.css';

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
  { id: 'general', name: 'General' },
  { id: 'levels', name: 'Levels' },
  { id: 'entities', name: 'Entities' },
  { id: 'survival', name: 'Survival' },
  { id: 'random', name: 'Random' },
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function BackIt({ windowId: _windowId }: Props) {
  const { state } = useAppContext();
  const [board, setBoard] = useState('general');
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
  const username = state.user?.username || 'anonymous';

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts?board=${encodeURIComponent(board)}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
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
      if (!res.ok) throw new Error('Post not found');
      const data = await res.json();
      setSelectedPost(data.post);
    } catch {
      // fallback to cached
    }
  };

  const handleCreatePost = async () => {
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
          author: username,
        }),
      });
      if (!res.ok) throw new Error('Failed to create post');
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
          author: username,
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
        <div className={styles.header}>
          <span className={styles.headerTitle}>BackIt&#8482;</span>
        </div>
        <div className={styles.offlineContainer}>
          <div className={styles.offlineTitle}>Cannot reach BackIt servers</div>
          <div>The connection between levels is unstable. Try again later.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <span className={styles.headerTitle}>BackIt&#8482;</span>
          <span className={styles.headerSub}> &mdash; The front page of the Backrooms</span>
        </div>
      </div>

      <div className={styles.tabs}>
        {BOARDS.map((b) => (
          <button
            key={b.id}
            className={`${styles.tab} ${board === b.id ? styles.tabActive : ''}`}
            onClick={() => { setBoard(b.id); setSelectedPost(null); }}
          >
            {b.name}
          </button>
        ))}
      </div>

      {selectedPost ? (
        <div className={styles.detailView}>
          <button className={styles.backBtn} onClick={() => setSelectedPost(null)}>
            &larr; Back to /{board}
          </button>
          <div className={styles.detailCard}>
            <div className={styles.detailTitle}>{selectedPost.title}</div>
            <div className={styles.detailMeta}>
              Posted by {selectedPost.author} | {timeAgo(selectedPost.timestamp)}
            </div>
            <div className={styles.detailBody}>{selectedPost.body}</div>
          </div>

          <div className={styles.repliesSection}>
            <div className={styles.repliesHeader}>
              {selectedPost.replies.length} {selectedPost.replies.length === 1 ? 'reply' : 'replies'}
            </div>
            {selectedPost.replies.map((r) => (
              <div key={r.id} className={styles.reply}>
                <div className={styles.replyAuthor}>{r.author}</div>
                <div className={styles.replyTime}>{timeAgo(r.timestamp)}</div>
                <div className={styles.replyBody}>{r.body}</div>
              </div>
            ))}

            {token && (
              <div className={styles.replyForm}>
                <textarea
                  className={styles.replyInput}
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button
                  className={styles.replyBtn}
                  onClick={handleReply}
                  disabled={replySubmitting || !replyText.trim()}
                >
                  {replySubmitting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.toolbar}>
            <span style={{ fontSize: 11, color: '#818384' }}>/{board}</span>
            {token && (
              <button className={styles.newPostBtn} onClick={() => setShowForm(true)}>
                + New Post
              </button>
            )}
          </div>

          <div className={styles.content}>
            {loading && <div className={styles.loading}>Loading posts from the void...</div>}
            {error && <div className={styles.error}>Error: {error}</div>}
            {!loading && !error && posts.length === 0 && (
              <div className={styles.empty}>No posts in /{board} yet. The void is silent.</div>
            )}
            {posts.map((post) => (
              <div
                key={post.id}
                className={styles.postCard}
                onClick={() => { setSelectedPost(post); fetchPost(post.id); }}
              >
                <div className={styles.voteCol}>
                  <button className={styles.voteBtnUp}>&#9650;</button>
                  <span className={styles.voteCount}>{Math.floor(Math.random() * 50)}</span>
                  <button className={styles.voteBtnDown}>&#9660;</button>
                </div>
                <div className={styles.postBody}>
                  <div className={styles.postTitle}>{post.title}</div>
                  <div className={styles.postMeta}>
                    Posted by {post.author} | {timeAgo(post.timestamp)}
                  </div>
                  <div className={styles.postPreview}>{post.body.slice(0, 120)}</div>
                  <div className={styles.postStats}>
                    <span>{post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <div className={styles.formOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.formWindow} onClick={(e) => e.stopPropagation()}>
            <div className={styles.formTitleBar}>
              <span>New Post in /{board}</span>
              <button className={styles.formCloseBtn} onClick={() => setShowForm(false)}>X</button>
            </div>
            <div className={styles.formBody}>
              <input
                className={styles.formInput}
                placeholder="Title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
              <textarea
                className={styles.formTextarea}
                placeholder="What's on your mind, wanderer?"
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
              />
              <button
                className={styles.formSubmitBtn}
                onClick={handleCreatePost}
                disabled={submitting || !formTitle.trim() || !formBody.trim()}
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.statusBar}>
        <span>/{board} | {posts.length} posts</span>
        <span>BackIt&#8482; v1.0</span>
      </div>
    </div>
  );
}
