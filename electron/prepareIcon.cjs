// Helper to ensure build/icon.ico is properly prepared for electron-builder
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

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

const targetIco = path.join(buildDir, 'icon.ico');
const targetPng = path.join(buildDir, 'icon.png');

if (foundIcon) {
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

// Helper to calculate CRC32 for PNG chunks
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(len + 12);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crcTarget = buf.subarray(4, len + 8);
  const crcVal = crc32(crcTarget);
  buf.writeUInt32BE(crcVal, len + 8);
  return buf;
}

// Generate high-resolution 256x256 circular emblem PNG with KCA maroon & gold motif
function generateKcaPngBuffer(size = 256) {
  const width = size;
  const height = size;
  const rowLen = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLen);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.48;
  const innerR = width * 0.44;
  const coreR = width * 0.32;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= outerR) {
        if (dist > innerR) {
          // Gold border (#f59e0b)
          rawData[pxOffset] = 245;
          rawData[pxOffset + 1] = 158;
          rawData[pxOffset + 2] = 11;
          rawData[pxOffset + 3] = 255;
        } else if (dist > coreR) {
          // Deep Crimson Maroon (#881337)
          rawData[pxOffset] = 136;
          rawData[pxOffset + 1] = 19;
          rawData[pxOffset + 2] = 55;
          rawData[pxOffset + 3] = 255;
        } else {
          // Central Ruby Sunburst (#991b1b)
          rawData[pxOffset] = 153;
          rawData[pxOffset + 1] = 27;
          rawData[pxOffset + 2] = 27;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Transparent outside
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Generate valid standard Windows ICO format embedding the 256x256 PNG
function generateIcoFromPng(pngBuf) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(1, 4); // 1 image

  const dirEntry = Buffer.alloc(16);
  dirEntry[0] = 0; // Width (0 = 256)
  dirEntry[1] = 0; // Height (0 = 256)
  dirEntry[2] = 0; // Color palette count
  dirEntry[3] = 0; // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(pngBuf.length, 8); // Image byte size
  dirEntry.writeUInt32LE(22, 12); // Offset to image data (6 + 16 = 22)

  return Buffer.concat([header, dirEntry, pngBuf]);
}

// If icon.png or icon.ico still doesn't exist, generate standard official KCA icon
if (!fs.existsSync(targetPng) || !fs.existsSync(targetIco)) {
  try {
    const pngBuf = generateKcaPngBuffer(256);
    if (!fs.existsSync(targetPng)) {
      fs.writeFileSync(targetPng, pngBuf);
      console.log('[Icon Setup] Created official high-res build/icon.png');
    }
    if (!fs.existsSync(targetIco)) {
      const icoBuf = generateIcoFromPng(pngBuf);
      fs.writeFileSync(targetIco, icoBuf);
      console.log('[Icon Setup] Created official Windows build/icon.ico');
    }
  } catch (err) {
    console.warn('[Icon Setup] Auto-generation notice:', err.message);
  }
}
