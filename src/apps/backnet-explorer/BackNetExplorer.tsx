import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './BackNetExplorer.module.css';

interface Props {
  windowId: string;
}

interface DeployedSite {
  id: string;
  title: string;
  author: string;
  views: number;
  updatedAt: number;
}

interface WikiPage {
  title: string;
  content: string;
  path: string;
}

const WIKI_URL_MAP: Record<string, string> = {
  'backnet://wiki.backrooms.net/levels/0': 'level-0',
  'backnet://wiki.backrooms.net/levels/1': 'level-1',
  'backnet://wiki.backrooms.net/levels/2': 'level-2',
  'backnet://wiki.backrooms.net/entities/1': 'entity-1',
  'backnet://wiki.backrooms.net/objects/94': 'object-94',
};

const preBuiltResults = [
  {
    title: 'Level 0 — The Lobby',
    url: 'backnet://wiki.backrooms.net/levels/0',
    desc: 'An expansive complex of mono-yellow rooms. The fluorescent lights hum at a constant 60Hz.',
    wikiPath: 'level-0',
  },
  {
    title: 'Level 1 — Habitable Zone',
    url: 'backnet://wiki.backrooms.net/levels/1',
    desc: 'A vast industrial warehouse with concrete walls and flickering lights.',
    wikiPath: 'level-1',
  },
  {
    title: 'Level 2 — Pipe Dreams',
    url: 'backnet://wiki.backrooms.net/levels/2',
    desc: 'An endless network of dark utility tunnels filled with pipes and machinery.',
    wikiPath: 'level-2',
  },
  {
    title: 'Entity 1 — Smiler',
    url: 'backnet://wiki.backrooms.net/entities/1',
    desc: 'Identifiable by their luminescent eyes and wide grin visible in darkness.',
    wikiPath: 'entity-1',
  },
  {
    title: 'Object 94 — Back OS',
    url: 'backnet://wiki.backrooms.net/objects/94',
    desc: 'A mysterious operating system found on terminals throughout the Backrooms.',
    wikiPath: 'object-94',
  },
];

type PageView = 'home' | 'wiki' | 'site';

