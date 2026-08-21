import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
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

// Initialize Supabase Client safely
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://jvwetoapdaxuweannrgq.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

let supabase: any = null;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
} catch (e) {
  console.warn('Supabase client failed to initialize on server:', e);
}

// Sync Endpoints
app.get('/api/sync/version', async (_req, res) => {
  try {
    if (!supabase) {
      return res.status(200).json({ version: 1, status: 'ok' });
    }
    const { data } = await supabase
      .from('app_state')
      .select('version, updated_at')
      .order('version', { ascending: false })
      .limit(1);

    const version = data && data[0] ? Number(data[0].version) : 1;
    const updatedAt = data && data[0] ? data[0].updated_at : new Date().toISOString();
    return res.status(200).json({ version, updatedAt, status: 'ok' });
  } catch {
    return res.status(200).json({ version: 1, status: 'ok' });
  }
});

app.get('/api/sync/state', async (_req, res) => {
  try {
    if (!supabase) {
      return res.status(200).json({ status: 'success', data: null });
    }
    const { data, error } = await supabase
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
    if (!supabase) {
      return res.status(200).json({ status: 'success', data: req.body });
    }
    const body = req.body || {};
    const { data, error } = await supabase.from('app_state').upsert(
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
  console.log(`Server running on port ${PORT}`);
});
