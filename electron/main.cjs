// Electron Main Process for KCA-MMS Windows / Offline Desktop App
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Allow local files to load resources and bypass CORS for offline packaged desktop apps
app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch('allow-file-access-from-files');

let mainWindow = null;

// Resolve custom application icon from build/ folder or fallback
function getAppIcon() {
  const iconCandidates = [
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../build/app-icon.ico'),
    path.join(__dirname, '../build/app-icon.png'),
    path.join(__dirname, '../build/app.ico'),
    path.join(__dirname, '../build/app.png'),
    path.join(__dirname, '../build/favicon.ico'),
    path.join(__dirname, '../build/favicon.png'),
    path.join(__dirname, '../dist/favicon.ico'),
  ];
  for (const candidate of iconCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function createWindow() {
  const appIcon = getAppIcon();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'KCA-MMS - Kairali Cultural Association Fujairah',
    icon: appIcon,
    backgroundColor: '#f5f5f4',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
    autoHideMenuBar: false,
  });

  const distIndexPath = path.join(__dirname, '../dist/index.html');
  const isDev = process.env.ELECTRON_DEV === 'true' || (process.env.NODE_ENV === 'development' && !app.isPackaged);

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (fs.existsSync(distIndexPath)) {
    // Standard production local file loading
    mainWindow.loadFile(distIndexPath);
  } else {
    // Dev server fallback
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      mainWindow.loadFile(distIndexPath).catch((err) => {
        console.error('Failed to load application:', err);
      });
    });
  }

  // Intercept external links and open them in the user's default system browser (e.g. WhatsApp, Email, Docs)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith('http:') ||
      url.startsWith('https:') ||
      url.startsWith('mailto:') ||
      url.startsWith('tel:') ||
      url.startsWith('https://wa.me/')
    ) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Build standard desktop menu with shortcuts
function setupMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Print Member ID Card / Receipt',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.print();
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'KCA-MMS Portal Info',
          click: async () => {
            await shell.openExternal('https://kcafujairah.com');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  setupMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
