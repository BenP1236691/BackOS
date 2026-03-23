import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './BackFilesExplorer.module.css';

interface Props {
  windowId: string;
}

interface FileEntry {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  size?: number;
  owner: string;
  system?: boolean;
  updatedAt?: number;
}

// System files that always appear (read-only)
const SYSTEM_FILES: FileEntry[] = [
  { id: 'sys-1', name: 'system.ini', type: 'file', path: '/BackOS', owner: 'system', system: true, size: 180, content: '[BackOS Configuration]\nversion=4.0.011\ntheme=fluorescent_yellow\nexit_enabled=false\nentity_monitoring=ACTIVE\nhum_frequency=60Hz\n\n; Do not modify these values' },
  { id: 'sys-2', name: 'autoexec.bat', type: 'file', path: '/BackOS', owner: 'system', system: true, size: 120, content: '@echo off\necho Welcome to Back OS...\necho Initializing entity detection...\necho There is no exit command.\npause >nul' },
  { id: 'sys-3', name: 'safety_guide.txt', type: 'file', path: '/Level_0', owner: 'system', system: true, size: 310, content: 'LEVEL 0 SAFETY GUIDE\n====================\n1. Stay in well-lit areas\n2. Do not investigate strange sounds\n3. The buzzing is normal\n4. If you see a door, do not open it\n5. If the lights flicker, stand still\n6. You are being watched. For your safety.\n7. There is no Level -1. Stop asking.' },
  { id: 'sys-4', name: 'fluorescent_log.dat', type: 'file', path: '/Level_0', owner: 'system', system: true, size: 480, content: 'FLUORESCENT LIGHT LOG\n=====================\nLight #00001: ACTIVE - 60Hz\nLight #00002: ACTIVE - 60Hz\nLight #00003: ACTIVE - 61Hz - WARNING\nLight #04571: ACTIVE - 60Hz\nLight #99999: ACTIVE - 0Hz - [DATA EXPUNGED]\n\nNote: Light #00003 flagged.\nEntity presence suspected.' },
  { id: 'sys-5', name: 'entity_warning.txt', type: 'file', path: '/Level_1', owner: 'system', system: true, size: 250, content: 'ENTITY WARNING - LEVEL 1\n========================\nType: Smiler\nLocation: Dark corners\nThreat: EXTREME\n\nREMINDER: If you see eyes in the\ndarkness, DO NOT smile back.' },
  { id: 'sys-6', name: 'behavioral_patterns.dat', type: 'file', path: '/Entity_Data', owner: 'system', system: true, size: 400, content: 'ENTITY 1: SMILER\n=================\nClassification: Hostile\nHabitat: Dark areas, all levels\nMovement Speed: Unknown\nAttack Pattern: Unknown (no survivors)\nWeakness: Sustained light exposure\n\n"I have been studying them for weeks.\nI think they know."' },
  { id: 'sys-7', name: 'exit_instructions_CORRUPTED.txt', type: 'file', path: '/', owner: 'system', system: true, size: 200, content: 'T̸o̶ ̵e̵x̶i̸t̴:\n1̶.̸ F̵i̸n̷d̵ ̵t̸h̵e̷ ̵d̷o̴o̶r̷\n2̸.̶ T̶u̶r̶n̸ ̸t̵h̸e̶ ̸h̸a̸n̵d̵l̵e̸\n3̵.̵ [̸C̸O̸R̶R̶U̶P̵T̸E̷D̶]̴\n4̵.̵ [̶D̵A̷T̷A̷ ̶L̸O̶S̸T̵]̷\n\nW̷A̵R̸N̷I̶N̸G̸:̷ T̵h̷i̴s̶ ̸f̷i̸l̸e̷ ̴w̷a̵s̷\nc̵o̴r̶r̷u̸p̸t̸e̵d̷.̵ P̷e̴r̶h̸a̷p̵s̷ i̷n̵t̷e̵n̸t̵i̶o̸n̸a̸l̵l̵y̵.' },
  { id: 'sys-8', name: 'journal_entry_01.txt', type: 'file', path: '/', owner: 'system', system: true, size: 320, content: 'JOURNAL ENTRY #1\n=================\nI found this terminal today. The screen\nsaid "Back OS".\n\nI don\'t know how long I\'ve been here.\nThe fluorescent lights make it impossible\nto tell time.\n\nI tried the door at the end of the hall.\nIt led to another hall. And another.\n\nThe carpet is always damp.\n\nI\'m going to try to find a way out.\nThere has to be an exit.\n\n...Right?' },
];

