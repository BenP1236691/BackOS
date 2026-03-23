import { useState, useEffect, type FormEvent } from 'react';
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

const preBuiltResults = [
  {
    title: 'Level 0 — The Lobby',
    url: 'backnet://wiki.backrooms.net/levels/0',
    desc: 'An expansive complex of mono-yellow rooms. The fluorescent lights hum at a constant 60Hz. The carpet is damp. You are never truly alone here.',
  },
  {
    title: 'Level 1 — Habitable Zone',
    url: 'backnet://wiki.backrooms.net/levels/1',
    desc: 'A vast industrial warehouse with concrete walls and flickering lights. Slightly more hospitable, but entities roam freely between the shelving units.',
  },
  {
    title: 'Level 2 — Pipe Dreams',
    url: 'backnet://wiki.backrooms.net/levels/2',
    desc: 'An endless network of dark utility tunnels filled with pipes and machinery. The ambient temperature exceeds 37C. Smilers are common.',
  },
  {
    title: 'Entity 1 — Smiler',
    url: 'backnet://wiki.backrooms.net/entities/1',
    desc: 'Identifiable by their luminescent eyes and wide grin visible in darkness. DO NOT maintain eye contact. DO NOT approach. Follow avoidance protocol B-7.',
  },
  {
    title: 'Object 94 — Back OS',
    url: 'backnet://wiki.backrooms.net/objects/94',
    desc: 'A mysterious operating system found on terminals throughout the Backrooms. Origin unknown. Users report feeling watched after extended use. You are using it right now.',
  },
];

export default function BackNetExplorer({ windowId }: Props) {
  const { state } = useAppContext();
  const [address, setAddress] = useState('backnet://search.backrooms.net');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFakeResults, setShowFakeResults] = useState(false);
  const [fakeQuery, setFakeQuery] = useState('');
  const [deployedSites, setDeployedSites] = useState<DeployedSite[]>([]);
  const [viewingSite, setViewingSite] = useState<string | null>(null);

  useEffect(() => {
    if (state.isOnline) {
      fetch('/api/sites')
        .then(r => r.ok ? r.json() : [])
        .then(setDeployedSites)
        .catch(() => setDeployedSites([]));
    }
  }, [state.isOnline]);

  const handleVisitSite = (siteId: string, title: string) => {
    setAddress(`backnet://sites.backrooms.net/${siteId}`);
    setViewingSite(siteId);
    setShowFakeResults(false);
  };

  const handleGoHome = () => {
    setShowFakeResults(false);
    setSearchQuery('');
    setViewingSite(null);
    setAddress('backnet://search.backrooms.net');
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setFakeQuery(searchQuery.trim());
      setShowFakeResults(true);
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
          <input
            className={styles.addressBar}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            readOnly
          />
        </div>
        <div className={styles.content}>
          <div className={styles.offlinePage}>
            <div className={styles.offlineIcon}>X</div>
            <div className={styles.offlineTitle}>No BackNET Connection</div>
            <div className={styles.offlineMsg}>
              Unable to connect to the BackNET. Please check your connection
              to The Backroom&trade; network infrastructure. If you are between
              levels, connectivity may be temporarily unavailable.
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
        <button className={styles.navButton} title="Back">{'<'}</button>
        <button className={styles.navButton} title="Forward">{'>'}</button>
        <button className={styles.navButton} title="Refresh">R</button>
        <button className={styles.navButton} title="Home" onClick={handleGoHome}>H</button>
        <input
          className={styles.addressBar}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className={styles.content}>
        {viewingSite ? (
          <iframe
            src={`/site/${viewingSite}`}
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
            sandbox="allow-same-origin allow-scripts"
            title="BackNET Site"
          />
        ) : (
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
                      <div className={styles.resultLink}>{r.title}</div>
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
                    <div
                      className={styles.resultLink}
                      onClick={() => handleVisitSite(site.id, site.title)}
                    >
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
                  <div className={styles.resultLink}>{result.title}</div>
                  <div className={styles.resultUrl}>{result.url}</div>
                  <div className={styles.resultDesc}>{result.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.statusBar}>
        {viewingSite ? `Viewing site | backnet://sites.backrooms.net/${viewingSite}` : `Done | ${address}`}
      </div>
    </div>
  );
}
