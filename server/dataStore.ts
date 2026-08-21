import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'kca_cloud_database.json');

export interface CloudDatabaseState {
  version: number;
  lastUpdated: string;
  lastUpdatedBy: string;
  members: any[];
  financeTransactions: any[];
  inventoryItems: any[];
  inventoryLogs: any[];
  classes: any[];
  classParticipants: any[];
  classAttendance: any[];
  adminAccounts: any[];
  auditLogs: any[];
  units: string[];
  customFields: any[];
  customLogoUrl?: string | null;
}

// Fallback seed data
import { INITIAL_MEMBERS, INITIAL_ADMIN_ACCOUNTS, INITIAL_AUDIT_LOGS, INITIAL_CUSTOM_FIELDS, INITIAL_UNITS } from '../src/data/initialData.ts';
import { INITIAL_FINANCE_TRANSACTIONS } from '../src/data/initialFinanceData.ts';
import { INITIAL_INVENTORY_ITEMS, INITIAL_INVENTORY_LOGS } from '../src/data/initialInventoryData.ts';
import { INITIAL_CLASSES, INITIAL_PARTICIPANTS, INITIAL_ATTENDANCE } from '../src/data/initialClassesData.ts';

function getInitialState(): CloudDatabaseState {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    lastUpdatedBy: 'System Bootstrapper',
    members: INITIAL_MEMBERS || [],
    financeTransactions: INITIAL_FINANCE_TRANSACTIONS || [],
    inventoryItems: INITIAL_INVENTORY_ITEMS || [],
    inventoryLogs: INITIAL_INVENTORY_LOGS || [],
    classes: INITIAL_CLASSES || [],
    classParticipants: INITIAL_PARTICIPANTS || [],
    classAttendance: INITIAL_ATTENDANCE || [],
    adminAccounts: INITIAL_ADMIN_ACCOUNTS || [],
    auditLogs: INITIAL_AUDIT_LOGS || [],
    units: INITIAL_UNITS || ['Fujairah', 'Kalba', 'Khorfakhan', 'Dibba', 'Central'],
    customFields: INITIAL_CUSTOM_FIELDS || [],
    customLogoUrl: null,
  };
}

let inMemoryState: CloudDatabaseState | null = null;
const sseClients: Array<(data: string) => void> = [];

export function subscribeToSyncEvents(listener: (data: string) => void): () => void {
  sseClients.push(listener);
  return () => {
    const idx = sseClients.indexOf(listener);
    if (idx >= 0) sseClients.splice(idx, 1);
  };
}

export function broadcastSyncEvent(eventType: string, payload: any) {
  const customMessage = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  const defaultMessage = `data: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client(customMessage);
      client(defaultMessage);
    } catch {
      // client disconnected
    }
  });
}

export function loadDatabase(): CloudDatabaseState {
  if (inMemoryState) {
    return inMemoryState;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      // Backwards compatibility filling for new entities
      inMemoryState = {
        ...getInitialState(),
        ...loaded,
        members: Array.isArray(loaded.members) ? loaded.members : INITIAL_MEMBERS,
        financeTransactions: Array.isArray(loaded.financeTransactions) ? loaded.financeTransactions : INITIAL_FINANCE_TRANSACTIONS,
        inventoryItems: Array.isArray(loaded.inventoryItems) ? loaded.inventoryItems : INITIAL_INVENTORY_ITEMS,
        inventoryLogs: Array.isArray(loaded.inventoryLogs) ? loaded.inventoryLogs : INITIAL_INVENTORY_LOGS,
        classes: Array.isArray(loaded.classes) ? loaded.classes : INITIAL_CLASSES,
        classParticipants: Array.isArray(loaded.classParticipants) ? loaded.classParticipants : INITIAL_PARTICIPANTS,
        classAttendance: Array.isArray(loaded.classAttendance) ? loaded.classAttendance : INITIAL_ATTENDANCE,
        adminAccounts: Array.isArray(loaded.adminAccounts) ? loaded.adminAccounts : INITIAL_ADMIN_ACCOUNTS,
        units: Array.isArray(loaded.units) && loaded.units.length > 0 ? loaded.units : INITIAL_UNITS,
        customFields: Array.isArray(loaded.customFields) && loaded.customFields.length > 0 ? loaded.customFields : INITIAL_CUSTOM_FIELDS,
      };
      return inMemoryState!;
    }
  } catch (err) {
    console.error('[CloudDatabase] Error loading database file, initializing fresh:', err);
  }

  inMemoryState = getInitialState();
  saveDatabase(inMemoryState);
  return inMemoryState;
}

export function saveDatabase(state: CloudDatabaseState): void {
  inMemoryState = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CloudDatabase] Failed to write database file to disk:', err);
  }
}

export function updateEntity(
  entity:
    | 'members'
    | 'finance'
    | 'inventory'
    | 'inventoryLogs'
    | 'classes'
    | 'classParticipants'
    | 'classAttendance'
    | 'accounts'
    | 'audit'
    | 'units'
    | 'customFields'
    | 'customLogo'
    | 'all',
  data: any,
  user: string = 'KCA System'
): CloudDatabaseState {
  const current = loadDatabase();
  const nextVersion = (current.version || 0) + 1;
  const now = new Date().toISOString();

  let updatedState: CloudDatabaseState = {
    ...current,
    version: nextVersion,
    lastUpdated: now,
    lastUpdatedBy: user,
  };

  switch (entity) {
    case 'members':
      updatedState.members = Array.isArray(data) ? data : current.members;
      break;
    case 'finance':
      updatedState.financeTransactions = Array.isArray(data) ? data : current.financeTransactions;
      break;
    case 'inventory':
      updatedState.inventoryItems = Array.isArray(data) ? data : current.inventoryItems;
      break;
    case 'inventoryLogs':
      updatedState.inventoryLogs = Array.isArray(data) ? data : current.inventoryLogs;
      break;
    case 'classes':
      updatedState.classes = Array.isArray(data) ? data : current.classes;
      break;
    case 'classParticipants':
      updatedState.classParticipants = Array.isArray(data) ? data : current.classParticipants;
      break;
    case 'classAttendance':
      updatedState.classAttendance = Array.isArray(data) ? data : current.classAttendance;
      break;
    case 'accounts':
      updatedState.adminAccounts = Array.isArray(data) ? data : current.adminAccounts;
      break;
    case 'audit':
      updatedState.auditLogs = Array.isArray(data) ? data : current.auditLogs;
      break;
    case 'units':
      updatedState.units = Array.isArray(data) ? data : current.units;
      break;
    case 'customFields':
      updatedState.customFields = Array.isArray(data) ? data : current.customFields;
      break;
    case 'customLogo':
      updatedState.customLogoUrl = typeof data === 'string' ? data : null;
      break;
    case 'all':
      updatedState = {
        ...current,
        ...data,
        version: nextVersion,
        lastUpdated: now,
        lastUpdatedBy: user,
      };
      break;
  }

  saveDatabase(updatedState);

  // Broadcast to all active browser sessions & devices in real-time
  broadcastSyncEvent('SYNC_UPDATE', {
    version: updatedState.version,
    lastUpdated: updatedState.lastUpdated,
    lastUpdatedBy: updatedState.lastUpdatedBy,
    entity,
    data,
  });

  return updatedState;
}