const SYSTEM_FOLDERS = ['/BackOS', '/Level_0', '/Level_1', '/Entity_Data'];

export default function BackFilesExplorer({ windowId: _windowId }: Props) {
  const { state } = useAppContext();
  const username = state.user?.username || 'anonymous';
  const token = state.user?.token;

  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);

  // Dialog states
  const [dialog, setDialog] = useState<'none' | 'newFile' | 'newFolder' | 'edit' | 'view'>('none');
  const [dialogName, setDialogName] = useState('');
  const [dialogContent, setDialogContent] = useState('');
  const [editingFile, setEditingFile] = useState<FileEntry | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?owner=${encodeURIComponent(username)}&path=${encodeURIComponent(currentPath)}`);
      if (res.ok) {
        const data = await res.json();
        // Merge with system files for this path
        const sysFiles = SYSTEM_FILES.filter(f => f.path === currentPath);
        const sysFolderNames = SYSTEM_FOLDERS
          .filter(f => {
            const parent = f.substring(0, f.lastIndexOf('/')) || '/';
            return parent === currentPath;
          })
          .map(f => ({
            id: `sysfolder-${f}`,
            name: f.split('/').pop()!,
            type: 'folder' as const,
            path: currentPath,
            owner: 'system',
            system: true,
          }));
        const userFiles: FileEntry[] = data.files || [];
        setFiles([...sysFolderNames, ...sysFiles, ...userFiles]);
      } else {
        // API not available — show system files only
        const sysFiles = SYSTEM_FILES.filter(f => f.path === currentPath);
        const sysFolderNames = SYSTEM_FOLDERS
          .filter(f => {
            const parent = f.substring(0, f.lastIndexOf('/')) || '/';
            return parent === currentPath;
          })
          .map(f => ({
            id: `sysfolder-${f}`,
            name: f.split('/').pop()!,
            type: 'folder' as const,
            path: currentPath,
            owner: 'system',
            system: true,
          }));
        setFiles([...sysFolderNames, ...sysFiles]);
      }
    } catch {
      const sysFiles = SYSTEM_FILES.filter(f => f.path === currentPath);
      const sysFolderNames = SYSTEM_FOLDERS
        .filter(f => {
          const parent = f.substring(0, f.lastIndexOf('/')) || '/';
          return parent === currentPath;
        })
        .map(f => ({
          id: `sysfolder-${f}`,
          name: f.split('/').pop()!,
          type: 'folder' as const,
          path: currentPath,
          owner: 'system',
          system: true,
        }));
      setFiles([...sysFolderNames, ...sysFiles]);
    } finally {
      setLoading(false);
    }
  }, [currentPath, username]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
  };

  const goUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    navigateTo(parts.length === 0 ? '/' : '/' + parts.join('/'));
  };

  const openFolder = (folder: FileEntry) => {
    const newPath = currentPath === '/' ? `/${folder.name}` : `${currentPath}/${folder.name}`;
    navigateTo(newPath);
  };

  const openFile = (file: FileEntry) => {
    setEditingFile(file);
    setDialogContent(file.content || '');
    setDialog(file.system ? 'view' : 'edit');
  };

  const handleCreateFile = async () => {
    if (!dialogName.trim() || !token) return;
    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: dialogName.trim(), path: currentPath, type: 'file', content: dialogContent }),
      });
      setDialog('none');
      setDialogName('');
      setDialogContent('');
      fetchFiles();
    } catch { /* silent */ }
  };

  const handleCreateFolder = async () => {
    if (!dialogName.trim() || !token) return;
    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: dialogName.trim(), path: currentPath, type: 'folder' }),
      });
      setDialog('none');
      setDialogName('');
      fetchFiles();
    } catch { /* silent */ }
  };

  const handleSaveFile = async () => {
    if (!editingFile || !token) return;
    try {
      await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: editingFile.id, content: dialogContent }),
      });
      setDialog('none');
      setEditingFile(null);
      fetchFiles();
    } catch { /* silent */ }
  };

  const handleDelete = async (file: FileEntry) => {
    if (file.system || !token) return;
    try {
      await fetch(`/api/files?id=${file.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedFile(null);
      fetchFiles();
    } catch { /* silent */ }
  };

  const folders = files.filter(f => f.type === 'folder');
  const regularFiles = files.filter(f => f.type === 'file');

  const formatSize = (size?: number) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    return `${(size / 1024).toFixed(1)} KB`;
  };

  const getIcon = (file: FileEntry) => {
    if (file.type === 'folder') return '📂';
    if (file.name.endsWith('.dat')) return '📊';
    if (file.name.endsWith('.bat') || file.name.endsWith('.ini')) return '⚙️';
    if (file.name.endsWith('.wav') || file.name.endsWith('.mp3')) return '🎵';
    if (file.name.endsWith('.map') || file.name.endsWith('.schematic')) return '🗺️';
    if (file.name.includes('CORRUPTED')) return '⚠️';
    return '📄';
  };

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.navButton} title="Up" onClick={goUp} disabled={currentPath === '/'}>↑</button>
        <button className={styles.navButton} title="Refresh" onClick={fetchFiles}>⟳</button>
        <input className={styles.addressBar} value={`C:${currentPath.replace(/\//g, '\\')}`} readOnly />
      </div>

      {/* Action bar */}
      {token && (
        <div className={styles.actionBar}>
          <button className={styles.actionButton} onClick={() => { setDialog('newFile'); setDialogName(''); setDialogContent(''); }}>📄 New File</button>
          <button className={styles.actionButton} onClick={() => { setDialog('newFolder'); setDialogName(''); }}>📁 New Folder</button>
          {selectedFile && !selectedFile.system && (
            <button className={styles.actionButton} onClick={() => handleDelete(selectedFile)}>🗑️ Delete</button>
          )}
        </div>
      )}

      {/* Body */}
      <div className={styles.body}>
        {/* Sidebar - quick nav */}
        <div className={styles.sidebar}>
          <div className={`${styles.treeItem} ${currentPath === '/' ? styles.treeItemActive : ''}`} onClick={() => navigateTo('/')}>
            <span className={styles.treeIcon}>💻</span> C:\
          </div>
          {SYSTEM_FOLDERS.map(f => (
            <div key={f} className={`${styles.treeItem} ${currentPath === f ? styles.treeItemActive : ''}`} onClick={() => navigateTo(f)} style={{ paddingLeft: 16 }}>
              <span className={styles.treeIcon}>📁</span> {f.split('/').pop()}
            </div>
          ))}
          <div className={`${styles.treeItem} ${currentPath === '/My_Files' ? styles.treeItemActive : ''}`} onClick={() => navigateTo('/My_Files')} style={{ paddingLeft: 16 }}>
            <span className={styles.treeIcon}>📁</span> My_Files
          </div>
        </div>

        {/* File list */}
        <div className={styles.fileList}>
          {loading && <div style={{ padding: 12, color: 'var(--color-text-secondary)' }}>Loading...</div>}

          {!loading && folders.map(f => (
            <div key={f.id} className={styles.fileItem} onDoubleClick={() => openFolder(f)}>
              <span className={styles.fileIcon}>📂</span>
              <span className={styles.fileName}>{f.name}</span>
              <span className={styles.fileSize}>{f.system ? 'System' : ''}</span>
            </div>
          ))}

          {!loading && regularFiles.map(f => (
            <div
              key={f.id}
              className={`${styles.fileItem} ${selectedFile?.id === f.id ? styles.fileItemSelected : ''}`}
              onClick={() => setSelectedFile(f)}
              onDoubleClick={() => openFile(f)}
            >
              <span className={styles.fileIcon}>{getIcon(f)}</span>
              <span className={styles.fileName}>{f.name}</span>
              <span className={styles.fileSize}>{f.system ? 'System' : formatSize(f.size)}</span>
            </div>
          ))}

          {!loading && folders.length === 0 && regularFiles.length === 0 && (
            <div style={{ padding: 12, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              Empty folder. The void stares back.
            </div>
          )}
        </div>
      </div>

      {/* New File Dialog */}
      {dialog === 'newFile' && (
        <div className={styles.previewOverlay} onClick={() => setDialog('none')}>
          <div className={styles.previewWindow} onClick={e => e.stopPropagation()}>
            <div className={styles.previewTitleBar}>
              <span>New File</span>
              <button className={styles.previewCloseBtn} onClick={() => setDialog('none')}>X</button>
            </div>
            <div className={styles.dialogBody}>
              <div style={{ fontSize: 11, marginBottom: 4 }}>File name:</div>
              <input className={styles.dialogInput} value={dialogName} onChange={e => setDialogName(e.target.value)} placeholder="document.txt" autoFocus />
              <div style={{ fontSize: 11, marginBottom: 4 }}>Content:</div>
              <textarea className={styles.editArea} style={{ height: 120 }} value={dialogContent} onChange={e => setDialogContent(e.target.value)} placeholder="Type file contents..." />
              <div className={styles.dialogButtons}>
                <button className={styles.actionButton} onClick={handleCreateFile} disabled={!dialogName.trim()}>Create</button>
                <button className={styles.actionButton} onClick={() => setDialog('none')}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Dialog */}
      {dialog === 'newFolder' && (
        <div className={styles.previewOverlay} onClick={() => setDialog('none')}>
          <div className={styles.previewWindow} onClick={e => e.stopPropagation()}>
            <div className={styles.previewTitleBar}>
              <span>New Folder</span>
              <button className={styles.previewCloseBtn} onClick={() => setDialog('none')}>X</button>
            </div>
            <div className={styles.dialogBody}>
              <div style={{ fontSize: 11, marginBottom: 4 }}>Folder name:</div>
              <input className={styles.dialogInput} value={dialogName} onChange={e => setDialogName(e.target.value)} placeholder="New Folder" autoFocus />
              <div className={styles.dialogButtons}>
                <button className={styles.actionButton} onClick={handleCreateFolder} disabled={!dialogName.trim()}>Create</button>
                <button className={styles.actionButton} onClick={() => setDialog('none')}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View File (system/read-only) */}
      {dialog === 'view' && editingFile && (
        <div className={styles.previewOverlay} onClick={() => setDialog('none')}>
          <div className={styles.previewWindow} onClick={e => e.stopPropagation()}>
            <div className={styles.previewTitleBar}>
              <span>{editingFile.name}</span>
              <button className={styles.previewCloseBtn} onClick={() => setDialog('none')}>X</button>
            </div>
            <div className={`${styles.previewContent} ${editingFile.name.includes('CORRUPTED') ? styles.corruptedText : ''}`}>
              {editingFile.content}
            </div>
          </div>
        </div>
      )}

      {/* Edit File */}
      {dialog === 'edit' && editingFile && (
        <div className={styles.previewOverlay} onClick={() => setDialog('none')}>
          <div className={styles.previewWindow} onClick={e => e.stopPropagation()} style={{ width: 500, maxHeight: 400 }}>
            <div className={styles.previewTitleBar}>
              <span>Edit: {editingFile.name}</span>
              <button className={styles.previewCloseBtn} onClick={() => setDialog('none')}>X</button>
            </div>
            <textarea className={styles.editArea} style={{ height: 250 }} value={dialogContent} onChange={e => setDialogContent(e.target.value)} />
            <div className={styles.dialogBody} style={{ padding: '4px 12px 8px' }}>
              <div className={styles.dialogButtons}>
                <button className={styles.actionButton} onClick={handleSaveFile}>Save</button>
                <button className={styles.actionButton} onClick={() => setDialog('none')}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className={styles.statusBar}>
        <span>{files.length} object(s) in {currentPath}</span>
        <span>Connected to The BackRoom™ Cloud</span>
      </div>
    </div>
  );
}
