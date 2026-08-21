import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Set CORS headers manually
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, apikey');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

// Mock Sync Endpoints
app.get('/api/sync/version', (_req, res) => {
  res.status(200).json({ version: 1, status: 'ok' });
});

app.get('/api/sync/events', (_req, res) => {
  res.status(200).json({ events: [], status: 'ok' });
});

app.get('/api/sync/state', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('gallery').select('*');
    if (error) return res.status(200).json({ status: 'success', data: [] });
    return res.status(200).json({ status: 'success', data });
  } catch {
    return res.status(200).json({ status: 'success', data: [] });
  }
});

app.post('/api/sync/push', async (req, res) => {
  try {
    const { data, error } = await supabase.from('gallery').insert([req.body]);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ status: 'success', data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));