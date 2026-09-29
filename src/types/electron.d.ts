/**
 * TypeScript definitions for Electron Desktop Environment Bridge
 */
export interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  versions: {
    electron: string;
    chrome: string;
    node: string;
  };
  print?: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
