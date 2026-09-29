// Inventory & Asset Management Types for KCA-MMS

export type ItemCondition = 'New' | 'Excellent' | 'Good' | 'Fair' | 'Needs Repair' | 'Damaged' | 'Retired';
export type InventoryItemCondition = ItemCondition;
export type InventoryItemCategory = string;
export type InventoryItemStatus = 'In Stock' | 'Partially Issued' | 'Fully Issued' | 'Under Maintenance' | 'Decommissioned';
export type InventoryMovementType = 'ISSUE' | 'RETURN' | 'RESTOCK' | 'AUDIT' | 'DAMAGED' | 'DISPOSAL' | 'IN' | 'OUT' | string;

export const INVENTORY_CATEGORIES = [
  'Audio & Visual Equipment',
  'Musical Instruments',
  'Costumes & Stage Props',
  'Office Furniture & Fixtures',
  'IT & Computing Devices',
  'Sports & Fitness Gear',
  'Kitchen & Catering Supplies',
  'Books & Library Archive',
  'Banners, Mementos & Awards',
  'General Supplies',
] as const;

export interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  quantity?: number;
  totalQuantity?: number;
  availableQuantity: number;
  issuedQuantity?: number;
  unitOfMeasure?: string;
  unit: string;
  location: string;
  condition: ItemCondition;
  status?: InventoryItemStatus | string;
  purchaseDate?: string;
  purchaseCostAED?: number;
  purchasePriceAED?: number;
  lastAuditedDate?: string;
  custodianName?: string;
  custodianPhone?: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InventoryIssueLog {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  issuedToName: string;
  issuedToPhone: string;
  issuedToMemberId?: string;
  quantityIssued: number;
  issueDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  status: 'Issued' | 'Returned' | 'Overdue' | 'Lost';
  issuedBy: string;
  receivedBy?: string;
  purpose?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryMovementLog {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  type: InventoryMovementType;
  quantity: number;
  date: string;
  unit?: string;
  issuedToName?: string;
  issuedToPhone?: string;
  issuedToContact?: string;
  purposeOrEvent?: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  status?: string;
  recordedBy?: string;
  performedBy?: string;
  remarks?: string;
  notes?: string;
  createdAt: string;
}
