import React, { useState, useEffect } from 'react';
import { InventoryItem, InventoryMovementLog, InventoryMovementType } from '../types/inventory';
import { X, ArrowRightLeft, Building2 } from 'lucide-react';

interface InventoryIssueModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  recordedByName: string;
  onClose: () => void;
  onConfirm: (
    updatedItem: InventoryItem,
    movementLog: InventoryMovementLog
  ) => void;
}

export const InventoryIssueModal: React.FC<InventoryIssueModalProps> = ({
  isOpen,
  item,
  recordedByName,
  onClose,
  onConfirm,
}) => {
  const [movementType, setMovementType] = useState<InventoryMovementType>('ISSUE');
  const [quantity, setQuantity] = useState(1);
  const [issuedToName, setIssuedToName] = useState('');
  const [issuedToContact, setIssuedToContact] = useState('');
  const [purposeOrEvent, setPurposeOrEvent] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [actionDate, setActionDate] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      setMovementType('ISSUE');
      setQuantity(1);
      setIssuedToName('');
      setIssuedToContact('');
      setPurposeOrEvent('');
      setExpectedReturnDate('');
      setRemarks('');
      setActionDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const maxAvailable = item.availableQuantity;
  const maxIssued = item.issuedQuantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    let newAvailable = item.availableQuantity;
    let newIssued = item.issuedQuantity;
    let newTotal = item.totalQuantity;
    let newStatus = item.status;

    if (movementType === 'ISSUE') {
      if (quantity > item.availableQuantity) return;
      newAvailable = item.availableQuantity - quantity;
      newIssued = item.issuedQuantity + quantity;
      newStatus = newAvailable === 0 ? 'Issued / In Use' : 'In Stock';
    } else if (movementType === 'RETURN') {
      if (quantity > item.issuedQuantity) return;
      newAvailable = item.availableQuantity + quantity;
      newIssued = item.issuedQuantity - quantity;
      newStatus = 'In Stock';
    } else if (movementType === 'RESTOCK') {
      newTotal = item.totalQuantity + quantity;
      newAvailable = item.availableQuantity + quantity;
    } else if (movementType === 'WRITE_OFF') {
      if (quantity > item.availableQuantity) return;
      newTotal = Math.max(0, item.totalQuantity - quantity);
      newAvailable = Math.max(0, item.availableQuantity - quantity);
      newStatus = newTotal === 0 ? 'Written Off' : item.status;
    } else if (movementType === 'MAINTENANCE_OUT') {
      if (quantity > item.availableQuantity) return;
      newAvailable = item.availableQuantity - quantity;
      newStatus = 'Under Maintenance';
    } else if (movementType === 'MAINTENANCE_IN') {
      newAvailable = item.availableQuantity + quantity;
      newStatus = 'In Stock';
    }

    const updatedItem: InventoryItem = {
      ...item,
      totalQuantity: newTotal,
      availableQuantity: newAvailable,
      issuedQuantity: newIssued,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    const movementLog: InventoryMovementLog = {
      id: `log-inv-${Date.now()}`,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      date: actionDate || new Date().toISOString().split('T')[0],
      type: movementType,
      quantity,
      unit: item.unit,
      issuedToName: issuedToName.trim() || undefined,
      issuedToContact: issuedToContact.trim() || undefined,
      purposeOrEvent: purposeOrEvent.trim() || undefined,
      expectedReturnDate: expectedReturnDate || undefined,
      recordedBy: recordedByName || 'Admin Officer',
      remarks: remarks.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onConfirm(updatedItem, movementLog);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-white">
                Item Movement: Issue &amp; Return Handover
              </h3>
              <p className="text-[11px] text-red-100 font-mono">{item.itemCode}</p>
            </div>
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
          {/* Target Item Card */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-1">
            <span className="font-bold text-slate-900 text-sm">{item.name}</span>
            <div className="flex items-center justify-between text-slate-600 mt-1">
              <span className="flex items-center gap-1 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-[#8b0000]" />
                {item.unit} Unit &bull; {item.category}
              </span>
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                Avail: <strong className="text-emerald-700">{item.availableQuantity}</strong> /{' '}
                {item.totalQuantity} {item.unitOfMeasure}
              </span>
            </div>
          </div>

          {/* Movement Type Select */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
              Movement Operation <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('ISSUE')}
                disabled={item.availableQuantity <= 0}
                className={`py-2 px-3 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  movementType === 'ISSUE'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                + Issue / Handover
              </button>

              <button
                type="button"
                onClick={() => setMovementType('RETURN')}
                disabled={item.issuedQuantity <= 0}
                className={`py-2 px-3 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  movementType === 'RETURN'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                ✓ Receive Return
              </button>

              <button
                type="button"
                onClick={() => setMovementType('RESTOCK')}
                className={`py-2 px-3 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  movementType === 'RESTOCK'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                + Restock / Add Qty
              </button>

              <button
                type="button"
                onClick={() => setMovementType('MAINTENANCE_OUT')}
                disabled={item.availableQuantity <= 0}
                className={`py-2 px-3 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  movementType === 'MAINTENANCE_OUT'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                🔧 Send to Repair
              </button>

              <button
                type="button"
                onClick={() => setMovementType('MAINTENANCE_IN')}
                className={`py-2 px-3 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  movementType === 'MAINTENANCE_IN'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                🔧 Return from Repair
              </button>

              <button
                type="button"
                onClick={() => setMovementType('WRITE_OFF')}
                disabled={item.availableQuantity <= 0}
                className={`py-2 px-3 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  movementType === 'WRITE_OFF'
                    ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                ✕ Scrap / Discard
              </button>
            </div>
          </div>

          {/* Date & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                Operation Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white font-mono outline-none focus:ring-1 focus:ring-[#8b0000]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                Quantity ({item.unitOfMeasure}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={
                  movementType === 'ISSUE' ||
                  movementType === 'WRITE_OFF' ||
                  movementType === 'MAINTENANCE_OUT'
                    ? maxAvailable
                    : movementType === 'RETURN'
                    ? maxIssued
                    : 9999
                }
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-bold bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
              />
            </div>
          </div>

          {/* Handover Details for ISSUE / RETURN */}
          {(movementType === 'ISSUE' || movementType === 'RETURN') && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    {movementType === 'ISSUE' ? 'Issued To (Recipient Name)' : 'Returned By'}
                  </label>
                  <input
                    type="text"
                    required
                    value={issuedToName}
                    onChange={(e) => setIssuedToName(e.target.value)}
                    placeholder="e.g. Sujith (Cultural Lead)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    Recipient Contact / Mobile
                  </label>
                  <input
                    type="text"
                    value={issuedToContact}
                    onChange={(e) => setIssuedToContact(e.target.value)}
                    placeholder="+971 50 000 0000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white font-mono outline-none focus:ring-1 focus:ring-[#8b0000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  Purpose / Event / Program Name
                </label>
                <input
                  type="text"
                  value={purposeOrEvent}
                  onChange={(e) => setPurposeOrEvent(e.target.value)}
                  placeholder="e.g. Onam Stage Rehearsal at Fujairah Community Hall"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
                />
              </div>

              {movementType === 'ISSUE' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white font-mono outline-none focus:ring-1 focus:ring-[#8b0000]"
                  />
                </div>
              )}
            </>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-[11px]">
              Remarks / Condition Checked
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Tested in working condition; flight case and 2 cables handed over"
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white outline-none focus:ring-1 focus:ring-[#8b0000]"
            />
          </div>

          {/* Footer buttons */}
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
              <ArrowRightLeft className="w-4 h-4" />
              <span>Confirm {movementType}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
