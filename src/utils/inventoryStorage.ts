import { InventoryItem, InventoryMovementLog } from '../types/inventory';
import { INITIAL_INVENTORY_ITEMS, INITIAL_INVENTORY_LOGS } from '../data/initialInventoryData';

const STORAGE_KEY_INVENTORY = 'kca_fujairah_inventory_items_v1';
const STORAGE_KEY_INVENTORY_LOGS = 'kca_fujairah_inventory_logs_v1';

export function saveInventoryItems(items: InventoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save inventory items:', error);
  }
}

export function loadInventoryItems(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVENTORY);
    if (!raw) return INITIAL_INVENTORY_ITEMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_INVENTORY_ITEMS;
  } catch {
    return INITIAL_INVENTORY_ITEMS;
  }
}

export function saveInventoryLogs(logs: InventoryMovementLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_INVENTORY_LOGS, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save inventory logs:', error);
  }
}

export function loadInventoryLogs(): InventoryMovementLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVENTORY_LOGS);
    if (!raw) return INITIAL_INVENTORY_LOGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_INVENTORY_LOGS;
  } catch {
    return INITIAL_INVENTORY_LOGS;
  }
}

export function generateNextItemCode(items: InventoryItem[] = [], unit: string = 'Fujairah'): string {
  const safeItems = Array.isArray(items) ? items : [];
  const cleanUnit = (unit || 'FUJ').substring(0, 3).toUpperCase();
  const count = safeItems.length + 1;
  const seq = String(count).padStart(3, '0');
  return `KCA-INV-${cleanUnit}-${seq}`;
}

export function exportInventoryCsv(items: InventoryItem[], filename = 'KCA_Inventory_Assets.csv'): void {
  const headers = [
    'Item Code',
    'Item Name',
    'Category',
    'Unit',
    'Location',
    'Total Qty',
    'Available Qty',
    'Issued Qty',
    'Unit of Measure',
    'Condition',
    'Status',
    'Purchase Date',
    'Purchase Price (AED)',
    'Custodian Name',
    'Custodian Phone',
    'Last Audited Date',
    'Notes',
  ];

  const rows = items.map((item) => [
    `"${item.itemCode}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.category}"`,
    `"${item.unit}"`,
    `"${(item.location || '').replace(/"/g, '""')}"`,
    item.totalQuantity,
    item.availableQuantity,
    item.issuedQuantity,
    `"${item.unitOfMeasure}"`,
    `"${item.condition}"`,
    `"${item.status}"`,
    `"${item.purchaseDate || ''}"`,
    item.purchasePriceAED || 0,
    `"${(item.custodianName || '').replace(/"/g, '""')}"`,
    `"${(item.custodianPhone || '').replace(/"/g, '""')}"`,
    `"${item.lastAuditedDate || ''}"`,
    `"${(item.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 100);
}
