// Electron Preload Script for KCA-MMS Desktop Application
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected capabilities to the renderer window
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  print: () => {
    window.print();
  },
});
