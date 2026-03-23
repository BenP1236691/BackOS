import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import styles from './BackFilesExplorer.module.css';

interface Props {
  windowId: string;
}

interface FileEntry {
  name: string;
  type: 'file' | 'folder';
  size?: string;
  content?: string;
}

interface FolderNode {
  name: string;
  path: string;
  children?: FolderNode[];
  files: FileEntry[];
}

const getUsername = (user: { username: string } | null) => user?.username || 'wanderer';

const buildFileSystem = (username: string): FolderNode[] => [
  {
    name: 'BackOS',
    path: 'C:\\BackOS',
    files: [
      { name: 'system.ini', type: 'file', size: '1.2 KB', content: '[BackOS Configuration]\nversion=95.backrooms\ntheme=fluorescent_yellow\nexit_enabled=false\nentity_monitoring=ACTIVE\nwall_texture=damp_carpet\nhum_frequency=60Hz\n\n; Do not modify these values\n; The system knows what is best for you' },
      { name: 'autoexec.bat', type: 'file', size: '0.8 KB', content: '@echo off\necho Welcome to Back OS...\necho Initializing entity detection...\necho Loading fluorescent environment...\necho You are now in Level 0.\necho There is no exit command.\npause >nul' },
    ],
  },
  {
    name: 'Level_0',
    path: 'C:\\Level_0',
    files: [
      { name: 'safety_guide.txt', type: 'file', size: '2.1 KB', content: 'LEVEL 0 SAFETY GUIDE\n====================\n\n1. Stay in well-lit areas\n2. Do not investigate strange sounds\n3. The buzzing is normal\n4. If you see a door, do not open it\n5. If a door opens by itself, walk away slowly\n6. The wet carpet smell is permanent\n7. You are being watched. This is for your safety.\n8. Do not count the rooms. The number changes.\n9. If the lights flicker, stand still.\n10. There is no Level -1. Stop asking.' },
      { name: 'fluorescent_log.dat', type: 'file', size: '4.7 KB', content: 'FLUORESCENT LIGHT LOG - LEVEL 0\n================================\nTimestamp: [CORRUPTED]\nLight #00001: ACTIVE - 60Hz - Normal\nLight #00002: ACTIVE - 60Hz - Normal\nLight #00003: ACTIVE - 61Hz - WARNING\nLight #00004: ACTIVE - 60Hz - Normal\nLight #00005: INACTIVE - REPLACED\nLight #00006: ACTIVE - 60Hz - Normal\nLight #04571: ACTIVE - 60Hz - Normal\n...\nLight #99999: ACTIVE - 0Hz - [DATA EXPUNGED]\n\nNote: Light #00003 has been flagged.\nEntity presence suspected near fixture.\nDo not service. Do not approach.' },
    ],
  },
  {
    name: 'Level_1',
    path: 'C:\\Level_1',
    files: [
      { name: 'habitable_zones.map', type: 'file', size: '8.3 KB', content: 'HABITABLE ZONE MAP - LEVEL 1\n=============================\nZone A: Warehouse Section 1-47\n  Status: SAFE (last verified: ████)\n  Resources: Almond Water (limited)\n\nZone B: Storage Corridor\n  Status: CAUTION\n  Note: Entity sightings reported\n\nZone C: Loading Dock\n  Status: DANGER - DO NOT ENTER\n  Note: Last 3 explorers did not return\n\nZone D: [REDACTED]\n  Status: [REDACTED]\n  Note: This zone does not exist.\n        Please stop looking for it.' },
      { name: 'entity_warning.txt', type: 'file', size: '1.5 KB', content: 'ENTITY WARNING - LEVEL 1\n========================\nMultiple entity sightings confirmed.\n\nType: Hound\nLocation: Zone B, corridors 12-18\nBehavior: Patrolling\nThreat: HIGH\n\nType: Smiler\nLocation: Dark corners throughout\nBehavior: Waiting\nThreat: EXTREME\n\nREMINDER: If you see eyes in the\ndarkness, DO NOT smile back.' },
    ],
  },
  {
    name: 'Level_2',
    path: 'C:\\Level_2',
    files: [
      { name: 'pipe_system.schematic', type: 'file', size: '12.1 KB', content: 'PIPE SYSTEM SCHEMATIC - LEVEL 2\n================================\n     __|__|__|__|__\n    |  |  |  |  |  |\n====|==|==|==|==|==|====\n    |  |  |  |  |  |\n    |__|__|__|__|__|\n\nPipe Temperature: 47.3C (CAUTION)\nPipe Content: Unknown fluid\nPipe Sound: Rhythmic thumping\n\nWARNING: The pipes are not inanimate.\nThey respond to touch.\nDo not tap on them.\nDo not listen too closely.\nThe rhythm is not random.' },
      { name: 'ambient_noise.wav', type: 'file', size: '156 KB', content: '[AUDIO FILE]\nCannot display audio content.\n\nMetadata:\n  Duration: INFINITE\n  Sample Rate: 44100Hz\n  Channels: Unknown\n  Description: Ambient hum from Level 2\n\nWARNING: Prolonged listening may cause\ndisorientation, paranoia, and an\nunshakeable feeling of being followed.\n\nDo not use headphones.' },
    ],
  },
  {
    name: 'Entity_Data',
    path: 'C:\\Entity_Data',
    children: [
      {
        name: 'Smiler',
        path: 'C:\\Entity_Data\\Smiler',
        files: [
          { name: 'behavioral_patterns.dat', type: 'file', size: '3.4 KB', content: 'ENTITY 1: SMILER - BEHAVIORAL ANALYSIS\n=======================================\nClassification: Hostile\nHabitat: Dark areas, all levels\nIdentification: Luminescent eyes, wide grin\n\nBehavior Patterns:\n- Stationary until prey detected\n- Attracted to light sources\n- Attracted to eye contact\n- Will pursue if acknowledged\n\nMovement Speed: Unknown\nAttack Pattern: Unknown (no survivors)\nWeakness: Sustained light exposure\n\nNote from researcher:\n"I have been studying them for weeks.\nI think they know. Yesterday I found\nteeth marks on my notebook.\nI sleep with the lights on now.\nIt doesn\'t help. They smile in the light too."' },
          { name: 'avoidance_protocol.txt', type: 'file', size: '1.8 KB', content: 'SMILER AVOIDANCE PROTOCOL B-7\n==============================\n1. Maintain light sources at all times\n2. NEVER make direct eye contact\n3. If you see a grin in the darkness:\n   a. Do not acknowledge it\n   b. Slowly back away\n   c. Do not turn your back\n   d. Find a lit area immediately\n4. If cornered:\n   a. Close your eyes\n   b. Count to ten\n   c. Hope\n\nSurvival Rate: 23%\n\nAmendment: Survival rate may be\ninflated. We cannot verify because\nmost "survivors" refuse to speak\nabout what happened.' },
        ],
      },
      {
        name: 'Hound',
        path: 'C:\\Entity_Data\\Hound',
        files: [
          { name: 'tracking_data.dat', type: 'file', size: '2.9 KB', content: 'ENTITY CLASSIFICATION: HOUND\n=============================\nSpeed: Fast\nAggression: High when provoked\nSensory: Primarily auditory\n\nAvoidance: Remain silent.\nDo not run. Do not breathe loudly.\n\nLast known positions:\n  Level 1, Zone B: 3 confirmed\n  Level 2, Tunnel 7: 1 confirmed\n  Level 0, Room ████: [REDACTED]\n\nNote: Hounds hunt in packs.\nIf you see one, there are more.' },
        ],
      },
      {
        name: 'Skin-Stealer',
        path: 'C:\\Entity_Data\\Skin-Stealer',
        files: [
          { name: 'identification_guide.txt', type: 'file', size: '2.2 KB', content: 'ENTITY: SKIN-STEALER\n=====================\nDanger Level: EXTREME\n\nIdentification:\n- Appears human at first glance\n- Mimics voices of known individuals\n- Skin appears slightly translucent\n- Eyes do not reflect light correctly\n\nIf you encounter someone you know\nin the Backrooms, verify their identity.\n\nVerification Protocol:\n1. Ask something only they would know\n2. Watch for micro-expressions\n3. Check if their shadow matches\n4. If ANY doubt exists: RUN\n\nRemember: Your friend is not here.\nNobody you know is here.\nAnyone who claims otherwise is lying.' },
        ],
      },
    ],
    files: [],
  },
  {
    name: `Users`,
    path: `C:\\Users\\{username}`,
    files: [
      { name: 'exit_instructions_CORRUPTED.txt', type: 'file', size: '0.3 KB', content: 'T̸̢o̶ ̵e̵x̶i̸t̴ ̷t̷h̸e̷ ̷B̵a̴c̶k̸r̸o̸o̶m̴s̵,̷ ̴y̴o̸u̵ ̵m̷u̸s̶t̸:\n\n1̶.̸ ̷F̵i̸n̷d̵ ̵t̸h̵e̷ ̵d̷o̴o̶r̷ ̸t̵h̷a̸t̵ ̸d̴o̵e̵s̸n̵\'̷t̸ ̸b̶e̶l̸o̶n̷g̷\n2̸.̶ ̴T̶u̶r̶n̸ ̸t̵h̸e̶ ̸h̸a̸n̵d̵l̵e̸ ̶c̸o̷u̴n̸t̶e̵r̴-̷\n3̵.̵ ̵S̸a̷y̵ ̵t̵h̶e̸ ̵w̸o̶r̸d̷s̴ ̷"̵[̸C̸O̸R̶R̶U̶P̵T̸E̷D̶]̴"̸\n4̵.̵ ̶[̶D̵A̷T̷A̷ ̶L̸O̶S̸T̵]̷\n5̸.̵ ̶[̷D̵A̴T̸A̸ ̵L̷O̵S̸T̶]̸\n\nW̷A̵R̸N̷I̶N̸G̸:̷ ̸T̵h̷i̴s̶ ̸f̷i̸l̸e̷ ̴h̶a̴s̷ ̸b̷e̴e̶n̸\nc̵o̴r̶r̷u̸p̸t̸e̵d̷.̵ ̴P̷e̴r̶h̸a̷p̵s̷ ̴i̷n̵t̷e̵n̸t̵i̶o̸n̸a̸l̵l̵y̵.̴' },
      { name: 'journal_entry_01.txt', type: 'file', size: '1.6 KB', content: 'JOURNAL ENTRY #1\n=================\nDate: Unknown\nLevel: 0 (I think)\n\nI found this terminal today. It was just\nsitting in the middle of a room, glowing.\nThe screen said "Back OS" and played some\nkind of startup sound.\n\nI don\'t know how long I\'ve been here.\nThe fluorescent lights make it impossible\nto tell time. My watch stopped working\nthe moment I arrived.\n\nI tried the door at the end of the hall.\nIt led to another hall. And another.\nAnd another.\n\nThe carpet is always damp.\n\nI hear footsteps sometimes. But when I\nlook, there\'s no one there.\n\nI\'m going to try to use this computer to\nfind a way out. There has to be a map\nsomewhere. There has to be an exit.\n\nThere has to be.\n\n...\n\nRight?' },
    ],
  },
];

