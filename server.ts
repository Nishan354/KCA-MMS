import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, apikey');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Persistent server config file path
const SERVER_CONFIG_PATH = path.join(__dirname, '.supabase_runtime_config.json');

// Initialize server-side Supabase credentials
let runtimeSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://jvwetoapdaxuweannrgq.supabase.co';

let runtimeSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

// Try to load cached config from disk if available
try {
  if (fs.existsSync(SERVER_CONFIG_PATH)) {
    const raw = fs.readFileSync(SERVER_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.url && parsed.anonKey) {
      runtimeSupabaseUrl = parsed.url;
      runtimeSupabaseAnonKey = parsed.anonKey;
    }
  }
} catch (e) {
  console.warn('Failed to read server config file:', e);
}

let supabaseClient: any = null;

function initServerSupabaseClient() {
  try {
    if (runtimeSupabaseUrl && runtimeSupabaseAnonKey && !runtimeSupabaseAnonKey.includes('placeholder')) {
      supabaseClient = createClient(runtimeSupabaseUrl, runtimeSupabaseAnonKey, {
        auth: { persistSession: false },
      });
    } else {
      supabaseClient = null;
    }
  } catch (e) {
    console.warn('Supabase client failed to initialize on server:', e);
    supabaseClient = null;
  }
}

initServerSupabaseClient();

// Configuration Endpoints for Multi-Device Auto Sync
app.get('/api/config/supabase', (_req, res) => {
  const isConfigured = Boolean(
    runtimeSupabaseUrl &&
    runtimeSupabaseAnonKey &&
    !runtimeSupabaseAnonKey.includes('placeholder')
  );

  return res.status(200).json({
    url: runtimeSupabaseUrl,
    anonKey: runtimeSupabaseAnonKey,
    isConfigured,
    projectId: runtimeSupabaseUrl ? runtimeSupabaseUrl.replace(/^https?:\/\//, '').split('.')[0] : '',
  });
});

app.post('/api/config/supabase', (req, res) => {
  try {
    const { url, anonKey } = req.body || {};
    if (!url || !anonKey) {
      return res.status(400).json({ error: 'URL and Anon Key are required' });
    }

    runtimeSupabaseUrl = url.trim();
    runtimeSupabaseAnonKey = anonKey.trim();

    // Persist to server config file
    try {
      fs.writeFileSync(
        SERVER_CONFIG_PATH,
        JSON.stringify({ url: runtimeSupabaseUrl, anonKey: runtimeSupabaseAnonKey, updatedAt: new Date().toISOString() }),
        'utf-8'
      );
    } catch (fsErr) {
      console.warn('Could not write server config file (continuing in-memory):', fsErr);
    }

    initServerSupabaseClient();

    console.log(`[Server] Supabase config updated globally for all devices: ${runtimeSupabaseUrl}`);
    return res.status(200).json({
      success: true,
      url: runtimeSupabaseUrl,
      isConfigured: true,
      message: 'Supabase configuration saved and propagated to all devices.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update server configuration' });
  }
});

// Sync Endpoints
app.get('/api/sync/version', async (_req, res) => {
  try {
    if (!supabaseClient) {
      return res.status(200).json({ version: 1, status: 'ok', serverClientReady: false });
    }
    const { data } = await supabaseClient
      .from('app_state')
      .select('version, updated_at')
      .order('version', { ascending: false })
      .limit(1);

    const version = data && data[0] ? Number(data[0].version) : 1;
    const updatedAt = data && data[0] ? data[0].updated_at : new Date().toISOString();
    return res.status(200).json({ version, updatedAt, status: 'ok', serverClientReady: true });
  } catch {
    return res.status(200).json({ version: 1, status: 'ok' });
  }
});

app.get('/api/sync/state', async (_req, res) => {
  try {
    if (!supabaseClient) {
      return res.status(200).json({ status: 'success', data: null, message: 'Server supabase not configured' });
    }
    const { data, error } = await supabaseClient
      .from('app_state')
      .select('*')
      .order('version', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return res.status(200).json({ status: 'success', data: null });
    }
    return res.status(200).json({ status: 'success', data: data[0] });
  } catch (err: any) {
    return res.status(200).json({ status: 'success', data: null, error: err.message });
  }
});

app.post('/api/sync/push', async (req, res) => {
  try {
    if (!supabaseClient) {
      return res.status(200).json({ status: 'success', data: req.body, warning: 'Supabase client not active' });
    }
    const body = req.body || {};
    const { data, error } = await supabaseClient.from('app_state').upsert(
      {
        id: body.id || 'kca_main',
        entity: body.entity || 'all',
        payload: body.payload || body,
        version: Number(body.version || 1),
        updated_by: body.updated_by || 'Server API',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ status: 'success', data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Serve static assets from Vite build in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA client routing
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('KCA Membership Management Server Active');
    }
  });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`KCA Server running on port ${PORT}`);
});
