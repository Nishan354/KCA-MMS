import { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import {
  loadDatabase,
  saveDatabase,
  updateEntity,
  subscribeToSyncEvents,
} from './dataStore.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_CONFIG_PATH = path.resolve(process.cwd(), '.supabase_runtime_config.json');

// Initialize runtime Supabase state
let runtimeSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://jvwetoapdaxuweannrgq.supabase.co';

let runtimeSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

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

let serverSupabaseClient: any = null;

function initServerSupabase() {
  try {
    if (
      runtimeSupabaseUrl &&
      runtimeSupabaseAnonKey &&
      !runtimeSupabaseAnonKey.includes('placeholder') &&
      runtimeSupabaseAnonKey.length > 20
    ) {
      serverSupabaseClient = createClient(runtimeSupabaseUrl, runtimeSupabaseAnonKey, {
        auth: { persistSession: false },
      });
    } else {
      serverSupabaseClient = null;
    }
  } catch {
    serverSupabaseClient = null;
  }
}

initServerSupabase();

export const apiRouter = Router();

// 0. Supabase Global Configuration Endpoints
apiRouter.get('/config/supabase', (_req: Request, res: Response) => {
  const isConfigured = Boolean(
    runtimeSupabaseUrl &&
    runtimeSupabaseAnonKey &&
    !runtimeSupabaseAnonKey.includes('placeholder') &&
    runtimeSupabaseAnonKey.length > 20
  );

  res.json({
    url: runtimeSupabaseUrl,
    anonKey: runtimeSupabaseAnonKey,
    isConfigured,
    projectId: runtimeSupabaseUrl ? runtimeSupabaseUrl.replace(/^https?:\/\//, '').split('.')[0] : '',
  });
});

apiRouter.post('/config/supabase', (req: Request, res: Response) => {
  try {
    const { url, anonKey } = req.body || {};
    if (!url || !anonKey) {
      res.status(400).json({ error: 'URL and Anon Key are required' });
      return;
    }

    runtimeSupabaseUrl = url.trim();
    runtimeSupabaseAnonKey = anonKey.trim();

    try {
      fs.writeFileSync(
        SERVER_CONFIG_PATH,
        JSON.stringify({ url: runtimeSupabaseUrl, anonKey: runtimeSupabaseAnonKey, updatedAt: new Date().toISOString() }),
        'utf-8'
      );
    } catch (fsErr) {
      console.warn('Could not write server config file:', fsErr);
    }

    initServerSupabase();

    res.json({
      success: true,
      url: runtimeSupabaseUrl,
      isConfigured: true,
      message: 'Supabase configuration saved and propagated to all devices.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update server configuration' });
  }
});

// 1. Full Database Snapshot (Seamless master state for all users and devices)
apiRouter.get('/sync/state', async (req: Request, res: Response) => {
  try {
    const db = loadDatabase();

    // If server supabase is configured, attempt to sync latest if higher version exists
    if (serverSupabaseClient) {
      try {
        const { data } = await serverSupabaseClient
          .from('app_state')
          .select('*')
          .order('version', { ascending: false })
          .limit(1);

        if (data && data.length > 0 && data[0].payload) {
          const row = data[0];
          const cloudPayload = row.payload;
          if (row.version && row.version > db.version) {
            db.version = row.version;
            db.lastUpdated = row.updated_at || db.lastUpdated;
            if (Array.isArray(cloudPayload.members) && cloudPayload.members.length > 0) db.members = cloudPayload.members;
            if (Array.isArray(cloudPayload.financeTransactions)) db.financeTransactions = cloudPayload.financeTransactions;
            if (Array.isArray(cloudPayload.inventoryItems)) db.inventoryItems = cloudPayload.inventoryItems;
            if (Array.isArray(cloudPayload.classes)) db.classes = cloudPayload.classes;
            if (Array.isArray(cloudPayload.classParticipants)) db.classParticipants = cloudPayload.classParticipants;
            if (Array.isArray(cloudPayload.classAttendance)) db.classAttendance = cloudPayload.classAttendance;
            if (Array.isArray(cloudPayload.adminAccounts) && cloudPayload.adminAccounts.length > 0) db.adminAccounts = cloudPayload.adminAccounts;
            if (Array.isArray(cloudPayload.auditLogs)) db.auditLogs = cloudPayload.auditLogs;
            saveDatabase(db);
          }
        }
      } catch {}
    }

    res.json({
      success: true,
      ...db,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Ultra-lightweight Version Check (for low-bandwidth polling from multiple devices)
apiRouter.get('/sync/version', (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    res.json({
      success: true,
      version: db.version,
      lastUpdated: db.lastUpdated,
      lastUpdatedBy: db.lastUpdatedBy,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Real-time Server-Sent Events (SSE) stream for instant push across all devices & locations
apiRouter.get('/sync/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial ping with current version
  const db = loadDatabase();
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ version: db.version, lastUpdated: db.lastUpdated })}\n\n`);

  const unsubscribe = subscribeToSyncEvents((data) => {
    res.write(data);
  });

  // Keep connection alive with heartbeat ping every 25 seconds
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(pingInterval);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(pingInterval);
    unsubscribe();
  });
});

// 4. Push Entity Change
apiRouter.post('/sync/push', async (req: Request, res: Response) => {
  try {
    const { entity, data, user, payload, version } = req.body || {};
    const entityToUpdate = entity || 'all';
    const dataToUpdate = data !== undefined ? data : payload;

    const updated = updateEntity(entityToUpdate, dataToUpdate, user || 'KCA Portal User');

    // Async push to Supabase if connected
    if (serverSupabaseClient) {
      serverSupabaseClient
        .from('app_state')
        .upsert(
          {
            id: 'kca_main',
            entity: entityToUpdate,
            payload: updated,
            version: updated.version,
            updated_by: user || 'KCA Portal User',
            updated_at: updated.lastUpdated,
          },
          { onConflict: 'id' }
        )
        .then(() => {})
        .catch(() => {});
    }

    res.json({
      success: true,
      version: updated.version,
      lastUpdated: updated.lastUpdated,
      lastUpdatedBy: updated.lastUpdatedBy,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Direct Members REST Endpoints
apiRouter.get('/members/verify/:query', (req: Request, res: Response) => {
  try {
    const rawQuery = decodeURIComponent(req.params.query || '').trim();
    if (!rawQuery) {
      res.status(400).json({ success: false, error: 'Query parameter required' });
      return;
    }
    const db = loadDatabase();
    const queryLower = rawQuery.toLowerCase();
    const queryAlnum = queryLower.replace(/[^a-z0-9]/g, '');
    const queryDigits = rawQuery.replace(/\D/g, '');

    let found = db.members.find((m: any) => {
      const mId = (m.membershipId || '').trim().toLowerCase();
      const mIdAlnum = mId.replace(/[^a-z0-9]/g, '');
      if (mId === queryLower || (queryAlnum.length >= 3 && mIdAlnum === queryAlnum)) return true;
      if ((m.id || '').toLowerCase() === queryLower) return true;
      return false;
    });

    if (!found && queryDigits.length >= 5) {
      found = db.members.find((m: any) => {
        const uae = (m.phoneUAE || '').replace(/\D/g, '');
        const wa = (m.whatsapp || '').replace(/\D/g, '');
        const alt = (m.emergencyContactPhone || '').replace(/\D/g, '');
        if (uae && (uae === queryDigits || uae.endsWith(queryDigits) || queryDigits.endsWith(uae))) return true;
        if (wa && (wa === queryDigits || wa.endsWith(queryDigits) || queryDigits.endsWith(wa))) return true;
        if (alt && (alt === queryDigits || alt.endsWith(queryDigits) || queryDigits.endsWith(alt))) return true;
        return false;
      });
    }

    if (found) {
      res.json({ success: true, member: found, customLogoUrl: db.customLogoUrl || null });
    } else {
      res.status(404).json({ success: false, error: 'Member not found', customLogoUrl: db.customLogoUrl || null });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/members', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json({ success: true, count: db.members.length, data: db.members });
});

apiRouter.post('/members', (req: Request, res: Response) => {
  try {
    const newMember = req.body;
    const db = loadDatabase();
    const existingIndex = db.members.findIndex((m) => m.id === newMember.id || m.membershipId === newMember.membershipId);
    let updatedMembers = [...db.members];
    if (existingIndex >= 0) {
      updatedMembers[existingIndex] = newMember;
    } else {
      updatedMembers = [newMember, ...updatedMembers];
    }
    const updated = updateEntity('members', updatedMembers, newMember.recordedBy || 'Admin Desk');
    res.json({ success: true, version: updated.version, member: newMember });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Direct Finance REST Endpoints
apiRouter.get('/finance', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json({ success: true, count: db.financeTransactions.length, data: db.financeTransactions });
});

apiRouter.post('/finance', (req: Request, res: Response) => {
  try {
    const newTx = req.body;
    const db = loadDatabase();
    const existingIndex = db.financeTransactions.findIndex((t) => t.id === newTx.id);
    let updatedTx = [...db.financeTransactions];
    if (existingIndex >= 0) {
      updatedTx[existingIndex] = newTx;
    } else {
      updatedTx = [newTx, ...updatedTx];
    }
    const updated = updateEntity('finance', updatedTx, newTx.recordedBy || 'Finance Desk');
    res.json({ success: true, version: updated.version, transaction: newTx });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Direct Inventory REST Endpoints
apiRouter.get('/inventory', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json({ success: true, count: db.inventoryItems.length, data: db.inventoryItems });
});

apiRouter.post('/inventory', (req: Request, res: Response) => {
  try {
    const newItem = req.body;
    const db = loadDatabase();
    const existingIndex = db.inventoryItems.findIndex((i) => i.id === newItem.id);
    let updatedItems = [...db.inventoryItems];
    if (existingIndex >= 0) {
      updatedItems[existingIndex] = newItem;
    } else {
      updatedItems = [newItem, ...updatedItems];
    }
    const updated = updateEntity('inventory', updatedItems, 'Inventory Desk');
    res.json({ success: true, version: updated.version, item: newItem });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Direct Classes REST Endpoints
apiRouter.get('/classes', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json({ success: true, classes: db.classes, participants: db.classParticipants, attendance: db.classAttendance });
});

// 9. Restore Full Backup
apiRouter.post('/sync/restore', (req: Request, res: Response) => {
  try {
    const { members, auditLogs, finance, inventory, classes, participants, attendance, accounts, units, customFields, user } = req.body;
    const current = loadDatabase();
    const nextVersion = (current.version || 0) + 1;
    const now = new Date().toISOString();

    const restoredState = {
      ...current,
      version: nextVersion,
      lastUpdated: now,
      lastUpdatedBy: user || 'Backup Restorer',
      members: Array.isArray(members) ? members : current.members,
      auditLogs: Array.isArray(auditLogs) ? auditLogs : current.auditLogs,
      financeTransactions: Array.isArray(finance) ? finance : current.financeTransactions,
      inventoryItems: Array.isArray(inventory) ? inventory : current.inventoryItems,
      classes: Array.isArray(classes) ? classes : current.classes,
      classParticipants: Array.isArray(participants) ? participants : current.classParticipants,
      classAttendance: Array.isArray(attendance) ? attendance : current.classAttendance,
      adminAccounts: Array.isArray(accounts) ? accounts : current.adminAccounts,
      units: Array.isArray(units) ? units : current.units,
      customFields: Array.isArray(customFields) ? customFields : current.customFields,
    };

    saveDatabase(restoredState);
    res.json({ success: true, version: restoredState.version });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
