import { Request, Response, Router } from 'express';
import {
  loadDatabase,
  saveDatabase,
  updateEntity,
  subscribeToSyncEvents,
} from './dataStore.ts';

export const apiRouter = Router();

// 1. Full Database Snapshot
apiRouter.get('/sync/state', (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
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

// 3. Real-time Server-Sent Events (SSE) stream for instant push across all 5 devices & locations
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
apiRouter.post('/sync/push', (req: Request, res: Response) => {
  try {
    const { entity, data, user } = req.body;
    if (!entity) {
      res.status(400).json({ success: false, error: 'Missing entity type' });
      return;
    }

    const updated = updateEntity(entity, data, user || 'KCA Portal User');
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
