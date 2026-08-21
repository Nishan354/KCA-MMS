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
  console.warn('Supabase client failed to initialize:', e);
}

// Sync Endpoints
app.get('/api/sync/version', (_req, res) => {
  res.status(200).json({ version: 1, status: 'ok' });
});

app.get('/api/sync/events', (_req, res) => {
  res.status(200).json({ events: [], status: 'ok' });
});

app.get('/api/sync/state', async (_req, res) => {
  try {
    if (!supabase) {
      return res.status(200).json({ status: 'success', data: null });
    }
    const { data, error } = await supabase.from('gallery').select('*');
    if (error) return res.status(200).json({ status: 'success', data: [] });
    return res.status(200).json({ status: 'success', data });
  } catch {
    return res.status(200).json({ status: 'success', data: [] });
  }
});

app.post('/api/sync/push', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(200).json({ status: 'success', data: req.body });
    }
    const { data, error } = await supabase.from('gallery').insert([req.body]);
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
