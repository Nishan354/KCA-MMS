import React, { useState, useMemo } from 'react';
import { Member, CustomFieldDefinition, UserSession } from '../types/member';
import { downloadMembershipReportPdf, exportMembersToCsv, ReportFilterOptions } from '../utils/pdfGenerator';
import { formatAED, formatDate, formatCardBloodGroup } from '../utils/idGenerator';
import {
  FileText,
  Download,
  Filter,
  Printer,
  Table,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  HeartPulse,
  CreditCard,
  X,
  Layers,
  FileSpreadsheet,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  units: string[];
  userSession?: UserSession;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  members,
  units,
  userSession,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedBlood, setSelectedBlood] = useState<string>('All');
  const [selectedPayment, setSelectedPayment] = useState<string>('All');
  const [dateRange, setDateRange] = useState<'all' | '30days' | 'this_year' | 'last_year'>('all');

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // If logged in as Unit Data Operator, restrict default unit filter
  const isUnitOperator = userSession?.role === 'Unit Data Operator';
  const defaultUserUnit = isUnitOperator ? userSession.unit : undefined;

  // Filtered members calculation
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Unit filter
      const unitTarget = isUnitOperator && defaultUserUnit ? defaultUserUnit : selectedUnit;
      if (unitTarget !== 'All' && m.unit !== unitTarget) return false;

      // Type filter
      if (selectedType !== 'All' && m.membershipType !== selectedType) return false;

      // Category filter
      if (selectedCategory !== 'All' && m.registrationCategory !== selectedCategory) return false;

      // Status filter
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Active' && m.status !== 'Active') return false;
        if (selectedStatus === 'Inactive' && m.status !== 'Inactive') return false;
        if (selectedStatus === 'Expiring') {
          const now = new Date();
          const exp = new Date(m.expiryDate);
          const diffDays = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 60 || diffDays < 0) return false;
        }
      }

      // Blood group filter
      if (selectedBlood !== 'All' && m.bloodGroup !== selectedBlood) return false;

      // Payment filter
      if (selectedPayment !== 'All' && m.paymentStatus !== selectedPayment) return false;

      // Date range filter
      if (dateRange !== 'all') {
        const regDate = new Date(m.registrationDate);
        const now = new Date();
        if (dateRange === '30days') {
          const past30 = new Date();
          past30.setDate(now.getDate() - 30);
          if (regDate < past30) return false;
        } else if (dateRange === 'this_year') {
          if (regDate.getFullYear() !== now.getFullYear()) return false;
        } else if (dateRange === 'last_year') {
          if (regDate.getFullYear() !== now.getFullYear() - 1) return false;
        }
      }

      return true;
    });
  }, [
    members,
    selectedUnit,
    selectedType,
    selectedCategory,
    selectedStatus,
    selectedBlood,
    selectedPayment,
    dateRange,
    isUnitOperator,
    defaultUserUnit,
  ]);

  if (!isOpen) return null;

  // Filter metrics
  const totalCollections = filteredMembers.reduce((sum, m) => sum + (m.feeAmountAED || 0), 0);
  const paidCount = filteredMembers.filter((m) => m.paymentStatus === 'Paid').length;
  const activeCount = filteredMembers.filter((m) => m.status === 'Active').length;

  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      const filterOpts: ReportFilterOptions = {
        unit: selectedUnit !== 'All' ? `${selectedUnit} Unit` : 'All Fujairah Units',
        membershipType: selectedType,
        registrationCategory: selectedCategory,
        bloodGroup: selectedBlood,
        paymentStatus: selectedPayment,
        status: selectedStatus,
        dateRange,
      };
      downloadMembershipReportPdf(
        filteredMembers,
        filterOpts
      );
      confetti({ particleCount: 35, spread: 50 });
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Error generating PDF report. Please check your data or try CSV export.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCsv = () => {
    try {
      setIsExportingCsv(true);
      const cleanUnit = (selectedUnit || 'All_Units').replace(/[^a-zA-Z0-9]/g, '_');
      exportMembersToCsv(
        filteredMembers,
        `KCA_Fujairah_Report_${cleanUnit}_${new Date().toISOString().split('T')[0]}.csv`
      );
      confetti({ particleCount: 25, spread: 45 });
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setSelectedUnit('All');
    setSelectedType('All');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedBlood('All');
    setSelectedPayment('All');
    setDateRange('all');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Official Report & Analytics Module
              </h3>
              <p className="text-xs text-red-100">
                Filter, analyze, and generate official PDF/CSV registers across all Fujairah units
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Controls & Filters Panel */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Filter className="w-4 h-4 text-[#8b0000]" />
              <span>Report Filters</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-[#8b0000] hover:underline font-semibold"
            >
              Reset Filters
            </button>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* Unit Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Unit / Area
              </label>
              <select
                value={isUnitOperator && defaultUserUnit ? defaultUserUnit : selectedUnit}
                disabled={isUnitOperator && !!defaultUserUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
              >
                <option value="All">All Units</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u} Unit
                  </option>
                ))}
              </select>
            </div>

            {/* Membership Type */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Member Role
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
              >
                <option value="All">All Roles</option>
                <option value="General Member">General Member</option>
                <option value="Executive Member">Executive Member</option>
                <option value="Central Committee Member">Central Committee Member</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Reg Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
              >
                <option value="All">All Categories</option>
                <option value="New">New Registration</option>
                <option value="Renewal">Renewal</option>
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Blood Group
              </label>
              <select
                value={selectedBlood}
                onChange={(e) => setSelectedBlood(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none font-mono"
              >
                <option value="All">All Blood Groups</option>
                <option value="A+">A+ve</option>
                <option value="A-">A-ve</option>
                <option value="B+">B+ve</option>
                <option value="B-">B-ve</option>
                <option value="AB+">AB+ve</option>
                <option value="AB-">AB-ve</option>
                <option value="O+">O+ve</option>
                <option value="O-">O-ve</option>
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Fee Payment
              </label>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
              >
                <option value="All">All Payments</option>
                <option value="Paid">Paid (AED)</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Registration Date Range */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="this_year">This Year (2026)</option>
                <option value="last_year">Last Year (2025)</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics Bar for Filtered Set */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Matching Members
              </div>
              <div className="font-display font-bold text-xl text-slate-900 mt-0.5">
                {filteredMembers.length}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Collections (AED)
              </div>
              <div className="font-mono font-bold text-xl text-emerald-700 mt-0.5">
                {formatAED(totalCollections)}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Members
              </div>
              <div className="font-display font-bold text-xl text-slate-900 mt-0.5">
                {activeCount}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8b0000]">
                Blood Donors
              </div>
              <div className="font-display font-bold text-xl text-[#8b0000] mt-0.5">
                {filteredMembers.length}
              </div>
            </div>
          </div>
        </div>

        {/* Live Filtered Table Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#8b0000] text-white font-semibold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Member ID</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Blood</th>
                    <th className="p-3">Expiry</th>
                    <th className="p-3 text-right">Fee (AED)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        No members match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-[#8b0000]">{m.membershipId}</td>
                        <td className="p-3 font-bold text-slate-900">{m.fullName}</td>
                        <td className="p-3 font-medium text-slate-700">{m.unit}</td>
                        <td className="p-3 text-slate-600">{m.membershipType.replace(' Member', '')}</td>
                        <td className="p-3 font-mono text-slate-700">{m.phoneUAE || m.whatsapp || 'N/A'}</td>
                        <td className="p-3 font-mono font-semibold text-[#8b0000]">
                          {formatCardBloodGroup(m.bloodGroup)}
                        </td>
                        <td className="p-3 font-mono text-slate-700">{formatDate(m.expiryDate)}</td>
                        <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                          {formatAED(m.feeAmountAED)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.paymentStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {m.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Action Bar with PDF & CSV Export */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Showing <strong>{filteredMembers.length}</strong> records &bull; Ready for official generation
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Table</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={isExportingCsv || filteredMembers.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV / Excel</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf || filteredMembers.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-[#8b0000] hover:bg-[#730000] text-white transition-colors shadow-md disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Generate Official PDF Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
