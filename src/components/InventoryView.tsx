import React, { useState, useMemo } from 'react';
import {
  InventoryItem,
  InventoryMovementLog,
  INVENTORY_CATEGORIES,
} from '../types/inventory';
import { UserSession, hasAdminPrivilege, isUnitOperatorRole } from '../types/member';
import { exportInventoryCsv } from '../utils/inventoryStorage';
import { formatAED, formatDate } from '../utils/idGenerator';
import {
  Package,
  Boxes,
  CheckCircle2,
  ArrowRightLeft,
  Search,
  PlusCircle,
  Download,
  Edit2,
  Trash2,
  Building2,
  History,
  Tag,
  ArrowUpDown,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InventoryViewProps {
  items: InventoryItem[];
  movementLogs: InventoryMovementLog[];
  units: string[];
  userSession: UserSession | null;
  onOpenAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onOpenIssueModal: (item: InventoryItem) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  movementLogs,
  units,
  userSession,
  onOpenAddItem,
  onEditItem,
  onDeleteItem,
  onOpenIssueModal,
}) => {
  const isAdmin = !userSession || hasAdminPrivilege(userSession.role);
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);
  const assignedUnit = userSession?.unit;

  const [activeSubTab, setActiveSubTab] = useState<'items' | 'logs'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>(
    isUnitOp && assignedUnit ? assignedUnit : 'ALL'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'itemCode' | 'name' | 'availableQuantity' | 'purchaseDate'>('itemCode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtered items based on unit scoping & user filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Unit scoping for operators
      if (isUnitOp && assignedUnit) {
        if (item.unit.toLowerCase().trim() !== assignedUnit.toLowerCase().trim()) {
          return false;
        }
      }

      if (selectedUnit !== 'ALL' && item.unit.toLowerCase() !== selectedUnit.toLowerCase()) {
        return false;
      }

      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = (item.itemCode || '').toLowerCase().includes(q);
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        const matchesLoc = (item.location || '').toLowerCase().includes(q);
        const matchesCust = (item.custodianName || '').toLowerCase().includes(q);
        const matchesNotes = (item.notes || '').toLowerCase().includes(q);
        return matchesCode || matchesName || matchesCat || matchesLoc || matchesCust || matchesNotes;
      }

      return true;
    });
  }, [items, isUnitOp, assignedUnit, selectedUnit, selectedCategory, selectedStatus, searchQuery]);

  // Sort items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'availableQuantity') {
        return sortOrder === 'asc' ? a.availableQuantity - b.availableQuantity : b.availableQuantity - a.availableQuantity;
      }

      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortField, sortOrder]);

  // Scoped metrics
  const scopedItems = useMemo(() => {
    if (isUnitOp && assignedUnit) {
      return items.filter((i) => i.unit.toLowerCase().trim() === assignedUnit.toLowerCase().trim());
    }
    return items;
  }, [items, isUnitOp, assignedUnit]);

  const totalAssetCount = scopedItems.reduce((sum, i) => sum + i.totalQuantity, 0);
  const totalAvailableCount = scopedItems.reduce((sum, i) => sum + i.availableQuantity, 0);
  const totalIssuedCount = scopedItems.reduce((sum, i) => sum + i.issuedQuantity, 0);
  const totalValuationAED = scopedItems.reduce((sum, i) => sum + (i.purchasePriceAED || 0), 0);

  // Filtered movement logs
  const filteredLogs = useMemo(() => {
    return movementLogs.filter((log) => {
      if (isUnitOp && assignedUnit) {
        if (log.unit.toLowerCase().trim() !== assignedUnit.toLowerCase().trim()) {
          return false;
        }
      }

      if (selectedUnit !== 'ALL' && log.unit.toLowerCase() !== selectedUnit.toLowerCase()) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = (log.itemCode || '').toLowerCase().includes(q);
        const matchesName = (log.itemName || '').toLowerCase().includes(q);
        const matchesTo = (log.issuedToName || '').toLowerCase().includes(q);
        const matchesPurp = (log.purposeOrEvent || '').toLowerCase().includes(q);
        return matchesCode || matchesName || matchesTo || matchesPurp;
      }

      return true;
    });
  }, [movementLogs, isUnitOp, assignedUnit, selectedUnit, searchQuery]);

  const handleSort = (field: 'itemCode' | 'name' | 'availableQuantity' | 'purchaseDate') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExportCsv = () => {
    exportInventoryCsv(sortedItems, `KCA_Inventory_${selectedUnit}_${new Date().toISOString().split('T')[0]}.csv`);
    confetti({ particleCount: 35, spread: 60 });
  };

  return (
    <div className="space-y-6 pb-16 antialiased">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg text-white"
              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
            >
              <Boxes className="w-5 h-5 text-amber-300" />
            </span>
            <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">
              Inventory &amp; Asset Management
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Track equipment, stage &amp; audio setups, cultural props, chairs, banners, and issue/return logs across KCA units.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenAddItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            style={{ backgroundColor: 'var(--color-primary, #881337)' }}
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>+ Add Asset / Item</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Assets Qty
            </span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-slate-900 mt-2">
            {totalAssetCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Across {scopedItems.length} catalog items
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Available in Stock
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-emerald-700 mt-2">
            {totalAvailableCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Ready for event deployment
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Issued / In-Use
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <ArrowRightLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-amber-600 mt-2">
            {totalIssuedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Handed over to teams &amp; programs
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Asset Value
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Tag className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl mt-2" style={{ color: 'var(--color-primary, #881337)' }}>
            {formatAED(totalValuationAED)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Estimated capital asset value
          </div>
        </div>
      </div>

      {/* Sub Tabs: Asset Catalog vs Movement / Handover History */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('items')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'items'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Asset Catalog ({sortedItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'logs'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Issue &amp; Handover Logs ({filteredLogs.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Asset Code, Equipment name, Category, Custodian, Location..."
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {INVENTORY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Unit */}
            {!isUnitOp && (
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white outline-none cursor-pointer"
              >
                <option value="ALL">All Units</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u} Unit
                  </option>
                ))}
                <option value="Central Secretariat">Central Secretariat</option>
              </select>
            )}

            {/* Status */}
            {activeSubTab === 'items' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Issued / In Use">Issued / In Use</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Written Off">Written Off</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* SUB TAB 1: Asset Catalog Table */}
      {activeSubTab === 'items' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider select-none">
                <tr>
                  <th
                    onClick={() => handleSort('itemCode')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Item Code</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Item / Equipment Details</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5">Category &amp; Unit</th>
                  <th
                    onClick={() => handleSort('availableQuantity')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Availability / Stock</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5">Condition &amp; Custodian</th>
                  <th className="p-3.5 text-right">Value (AED)</th>
                  <th className="p-3.5 text-center">Handover &amp; Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      No inventory assets match your selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item) => {
                    const isAvailable = item.availableQuantity > 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Item Code */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                            {item.itemCode}
                          </span>
                        </td>

                        {/* Item Details & Location */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 leading-snug">
                            {item.name}
                          </div>
                          {item.location && (
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <span className="font-semibold text-slate-700">Loc:</span> {item.location}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-[10px] text-slate-400 italic mt-0.5">
                              {item.notes}
                            </div>
                          )}
                        </td>

                        {/* Category & Unit */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{item.category}</div>
                          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" style={{ color: 'var(--color-primary, #881337)' }} />
                            <span>{item.unit} Unit</span>
                          </div>
                        </td>

                        {/* Stock & Quantities */}
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className={`font-bold font-mono text-xs px-2 py-0.5 rounded ${
                                isAvailable
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {item.availableQuantity} Avail
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              / {item.totalQuantity} {item.unitOfMeasure}
                            </span>
                          </div>
                          {item.issuedQuantity > 0 && (
                            <div className="text-[10px] text-amber-700 font-bold mt-1">
                              ({item.issuedQuantity} issued to event)
                            </div>
                          )}
                        </td>

                        {/* Condition & Custodian */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.condition === 'Excellent'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.condition === 'Good'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.condition}
                          </span>
                          {item.custodianName && (
                            <div className="text-[11px] text-slate-700 font-medium mt-1">
                              👤 {item.custodianName}
                            </div>
                          )}
                        </td>

                        {/* Value AED */}
                        <td className="p-3.5 whitespace-nowrap text-right font-mono font-bold text-slate-800">
                          {item.purchasePriceAED ? formatAED(item.purchasePriceAED) : '—'}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onOpenIssueModal(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
                              title="Issue or Return Equipment"
                            >
                              <ArrowRightLeft className="w-3 h-3 text-amber-300" />
                              <span>Handover</span>
                            </button>

                            <button
                              onClick={() => onEditItem(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit Asset Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to remove item "${item.name}"?`)) {
                                    onDeleteItem(item.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Asset Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 2: Movement Logs Table */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Operation</th>
                  <th className="p-3.5">Asset / Item</th>
                  <th className="p-3.5">Qty &amp; Unit</th>
                  <th className="p-3.5">Recipient / Event Program</th>
                  <th className="p-3.5">Recorded By &amp; Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      No handover movement logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date */}
                      <td className="p-3.5 whitespace-nowrap font-mono font-medium text-slate-700">
                        {formatDate(log.date)}
                      </td>

                      {/* Operation Badge */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.type === 'ISSUE'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : log.type === 'RETURN'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : log.type === 'RESTOCK'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>

                      {/* Item */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{log.itemName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{log.itemCode}</div>
                      </td>

                      {/* Qty & Unit */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 font-mono">
                          {log.quantity} units
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold">{log.unit} Unit</div>
                      </td>

                      {/* Recipient & Event */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">
                          {log.issuedToName || 'Internal Transfer'}
                        </div>
                        {log.purposeOrEvent && (
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            🎯 {log.purposeOrEvent}
                          </div>
                        )}
                        {log.expectedReturnDate && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5 font-mono">
                            Due by: {formatDate(log.expectedReturnDate)}
                          </div>
                        )}
                      </td>

                      {/* Recorded By */}
                      <td className="p-3.5">
                        <div className="text-slate-700 font-medium">{log.recordedBy}</div>
                        {log.remarks && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            "{log.remarks}"
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
