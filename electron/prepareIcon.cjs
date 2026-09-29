// Helper to ensure build/icon.ico is properly prepared for electron-builder
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Check for user-provided manual icons in the build folder
const candidates = [
  'icon.ico',
  'app-icon.ico',
  'app.ico',
  'kca.ico',
  'favicon.ico',
  'icon.png',
  'app-icon.png',
  'app.png',
  'logo.png',
  'kca.png'
];

let foundIcon = null;
for (const file of candidates) {
  const fullPath = path.join(buildDir, file);
  if (fs.existsSync(fullPath)) {
    foundIcon = fullPath;
    break;
  }
}

// If an icon was found and icon.ico doesn't exist yet, ensure icon.ico / icon.png is linked
if (foundIcon) {
  const targetIco = path.join(buildDir, 'icon.ico');
  const targetPng = path.join(buildDir, 'icon.png');
  
  if (foundIcon.endsWith('.ico') && !fs.existsSync(targetIco)) {
    try {
      fs.copyFileSync(foundIcon, targetIco);
      console.log(`[Icon Setup] Copied ${path.basename(foundIcon)} -> build/icon.ico`);
    } catch {}
  } else if (foundIcon.endsWith('.png') && !fs.existsSync(targetPng)) {
    try {
      fs.copyFileSync(foundIcon, targetPng);
      console.log(`[Icon Setup] Copied ${path.basename(foundIcon)} -> build/icon.png`);
    } catch {}
  }
}
