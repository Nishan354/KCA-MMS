import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

function expressApiPlugin() {
  return {
    name: 'express-api-plugin',
    async configureServer(server: any) {
      try {
        const expressModule = (await import('express')) as any;
        const express = expressModule.default || expressModule;
        const { apiRouter } = await import('./server/apiRouter.ts');
        const app = express();
        app.use(express.json({ limit: '500mb' }));
        app.use(express.urlencoded({ extended: true, limit: '500mb' }));
        app.use('/api', apiRouter);
        server.middlewares.use(app);
      } catch (e) {
        console.warn('Backend API dev server middleware not initialized:', e);
      }
    },
  };
}

function inlineCssAndElectronPlugin() {
  return {
    name: 'inline-css-electron-plugin',
    enforce: 'post' as const,
    generateBundle(_: any, bundle: any) {
      let cssContent = '';
      for (const [fileName, file] of Object.entries(bundle) as [string, any][]) {
        if (fileName.endsWith('.css') && file.type === 'asset' && typeof file.source === 'string') {
          cssContent += file.source + '\n';
        }
      }

      const htmlFile = bundle['index.html'];
      if (htmlFile && htmlFile.type === 'asset' && typeof htmlFile.source === 'string') {
        let html = htmlFile.source;
        // Strip crossorigin attributes from all tags to prevent CORS errors in Chromium on file://
        html = html.replace(/\s+crossorigin(=("[^"]*"|'[^']*'|[^\s>]+))?/gi, '');
        
        // Remove separate external CSS link tags to avoid failed file:// requests
        html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>\s*/gi, '');
        
        // Embed the compiled CSS directly into <style> inside <head>
        if (cssContent) {
          const styleTag = `<style id="kca-embedded-styles">\n${cssContent}\n</style>\n</head>`;
          html = html.replace('</head>', styleTag);
        }
        
        htmlFile.source = html;
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: './', // Crucial for Electron local file:// protocol and relative asset resolution
    plugins: [expressApiPlugin(), react(), tailwindcss(), inlineCssAndElectronPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
