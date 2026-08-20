export type InventoryItemCategory =
  | 'Audio & Sound Equipment'
  | 'Stage, Lighting & Electrical'
  | 'Furniture, Chairs & Tables'
  | 'Banners, Backdrops & Flags'
  | 'Printing, ID Card Cards & Badges'
  | 'Sports & Athletic Equipment'
  | 'Kitchen, Catering & Dining'
  | 'Office, Stationery & IT Assets'
  | 'Cultural Costumes & Props'
  | 'Miscellaneous Equipment';

export type InventoryItemCondition = 'Excellent' | 'Good' | 'Fair' | 'Needs Repair' | 'Damaged / Discarded';

export type InventoryItemStatus = 'In Stock' | 'Issued / In Use' | 'Under Maintenance' | 'Written Off';

export interface InventoryItem {
  id: string;
  itemCode: string; // e.g. KCA-INV-FUJ-001
  name: string; // Item Name
  category: InventoryItemCategory;
  unit: string; // e.g. Fujairah, Kalba, Khorfakhan, Dibba, Central
  location: string; // Specific storage room / cupboard / stage / office location
  totalQuantity: number;
  availableQuantity: number;
  issuedQuantity: number;
  unitOfMeasure: string; // Pieces, Sets, Boxes, Meters, etc.
  condition: InventoryItemCondition;
  status: InventoryItemStatus;
  purchaseDate?: string; // YYYY-MM-DD
  purchasePriceAED?: number;
  custodianName?: string; // Person currently responsible (e.g. Stage Convener)
  custodianPhone?: string;
  notes?: string;
  qrCodeValue?: string;
  lastAuditedDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export type InventoryMovementType = 'ISSUE' | 'RETURN' | 'MAINTENANCE_OUT' | 'MAINTENANCE_IN' | 'RESTOCK' | 'WRITE_OFF';

export interface InventoryMovementLog {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  date: string; // YYYY-MM-DD
  type: InventoryMovementType;
  quantity: number;
  unit: string;
  issuedToName?: string; // Member or Event coordinator
  issuedToContact?: string;
  purposeOrEvent?: string; // e.g. Onam Celebration Stage Program, Football Tournament
  expectedReturnDate?: string;
  actualReturnDate?: string;
  recordedBy: string; // User who recorded the transaction
  remarks?: string;
  createdAt: string;
}

export const INVENTORY_CATEGORIES: InventoryItemCategory[] = [
  'Audio & Sound Equipment',
  'Stage, Lighting & Electrical',
  'Furniture, Chairs & Tables',
  'Banners, Backdrops & Flags',
  'Printing, ID Card Cards & Badges',
  'Sports & Athletic Equipment',
  'Kitchen, Catering & Dining',
  'Office, Stationery & IT Assets',
  'Cultural Costumes & Props',
  'Miscellaneous Equipment',
];