export default function BackFilesExplorer({ windowId }: Props) {
  const { state } = useAppContext();
  const username = getUsername(state.user);
  const fileSystem = buildFileSystem(username);

  const [currentPath, setCurrentPath] = useState('C:\\BackOS');
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);

  const findFolder = (nodes: FolderNode[], path: string): FolderNode | undefined => {
    for (const node of nodes) {
      const nodePath = node.path.replace('{username}', username);
      if (nodePath === path) return node;
      if (node.children) {
        const found = findFolder(node.children, path);
        if (found) return found;
      }
    }
    return undefined;
  };

  const currentFolder = findFolder(fileSystem, currentPath);
  const currentFiles = currentFolder?.files ?? [];
  const currentChildren = currentFolder?.children ?? [];

  const getAllFileCount = () => {
    let count = 0;
    const countFiles = (nodes: FolderNode[]) => {
      for (const n of nodes) {
        count += n.files.length;
        if (n.children) countFiles(n.children);
      }
    };
    countFiles(fileSystem);
    return count;
  };

  const renderTree = (nodes: FolderNode[], depth = 0) =>
    nodes.map((node) => {
      const nodePath = node.path.replace('{username}', username);
      return (
        <div key={nodePath}>
          <div
            className={`${styles.treeItem} ${currentPath === nodePath ? styles.treeItemActive : ''}`}
            onClick={() => setCurrentPath(nodePath)}
            style={{ paddingLeft: 4 + depth * 12 }}
          >
            <span className={styles.treeIcon}>
              {currentPath === nodePath ? '&#128194;' : '&#128193;'}
            </span>
            <span>{node.name === 'Users' ? username : node.name}</span>
          </div>
          {node.children && (
            <div>{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });

  const handleFileClick = (file: FileEntry) => {
    setSelectedFile(file);
  };

  const handleFileDoubleClick = (file: FileEntry) => {
    if (file.type === 'file' && file.content) {
      setPreviewFile(file);
    }
  };

  const handleFolderDoubleClick = (folder: FolderNode) => {
    const folderPath = folder.path.replace('{username}', username);
    setCurrentPath(folderPath);
  };

  const goUp = () => {
    const parts = currentPath.split('\\');
    if (parts.length > 2) {
      setCurrentPath(parts.slice(0, -1).join('\\'));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button className={styles.navButton} title="Back">{'<'}</button>
        <button className={styles.navButton} title="Forward">{'>'}</button>
        <button className={styles.navButton} title="Up" onClick={goUp}>{'...'}</button>
        <input
          className={styles.addressBar}
          value={currentPath}
          onChange={(e) => setCurrentPath(e.target.value)}
          readOnly
        />
      </div>

      <div className={styles.body}>
        <div className={styles.sidebar}>
          {renderTree(fileSystem)}
        </div>

        <div className={styles.fileList}>
          {currentChildren.map((child) => {
            const childPath = child.path.replace('{username}', username);
            return (
              <div
                key={childPath}
                className={styles.fileItem}
                onDoubleClick={() => handleFolderDoubleClick(child)}
              >
                <span className={styles.fileIcon}>&#128193;</span>
                <span className={styles.fileName}>{child.name}</span>
              </div>
            );
          })}
          {currentFiles.map((file) => (
            <div
              key={file.name}
              className={`${styles.fileItem} ${selectedFile?.name === file.name ? styles.fileItemSelected : ''}`}
              onClick={() => handleFileClick(file)}
              onDoubleClick={() => handleFileDoubleClick(file)}
            >
              <span className={styles.fileIcon}>
                {file.name.endsWith('.wav') ? '&#127925;' : file.name.endsWith('.dat') ? '&#128202;' : file.name.endsWith('.map') || file.name.endsWith('.schematic') ? '&#128506;' : '&#128196;'}
              </span>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>{file.size}</span>
            </div>
          ))}
        </div>
      </div>

      {previewFile && (
        <div className={styles.previewOverlay} onClick={() => setPreviewFile(null)}>
          <div className={styles.previewWindow} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewTitleBar}>
              <span>{previewFile.name}</span>
              <button className={styles.previewCloseBtn} onClick={() => setPreviewFile(null)}>X</button>
            </div>
            <div className={`${styles.previewContent} ${previewFile.name.includes('CORRUPTED') ? styles.corruptedText : ''}`}>
              {previewFile.content}
            </div>
          </div>
        </div>
      )}

      <div className={styles.statusBar}>
        <span>{currentFiles.length + currentChildren.length} object(s) | {getAllFileCount()} total files</span>
        <span>Connected to The BackRoom&trade; Cloud</span>
      </div>
    </div>
  );
}