export default function BackNetExplorer({ windowId: _windowId }: Props) {
  const { state } = useAppContext();
  const [address, setAddress] = useState('backnet://search.backrooms.net');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFakeResults, setShowFakeResults] = useState(false);
  const [fakeQuery, setFakeQuery] = useState('');
  const [deployedSites, setDeployedSites] = useState<DeployedSite[]>([]);

  // Navigation
  const [pageView, setPageView] = useState<PageView>('home');
  const [viewingSiteId, setViewingSiteId] = useState<string | null>(null);
  const [wikiPage, setWikiPage] = useState<WikiPage | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiError, setWikiError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(['backnet://search.backrooms.net']);
  const [historyIdx, setHistoryIdx] = useState(0);

  useEffect(() => {
    if (state.isOnline) {
      fetch('/api/sites')
        .then(r => r.ok ? r.json() : [])
        .then(setDeployedSites)
        .catch(() => setDeployedSites([]));
    }
  }, [state.isOnline]);

  const navigate = useCallback((url: string) => {
    setAddress(url);
    setHistory(prev => [...prev.slice(0, historyIdx + 1), url]);
    setHistoryIdx(prev => prev + 1);
  }, [historyIdx]);

  const fetchWikiPage = useCallback(async (path: string) => {
    setPageView('wiki');
    setWikiLoading(true);
    setWikiError(null);
    setWikiPage(null);

    try {
      const res = await fetch(`/api/wiki?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Page not found');
      const data = await res.json();
      setWikiPage(data);
    } catch (err: any) {
      setWikiError(err.message || 'Failed to load page');
    } finally {
      setWikiLoading(false);
    }
  }, []);

  const handleNavigateToUrl = useCallback((url: string) => {
    navigate(url);

    // Check if it's a wiki URL
    const wikiPath = WIKI_URL_MAP[url];
    if (wikiPath) {
      fetchWikiPage(wikiPath);
      return;
    }

    // Check if it's a direct wiki path like backnet://wiki.backrooms.net/something
    const wikiMatch = url.match(/^backnet:\/\/wiki\.backrooms\.net\/(.+)$/);
    if (wikiMatch) {
      fetchWikiPage(wikiMatch[1]);
      return;
    }

    // Check if it's a deployed site
    const siteMatch = url.match(/^backnet:\/\/sites\.backrooms\.net\/(.+)$/);
    if (siteMatch) {
      setPageView('site');
      setViewingSiteId(siteMatch[1]);
      return;
    }

    // Default: go home
    setPageView('home');
  }, [navigate, fetchWikiPage]);

  const handleResultClick = (result: typeof preBuiltResults[0]) => {
    handleNavigateToUrl(result.url);
  };

  const handleVisitSite = (siteId: string) => {
    handleNavigateToUrl(`backnet://sites.backrooms.net/${siteId}`);
  };

  const handleGoHome = () => {
    setPageView('home');
    setShowFakeResults(false);
    setSearchQuery('');
    setViewingSiteId(null);
    setWikiPage(null);
    navigate('backnet://search.backrooms.net');
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      const url = history[newIdx];
      setAddress(url);
      if (url === 'backnet://search.backrooms.net') {
        handleGoHome();
      } else {
        handleNavigateToUrl(url);
      }
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      const url = history[newIdx];
      setAddress(url);
      handleNavigateToUrl(url);
    }
  };

  const handleAddressSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleNavigateToUrl(address);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setFakeQuery(searchQuery.trim());
      setShowFakeResults(true);
    }
  };

  // Handle clicks on wiki page links
  const handleWikiContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (!link) return;

    e.preventDefault();
    const href = link.getAttribute('href') || '';

    // If it's a wikidot link, extract the path
    if (href.includes('backrooms-wiki.wikidot.com/')) {
      const path = href.split('backrooms-wiki.wikidot.com/')[1];
      if (path) {
        const url = `backnet://wiki.backrooms.net/${path}`;
        navigate(url);
        fetchWikiPage(path);
      }
    }
  };

  if (!state.isOnline) {
    return (
      <div className={styles.container}>
        <div className={styles.toolbar}>
          <button className={styles.navButton}>{'<'}</button>
          <button className={styles.navButton}>{'>'}</button>
          <button className={styles.navButton}>R</button>
          <button className={styles.navButton}>H</button>
          <input className={styles.addressBar} value={address} readOnly />
        </div>
        <div className={styles.content}>
          <div className={styles.offlinePage}>
            <div className={styles.offlineIcon}>X</div>
            <div className={styles.offlineTitle}>No BackNET Connection</div>
            <div className={styles.offlineMsg}>
              Unable to connect to the BackNET. Please check your connection
              to The Backroom&trade; network infrastructure.
            </div>
          </div>
        </div>
        <div className={styles.statusBar}>Error: No BackNET connection</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button className={styles.navButton} title="Back" onClick={handleBack} disabled={historyIdx <= 0}>{'<'}</button>
        <button className={styles.navButton} title="Forward" onClick={handleForward} disabled={historyIdx >= history.length - 1}>{'>'}</button>
        <button className={styles.navButton} title="Refresh" onClick={() => {
          if (pageView === 'wiki' && wikiPage) fetchWikiPage(wikiPage.path);
        }}>R</button>
        <button className={styles.navButton} title="Home" onClick={handleGoHome}>H</button>
        <form onSubmit={handleAddressSubmit} style={{ flex: 1, display: 'flex' }}>
          <input
            className={styles.addressBar}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </form>
      </div>

      <div className={styles.content}>
        {/* Deployed site view */}
        {pageView === 'site' && viewingSiteId && (
          <iframe
            src={`/site/${viewingSiteId}`}
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
            sandbox="allow-same-origin allow-scripts"
            title="BackNET Site"
          />
        )}

        {/* Wiki page view */}
        {pageView === 'wiki' && (
          <div className={styles.wikiPage}>
            {wikiLoading && (
              <div className={styles.wikiLoading}>
                Loading page from BackNET Wiki...
              </div>
            )}
            {wikiError && (
              <div className={styles.wikiError}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Page Not Found</div>
                <div>{wikiError}</div>
              </div>
            )}
            {wikiPage && (
              <>
                <h1 className={styles.wikiTitle}>{wikiPage.title}</h1>
                <div
                  className={styles.wikiContent}
                  onClick={handleWikiContentClick}
                  dangerouslySetInnerHTML={{ __html: wikiPage.content }}
                />
              </>
            )}
          </div>
        )}

        {/* Home / search page */}
        {pageView === 'home' && (
          <div className={styles.searchPage}>
            <div className={styles.searchLogo}>BackSearch</div>
            <div className={styles.searchSubtitle}>Searching the infinite halls</div>

            <form className={styles.searchForm} onSubmit={handleSearch}>
              <input
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the Backrooms..."
              />
              <button type="submit" className={styles.searchButton}>Search</button>
            </form>

            {showFakeResults && (
              <div className={styles.fakeResults}>
                <div className={styles.fakeResultsHeader}>
                  About 3,847,291 results for &quot;{fakeQuery}&quot; (0.{Math.floor(Math.random() * 90) + 10} seconds)
                </div>
                {preBuiltResults
                  .sort(() => Math.random() - 0.5)
                  .slice(0, 3)
                  .map((r, i) => (
                    <div key={i} className={styles.resultItem}>
                      <div className={styles.resultLink} onClick={() => handleResultClick(r)}>{r.title}</div>
                      <div className={styles.resultUrl}>{r.url}</div>
                      <div className={styles.resultDesc}>{r.desc}</div>
                    </div>
                  ))}
              </div>
            )}

            {deployedSites.length > 0 && (
              <div className={styles.databaseSection}>
                <div className={styles.databaseTitle}>🚀 BackNET Sites — User Deployed</div>
                {deployedSites.map((site) => (
                  <div key={site.id} className={styles.resultItem}>
                    <div className={styles.resultLink} onClick={() => handleVisitSite(site.id)}>
                      {site.title}
                    </div>
                    <div className={styles.resultUrl}>
                      backnet://sites.backrooms.net/{site.id} · by {site.author} · {site.views} views
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.databaseSection}>
              <div className={styles.databaseTitle}>General Public Database</div>
              {preBuiltResults.map((result, i) => (
                <div key={i} className={styles.resultItem}>
                  <div className={styles.resultLink} onClick={() => handleResultClick(result)}>{result.title}</div>
                  <div className={styles.resultUrl}>{result.url}</div>
                  <div className={styles.resultDesc}>{result.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.statusBar}>
        {pageView === 'wiki' && wikiLoading
          ? 'Loading...'
          : pageView === 'site'
          ? `Viewing site | backnet://sites.backrooms.net/${viewingSiteId}`
          : `Done | ${address}`}
      </div>
    </div>
  );
}
