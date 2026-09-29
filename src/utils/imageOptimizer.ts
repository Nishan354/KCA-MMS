/**
 * High-performance Image Optimizer & Compressor for Member Photos & Documents
 * Prevents localStorage QuotaExceededError by compressing high-res photos (2MB-25MB)
 * down to crisp, lightweight passport dimensions (~15KB - 30KB).
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 480,
  maxHeight: 600,
  quality: 0.82,
  format: 'image/jpeg',
};

/**
 * Optimizes an uploaded File object (from file input or drag-and-drop) to a lightweight DataURL.
 * Uses URL.createObjectURL for high-speed hardware-accelerated decoding without RAM spikes.
 */
export async function optimizeImageFile(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<{ dataUrl: string; originalSize: number; optimizedSize: number }> {
  const originalSize = file.size;

  return new Promise((resolve) => {
    // Helper to process loaded image on canvas
    const processImage = (img: HTMLImageElement) => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          fallbackWithFileReader();
          return;
        }

        const maxW = options.maxWidth || DEFAULT_OPTIONS.maxWidth || 480;
        const maxH = options.maxHeight || DEFAULT_OPTIONS.maxHeight || 600;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          fallbackWithFileReader();
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw solid white background in case transparent PNG/WEBP is converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const quality = options.quality ?? DEFAULT_OPTIONS.quality ?? 0.82;
        const format = options.format || 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(format, quality);

        const optimizedSize = Math.round((compressedDataUrl.length * 3) / 4);
        resolve({
          dataUrl: compressedDataUrl,
          originalSize,
          optimizedSize,
        });
      } catch (err) {
        console.warn('Canvas photo compression warning, falling back:', err);
        fallbackWithFileReader();
      }
    };

    // Fallback if canvas/objectURL encounters issues
    const fallbackWithFileReader = () => {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = (reader.result as string) || '';
        resolve({
          dataUrl: raw,
          originalSize,
          optimizedSize: Math.round((raw.length * 3) / 4),
        });
      };
      reader.onerror = () => {
        resolve({
          dataUrl: '',
          originalSize,
          optimizedSize: 0,
        });
      };
      reader.readAsDataURL(file);
    };

    // Direct object URL decoding
    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      objectUrl = null;
    }

    if (objectUrl) {
      const img = new Image();
      // DO NOT set crossOrigin on blob: URLs (causes CORS errors in desktop PWAs)
      img.onload = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        processImage(img);
      };
      img.onerror = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        fallbackWithFileReader();
      };
      img.src = objectUrl;
    } else {
      fallbackWithFileReader();
    }
  });
}

/**
 * Optimizes an existing base64 DataURL (scales down & compresses legacy large photos).
 */
export async function optimizeDataUrl(
  dataUrl: string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  // If not an image data url, return as is
  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  // If already lightweight (< 45KB base64), skip re-compression to save CPU
  if (dataUrl.length < 45000) {
    return dataUrl;
  }

  const { maxWidth, maxHeight, quality, format } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return new Promise((resolve) => {
    const img = new Image();
    // Only set crossOrigin for external http(s) URLs, NEVER for data: URLs
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width === 0 || height === 0) {
          resolve(dataUrl);
          return;
        }

        const maxW = maxWidth || 480;
        const maxH = maxHeight || 600;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw white background for transparent images converting to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL(format || 'image/jpeg', quality || 0.82);

        // If compressed version is smaller, return compressed; else keep original
        if (compressedDataUrl && compressedDataUrl.length < dataUrl.length) {
          resolve(compressedDataUrl);
        } else {
          resolve(dataUrl);
        }
      } catch (e) {
        console.warn('Image optimization canvas error, keeping original:', e);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Calculates current localStorage usage statistics
 */
export function getLocalStorageUsage(): {
  usedBytes: number;
  usedFormatted: string;
  totalEstimatedBytes: number;
  percentUsed: number;
  itemCount: number;
  isCritical: boolean;
} {
  let totalBytes = 0;
  let itemCount = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key) || '';
      totalBytes += (key.length + val.length) * 2; // UTF-16 characters = 2 bytes
      itemCount++;
    }
  } catch {}

  const totalEstimatedBytes = 5 * 1024 * 1024; // 5 MB typical browser quota
  const percentUsed = Math.min(100, Math.round((totalBytes / totalEstimatedBytes) * 100));
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);

  return {
    usedBytes: totalBytes,
    usedFormatted: `${usedMB} MB`,
    totalEstimatedBytes,
    percentUsed,
    itemCount,
    isCritical: percentUsed > 80,
  };
}
