import React, { useState, useEffect } from 'react';
import {
  InventoryItem,
  InventoryItemCategory,
  InventoryItemCondition,
  InventoryItemStatus,
  INVENTORY_CATEGORIES,
} from '../types/inventory';
import { generateNextItemCode } from '../utils/inventoryStorage';
import { X, Save, Package, Building2 } from 'lucide-react';

interface InventoryItemModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  existingItems?: InventoryItem[];
  itemsList?: InventoryItem[];
  units: string[];
  lockedUnit?: string;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  isOpen,
  item,
  existingItems,
  itemsList,
  units,
  lockedUnit,
  onClose,
  onSave,
}) => {
  const isEditing = !!item;
  const allExistingItems = itemsList || existingItems || [];

  const [itemCode, setItemCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItemCategory>('Audio & Sound Equipment');
  const [unit, setUnit] = useState(lockedUnit || units[0] || 'Fujairah');
  const [location, setLocation] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [availableQuantity, setAvailableQuantity] = useState(1);
  const [issuedQuantity, setIssuedQuantity] = useState(0);
  const [unitOfMeasure, setUnitOfMeasure] = useState('Pieces');
  const [condition, setCondition] = useState<InventoryItemCondition>('Good');
  const [status, setStatus] = useState<InventoryItemStatus>('In Stock');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePriceAED, setPurchasePriceAED] = useState<number | ''>('');
  const [custodianName, setCustodianName] = useState('');
  const [custodianPhone, setCustodianPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [lastAuditedDate, setLastAuditedDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setItemCode(item.itemCode);
        setName(item.name);
        setCategory(item.category);
        setUnit(lockedUnit || item.unit);
        setLocation(item.location || '');
        setTotalQuantity(item.totalQuantity);
        setAvailableQuantity(item.availableQuantity);
        setIssuedQuantity(item.issuedQuantity);
        setUnitOfMeasure(item.unitOfMeasure || 'Pieces');
        setCondition(item.condition);
        setStatus(item.status);
        setPurchaseDate(item.purchaseDate || '');
        setPurchasePriceAED(item.purchasePriceAED !== undefined ? item.purchasePriceAED : '');
        setCustodianName(item.custodianName || '');
        setCustodianPhone(item.custodianPhone || '');
        setNotes(item.notes || '');
        setLastAuditedDate(item.lastAuditedDate || '');
      } else {
        const targetUnit = lockedUnit || units[0] || 'Fujairah';
        setItemCode(generateNextItemCode(allExistingItems, targetUnit));
        setName('');
        setCategory('Audio & Sound Equipment');
        setUnit(targetUnit);
        setLocation('');
        setTotalQuantity(1);
        setAvailableQuantity(1);
        setIssuedQuantity(0);
        setUnitOfMeasure('Pieces');
        setCondition('Excellent');
        setStatus('In Stock');
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setPurchasePriceAED('');
        setCustodianName('');
        setCustodianPhone('');
        setNotes('');
        setLastAuditedDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, item, existingItems, itemsList, units, lockedUnit]);

  // Sync available quantity when total quantity changes
  const handleTotalQtyChange = (newTotal: number) => {
    const total = Math.max(0, newTotal);
    setTotalQuantity(total);
    const available = Math.max(0, total - issuedQuantity);
    setAvailableQuantity(available);
  };

  const handleIssuedQtyChange = (newIssued: number) => {
    const issued = Math.max(0, newIssued);
    setIssuedQuantity(issued);
    const available = Math.max(0, totalQuantity - issued);
    setAvailableQuantity(available);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedItem: InventoryItem = {
      id: item ? item.id : `inv-${Date.now()}`,
      itemCode: itemCode.trim() || generateNextItemCode(allExistingItems, unit),
      name: name.trim(),
      category,
      unit,
      location: location.trim(),
      totalQuantity: Number(totalQuantity) || 1,
      availableQuantity: Number(availableQuantity) || 0,
      issuedQuantity: Number(issuedQuantity) || 0,
      unitOfMeasure: unitOfMeasure.trim() || 'Pieces',
      condition,
      status,
      purchaseDate: purchaseDate || undefined,
      purchasePriceAED: purchasePriceAED === '' ? 0 : Number(purchasePriceAED),
      custodianName: custodianName.trim() || undefined,
      custodianPhone: custodianPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      lastAuditedDate: lastAuditedDate || undefined,
      createdAt: item ? item.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(savedItem);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-300" />
            <h3 className="font-display font-bold text-base text-white">
              {isEditing ? 'Edit Inventory Asset' : 'Add New Inventory Asset / Item'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Item Code, Category, Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">
                Asset / Item Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
                placeholder="e.g. KCA-INV-FUJ-001"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InventoryItemCategory)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white font-medium outline-none focus:ring-1 focus:ring-[#8b0000]"
              >
                {INVENTORY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">
                KCA Unit <span className="text-red-500">*</span>
              </label>
              {lockedUnit ? (
                <div className="px-3 py-2 border border-slate-200 rounded-md bg-slate-100 text-slate-800 font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#8b0000]" />
                  <span>{lockedUnit} Unit (Assigned)</span>
                </div>
              ) : (
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white font-medium outline-none focus:ring-1 focus:ring-[#8b0000]"
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u} Unit
                    </option>
                  ))}
                  <option value="Central Secretariat">Central Secretariat</option>
                </select>
              )}
            </div>
          </div>

          {/* Row 2: Item Name */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">
              Item / Equipment Name &amp; Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-bold bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
              placeholder="e.g. Yamaha 16-Channel Audio Mixing Console with Flight Case"
            />
          </div>

          {/* Row 3: Location / Storage Place */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">
              Storage Location / Shelf / Cabinet
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
              placeholder="e.g. Fujairah Central Office - AV Storage Room Cabinet A"
            />
          </div>

          {/* Row 4: Quantities & UOM */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                Total Qty <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={totalQuantity}
                onChange={(e) => handleTotalQtyChange(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-slate-900 font-bold bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                Issued / In-Use Qty
              </label>
              <input
                type="number"
                min="0"
                max={totalQuantity}
                value={issuedQuantity}
                onChange={(e) => handleIssuedQtyChange(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-slate-900 font-bold bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                Available Qty
              </label>
              <input
                type="number"
                disabled
                value={availableQuantity}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-emerald-700 font-black bg-emerald-50 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                Unit of Measure
              </label>
              <select
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-slate-900 bg-white font-medium outline-none focus:ring-1 focus:ring-[#8b0000]"
              >
                <option value="Pieces">Pieces</option>
                <option value="Sets">Sets</option>
                <option value="Boxes">Boxes</option>
                <option value="Pairs">Pairs</option>
                <option value="Meters">Meters</option>
                <option value="Units">Units</option>
              </select>
            </div>
          </div>

          {/* Row 5: Condition, Status, Purchase Date, Price */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as InventoryItemCondition)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white font-medium outline-none focus:ring-1 focus:ring-[#8b0000]"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Needs Repair">Needs Repair</option>
                <option value="Damaged / Discarded">Damaged / Discarded</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InventoryItemStatus)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white font-medium outline-none focus:ring-1 focus:ring-[#8b0000]"
              >
                <option value="In Stock">In Stock</option>
                <option value="Issued / In Use">Issued / In Use</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Written Off">Written Off</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                Cost / Value (AED)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={purchasePriceAED}
                onChange={(e) =>
                  setPurchasePriceAED(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-bold bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Row 6: Custodian Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                Custodian / Responsible Person
              </label>
              <input
                type="text"
                value={custodianName}
                onChange={(e) => setCustodianName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
                placeholder="e.g. Sound Convener / Secretary"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                Custodian Phone / UAE Mobile
              </label>
              <input
                type="text"
                value={custodianPhone}
                onChange={(e) => setCustodianPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white font-mono outline-none focus:ring-1 focus:ring-[#8b0000]"
                placeholder="+971 50 000 0000"
              />
            </div>
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-[11px]">
              Notes / Inclusions / Serial Numbers
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
              placeholder="e.g. Includes 4 connecting cables, flight case, and power adapter"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#8b0000] hover:bg-[#730000] text-white font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Save Asset Changes' : 'Save New Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
