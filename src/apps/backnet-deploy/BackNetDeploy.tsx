import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './BackNetDeploy.module.css';

interface SiteData {
  id: string;
  title: string;
  html: string;
  css: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  views: number;
}

interface Props {
  windowId: string;
}

const DEFAULT_HTML = `<div class="page">
  <h1>Welcome to BackNET</h1>
  <p>This site was built with BackNET Deploy™</p>
  <p>You are now part of the Backrooms.</p>
</div>`;

const DEFAULT_CSS = `body {
  background: #0d0d00;
  color: #FFD700;
  font-family: 'Courier New', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
}

.page {
  text-align: center;
  padding: 40px;
}

h1 {
  font-size: 32px;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  margin-bottom: 16px;
}

p {
  color: #B8960F;
  margin-bottom: 8px;
}`;

type View = 'dashboard' | 'editor';

export default function BackNetDeploy({ windowId: _windowId }: Props) {
  const { state } = useAppContext();
  const [view, setView] = useState<View>('dashboard');
  const [sites, setSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('My BackNET Site');
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [deploying, setDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'css'>('html');
  const previewRef = useRef<HTMLIFrameElement>(null);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sites');
      if (!res.ok) throw new Error('Failed to fetch sites');
      const data = await res.json();
      setSites(data);
    } catch (err: any) {
      setError(err.message);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (state.isOnline) {
      fetchSites();
    } else {
      setLoading(false);
      setError('No BackNET connection');
    }
  }, [state.isOnline, fetchSites]);

  // Update preview
  useEffect(() => {
    if (view !== 'editor' || !previewRef.current) return;

    const doc = previewRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head><style>${css}</style></head>
<body>${html}</body>
</html>`);
    doc.close();
  }, [html, css, view]);

  const handleNewSite = () => {
    setEditId(null);
    setTitle('My BackNET Site');
    setHtml(DEFAULT_HTML);
    setCss(DEFAULT_CSS);
    setDeployedUrl(null);
    setView('editor');
  };

  const handleEditSite = async (site: SiteData) => {
    try {
      const res = await fetch(`/api/sites/${site.id}`);
      if (!res.ok) throw new Error('Failed to load site');
      const data = await res.json();
      setEditId(data.id);
      setTitle(data.title);
      setHtml(data.html);
      setCss(data.css);
      setDeployedUrl(`${window.location.origin}/site/${data.id}`);
      setView('editor');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeploy = async () => {
    if (!title.trim() || !html.trim()) return;

    setDeploying(true);
    try {
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(state.user?.token ? { Authorization: `Bearer ${state.user.token}` } : {}),
      };

      if (editId) {
        // Update existing
        const res = await fetch(`/api/sites/${editId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ title, html, css }),
        });
        if (!res.ok) throw new Error('Failed to update site');
        setDeployedUrl(`${window.location.origin}/site/${editId}`);
      } else {
        // Create new
        const res = await fetch('/api/sites', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ title, html, css }),
        });
        if (!res.ok) throw new Error('Failed to deploy site');
        const data = await res.json();
        setEditId(data.id);
        setDeployedUrl(`${window.location.origin}${data.url}`);
      }
      await fetchSites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeploying(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: 'DELETE',
        headers: state.user?.token ? { Authorization: `Bearer ${state.user.token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete site');
      await fetchSites();
      if (editId === id) {
        setView('dashboard');
        setEditId(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (!state.isOnline) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>🚀 BackNET Deploy™</span>
        </div>
        <div className={styles.dashboard}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📵</div>
            <div className={styles.emptyText}>No BackNET Connection</div>
            <div className={styles.emptySub}>BackNET Deploy™ requires an active BackNET connection to deploy and manage sites.</div>
          </div>
        </div>
        <div className={styles.statusBar}>
          <span>Offline</span>
          <span>BackNET Deploy™ v4.0.011</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          🚀 BackNET Deploy™
          {view === 'editor' && <> — {editId ? 'Edit' : 'New'} Site</>}
        </span>
        <div className={styles.headerActions}>
          {view === 'editor' && (
            <button className={styles.smallButton} onClick={() => { setView('dashboard'); fetchSites(); }}>
              ← Dashboard
            </button>
          )}
          {view === 'dashboard' && (
            <button className={styles.smallButton} onClick={handleNewSite}>
              + New Site
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {view === 'dashboard' && (
          <div className={styles.dashboard}>
            {/* Stats */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{sites.length}</div>
                <div className={styles.statLabel}>Sites Deployed</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {sites.reduce((sum, s) => sum + (s.views || 0), 0)}
                </div>
                <div className={styles.statLabel}>Total Views</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>∞</div>
                <div className={styles.statLabel}>Uptime</div>
              </div>
            </div>

            {loading && (
              <div className={styles.loading}>
                Loading<span className={styles.loadingDots} />
              </div>
            )}

            {error && !loading && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>⚠️</div>
                <div className={styles.emptyText}>{error}</div>
                <div className={styles.emptySub}>
                  <button className={styles.smallButton} onClick={fetchSites} style={{ marginTop: '8px' }}>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && sites.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🌐</div>
                <div className={styles.emptyText}>No sites deployed yet</div>
                <div className={styles.emptySub}>
                  Create your first BackNET site. It will be accessible to anyone on the BackNET — and beyond.
                </div>
              </div>
            )}

            {!loading && !error && sites.length > 0 && (
              <div className={styles.sitesList}>
                {sites.map(site => (
                  <div key={site.id} className={styles.siteCard}>
                    <div className={styles.siteIcon}>🌐</div>
                    <div className={styles.siteInfo}>
                      <div className={styles.siteName}>{site.title}</div>
                      <div className={styles.siteMeta}>
                        <span>by {site.author}</span>
                        <span>{site.views} views</span>
                        <span>{formatDate(site.updatedAt)}</span>
                      </div>
                    </div>
                    <div className={styles.siteActions}>
                      <button
                        className={styles.smallButton}
                        onClick={() => handleCopyUrl(`${window.location.origin}/site/${site.id}`)}
                        title="Copy URL"
                      >
                        📋
                      </button>
                      <button
                        className={styles.smallButton}
                        onClick={() => window.open(`/site/${site.id}`, '_blank')}
                        title="Open in new tab"
                      >
                        ↗
                      </button>
                      <button
                        className={styles.smallButton}
                        onClick={() => handleEditSite(site)}
                      >
                        Edit
                      </button>
                      <button
                        className={`${styles.smallButton} ${styles.danger}`}
                        onClick={() => handleDelete(site.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'editor' && (
          <div className={styles.editor}>
            {/* Editor toolbar */}
            <div className={styles.editorToolbar}>
              <label>Title:</label>
              <input
                className={styles.titleInput}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Site title..."
              />
              <button
                className={styles.smallButton}
                onClick={handleDeploy}
                disabled={deploying || !title.trim() || !html.trim()}
                style={{ fontWeight: 'bold' }}
              >
                {deploying ? 'Deploying...' : editId ? '↻ Redeploy' : '🚀 Deploy'}
              </button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'html' ? styles.active : ''}`}
                onClick={() => setActiveTab('html')}
              >
                HTML
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'css' ? styles.active : ''}`}
                onClick={() => setActiveTab('css')}
              >
                CSS
              </button>
            </div>

            {/* Code + Preview */}
            <div className={styles.editorPanes}>
              <div className={styles.editorPane}>
                <div className={styles.paneHeader}>
                  <span className={styles.paneHeaderIcon}>{'</>'}</span>
                  {activeTab === 'html' ? 'HTML' : 'CSS'}
                </div>
                {activeTab === 'html' ? (
                  <textarea
                    className={styles.codeArea}
                    value={html}
                    onChange={e => setHtml(e.target.value)}
                    placeholder="Write your HTML here..."
                    spellCheck={false}
                  />
                ) : (
                  <textarea
                    className={styles.codeArea}
                    value={css}
                    onChange={e => setCss(e.target.value)}
                    placeholder="Write your CSS here..."
                    spellCheck={false}
                  />
                )}
              </div>

              <div className={styles.previewPane}>
                <div className={styles.paneHeader}>
                  <span className={styles.paneHeaderIcon}>👁</span>
                  Preview
                </div>
                <iframe
                  ref={previewRef}
                  className={styles.previewFrame}
                  sandbox="allow-same-origin"
                  title="Site Preview"
                />
              </div>
            </div>

            {/* Deploy bar */}
            <div className={styles.deployBar}>
              <div className={styles.deployStatus}>
                <span className={`${styles.dot} ${deploying ? styles.deploying : deployedUrl ? styles.ready : styles.error}`} />
                {deploying ? 'Deploying to BackNET...' : deployedUrl ? 'Live' : 'Not deployed'}
              </div>
              {deployedUrl && (
                <span className={styles.deployUrl}>
                  <span
                    className={styles.deployUrlLink}
                    onClick={() => window.open(deployedUrl, '_blank')}
                  >
                    {deployedUrl}
                  </span>
                  {' '}
                  <button
                    className={styles.smallButton}
                    onClick={() => handleCopyUrl(deployedUrl)}
                    style={{ padding: '1px 6px', minWidth: 'auto' }}
                  >
                    Copy
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <span>
          {view === 'dashboard'
            ? `${sites.length} site${sites.length !== 1 ? 's' : ''} deployed`
            : editId ? `Editing: ${title}` : 'New site'}
        </span>
        <span>BackNET Deploy™ v4.0.011 | IPv4</span>
      </div>
    </div>
  );
}
