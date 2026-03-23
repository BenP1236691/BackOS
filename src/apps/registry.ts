import type { AppDefinition } from '../store/types';

export const APP_REGISTRY: AppDefinition[] = [
  {
    id: 'backnet-explorer',
    name: 'BackNET Explorer™',
    icon: '🌐',
    defaultWidth: 800,
    defaultHeight: 550,
    showOnDesktop: true,
  },
  {
    id: 'backcode-studio',
    name: 'BackCode Studio™',
    icon: '💻',
    defaultWidth: 700,
    defaultHeight: 500,
    showOnDesktop: true,
  },
  {
    id: 'backfiles-explorer',
    name: 'BackFiles Explorer™',
    icon: '📁',
    defaultWidth: 650,
    defaultHeight: 450,
    showOnDesktop: true,
  },
  {
    id: 'back-office',
    name: 'Back Office 365™',
    icon: '📄',
    defaultWidth: 750,
    defaultHeight: 500,
    showOnDesktop: true,
  },
  {
    id: 'backmail',
    name: 'BackMail™',
    icon: '📧',
    defaultWidth: 700,
    defaultHeight: 480,
    showOnDesktop: true,
  },
  {
    id: 'backstore',
    name: 'BackStore™',
    icon: '🎮',
    defaultWidth: 650,
    defaultHeight: 500,
    showOnDesktop: true,
  },
  {
    id: 'drawback',
    name: 'Draw.back™',
    icon: '🎨',
    defaultWidth: 640,
    defaultHeight: 480,
    showOnDesktop: true,
  },
  {
    id: 'john-backrooms',
    name: 'John Backrooms™',
    icon: '🤖',
    defaultWidth: 500,
    defaultHeight: 450,
    showOnDesktop: true,
  },
  {
    id: 'backnet-deploy',
    name: 'BackNET Deploy™',
    icon: '🚀',
    defaultWidth: 850,
    defaultHeight: 550,
    showOnDesktop: true,
  },
];

export function getAppDef(appId: string): AppDefinition | undefined {
  return APP_REGISTRY.find(a => a.id === appId);
}
