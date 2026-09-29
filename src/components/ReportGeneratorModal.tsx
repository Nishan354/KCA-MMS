import React, { useState, useMemo } from 'react';
import { Member, UserSession } from '../types/member';
import { downloadMembershipReportPdf, exportMembersToCsv, formatCleanProfession, ReportFilterOptions } from '../utils/pdfGenerator';
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
  Briefcase,
  Search,
  MapPin,
  ShieldCheck,
  Award,
  Edit,
  FileDown,
  AlertCircle,
  Save,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  units: string[];
  userSession?: UserSession;
  onUpdateMember?: (member: Member) => void;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  members,
  units,
  userSession,
  onUpdateMember,
}) => {
  const [reportMode, setReportMode] = useState<'detailed' | 'profession' | 'standard'>('detailed');
  const [selectedUnit, setSelectedUnit] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProfession, setSelectedProfession] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedBlood, setSelectedBlood] = useState<string>('All');
  const [selectedPayment, setSelectedPayment] = useState<string>('All');
  const [dateRange, setDateRange] = useState<'all' | '30days' | 'this_year' | 'last_year'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Profession Review and Edit State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editProfession, setEditProfession] = useState<string>('');
  const [editCompanyName, setEditCompanyName] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleStartEdit = (m: Member) => {
    setEditingMember(m);
    setEditProfession(formatCleanProfession(m.profession));
    setEditCompanyName(m.companyName || '');
    setSaveSuccess(false);
  };

  const handleSaveEdit = () => {
    if (!editingMember) return;
    const updated: Member = {
      ...editingMember,
      profession: editProfession.trim(),
      companyName: editCompanyName.trim(),
    };
    if (onUpdateMember) {
      onUpdateMember(updated);
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setEditingMember(null);
      setSaveSuccess(false);
    }, 450);
  };

  // If logged in as Unit Data Operator, restrict default unit filter
  const isUnitOperator = userSession?.role === 'Unit Data Operator';
  const defaultUserUnit = isUnitOperator ? userSession.unit : undefined;

  // Extract all unique professions across members
  const uniqueProfessions = useMemo(() => {
    const profSet = new Set<string>();
    members.forEach((m) => {
      const clean = formatCleanProfession(m.profession);
      if (clean) {
        profSet.add(clean);
      }
    });
    return Array.from(profSet).sort((a, b) => a.localeCompare(b));
  }, [members]);

  // Filtered members calculation
  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return members.filter((m) => {
      // Search query (Name, ID, Profession, Company, Emirates ID, NORKA, Phone)
      if (q) {
        const cleanProf = formatCleanProfession(m.profession);
        const matchName = m.fullName.toLowerCase().includes(q) || (m.malayalamName && m.malayalamName.toLowerCase().includes(q));
        const matchId = m.membershipId.toLowerCase().includes(q);
        const matchProf = cleanProf.toLowerCase().includes(q);
        const matchComp = m.companyName && m.companyName.toLowerCase().includes(q);
        const matchEid = m.emiratesId && m.emiratesId.toLowerCase().includes(q);
        const matchNorka = m.norkaId && m.norkaId.toLowerCase().includes(q);
        const matchPhone = (m.phoneUAE && m.phoneUAE.includes(q)) || (m.whatsapp && m.whatsapp.includes(q));
        const matchDistrict = m.keralaDistrict && m.keralaDistrict.toLowerCase().includes(q);

        if (!matchName && !matchId && !matchProf && !matchComp && !matchEid && !matchNorka && !matchPhone && !matchDistrict) {
          return false;
        }
      }

      // Unit filter
      const unitTarget = isUnitOperator && defaultUserUnit ? defaultUserUnit : selectedUnit;
      if (unitTarget !== 'All' && m.unit !== unitTarget) return false;

      // Type filter
      if (selectedType !== 'All' && m.membershipType !== selectedType) return false;

      // Category filter
      if (selectedCategory !== 'All' && m.registrationCategory !== selectedCategory) return false;

      // Profession filter
      if (selectedProfession !== 'All') {
        const cleanProf = formatCleanProfession(m.profession);
        if (selectedProfession === 'Unspecified') {
          if (cleanProf.length > 0) return false;
        } else if (cleanProf.toLowerCase() !== selectedProfession.toLowerCase()) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Active' && m.status !== 'Active') return false;
        if (selectedStatus === 'Inactive' && m.status !== 'Expired' && m.status !== 'Suspended') return false;
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
    searchTerm,
    selectedUnit,
    selectedType,
    selectedCategory,
    selectedProfession,
    selectedStatus,
    selectedBlood,
    selectedPayment,
    dateRange,
    isUnitOperator,
    defaultUserUnit,
  ]);

  // Compute top professions in filtered set
  const professionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    let unspecifiedCount = 0;
    filteredMembers.forEach((m) => {
      const p = formatCleanProfession(m.profession);
      if (!p) {
        unspecifiedCount++;
      } else {
        counts[p] = (counts[p] || 0) + 1;
      }
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      topList: sorted.slice(0, 5),
      totalUnique: Object.keys(counts).length,
      unspecifiedCount,
    };
  }, [filteredMembers]);

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
        membershipType: selectedType !== 'All' ? selectedType : undefined,
        registrationCategory: selectedCategory !== 'All' ? selectedCategory : undefined,
        profession: selectedProfession !== 'All' ? selectedProfession : undefined,
        bloodGroup: selectedBlood !== 'All' ? selectedBlood : undefined,
        paymentStatus: selectedPayment !== 'All' ? selectedPayment : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        dateRange,
        reportMode,
      };
      downloadMembershipReportPdf(filteredMembers, filterOpts);
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
      const cleanMode = reportMode.toUpperCase();
      exportMembersToCsv(
        filteredMembers,
        `KCA_Fujairah_${cleanMode}_Report_${cleanUnit}_${new Date().toISOString().split('T')[0]}.csv`
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
    setSelectedProfession('All');
    setSelectedStatus('All');
    setSelectedBlood('All');
    setSelectedPayment('All');
    setDateRange('all');
    setSearchTerm('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Official Report &amp; Professional Analytics Dossier
              </h3>
              <p className="text-xs text-red-100">
                Filter, review member professions &amp; credentials, and export comprehensive executive registers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Mode Selector Tabs */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl">
            <button
              onClick={() => setReportMode('detailed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                reportMode === 'detailed'
                  ? 'bg-white text-[#8b0000] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Comprehensive Detailed Dossier</span>
            </button>

            <button
              onClick={() => setReportMode('profession')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                reportMode === 'profession'
                  ? 'bg-white text-[#8b0000] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              <span>Occupational &amp; Profession Directory</span>
            </button>

            <button
              onClick={() => setReportMode('standard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                reportMode === 'standard'
                  ? 'bg-white text-[#8b0000] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Standard Executive Register</span>
            </button>
          </div>

          {/* Quick Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search profession, employer, name, ID..."
              className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-[#8b0000] outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Controls & Filters Panel */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Filter className="w-4 h-4 text-[#8b0000]" />
              <span>Report Filters &amp; Demographics Scope</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-[#8b0000] hover:underline font-semibold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 text-xs">
            {/* Unit Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Unit / Area
              </label>
              <select
                value={isUnitOperator && defaultUserUnit ? defaultUserUnit : selectedUnit}
                disabled={isUnitOperator && !!defaultUserUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
              >
                <option value="All">All Units</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u} Unit
                  </option>
                ))}
              </select>
            </div>

            {/* Profession Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-900 mb-1 flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-blue-600" />
                <span>Profession</span>
              </label>
              <select
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="w-full p-1.5 bg-white border border-blue-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-blue-600 outline-none"
              >
                <option value="All">All Professions ({uniqueProfessions.length})</option>
                {uniqueProfessions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="Unspecified">Not Specified</option>
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
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
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
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
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
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none font-mono"
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
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
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
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="this_year">This Year (2026)</option>
                <option value="last_year">Last Year (2025)</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics & Profession Insight Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">Matching Members:</span>
                <span className="font-display font-bold text-sm text-slate-900">{filteredMembers.length}</span>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-blue-700">Professions:</span>
                <span className="font-bold text-sm text-blue-900">{professionStats.totalUnique} Unique Roles</span>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Collections:</span>
                <span className="font-mono font-bold text-sm text-emerald-800">{formatAED(totalCollections)}</span>
                <span className="text-[10px] text-slate-400">({paidCount} Paid)</span>
              </div>
            </div>

            {/* Top Professions Pills (Clickable filter) */}
            {professionStats.topList.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top Roles:</span>
                {professionStats.topList.map(([prof, count]) => (
                  <button
                    key={prof}
                    onClick={() => setSelectedProfession(selectedProfession === prof ? 'All' : prof)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedProfession === prof
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                    }`}
                    title={`Click to filter by ${prof}`}
                  >
                    <span>{prof}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profession Review Alert / Helper Banner */}
        {professionStats.unspecifiedCount > 0 && (
          <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-900">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 border border-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="font-bold text-amber-950">
                  Profession Review Required: {professionStats.unspecifiedCount} Members Need Verification
                </p>
                <p className="text-[11px] text-amber-800">
                  Some records have missing occupations or generic &quot;Member&quot; entries. Use the inline edit buttons below to assign their authentic profession before exporting.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelectedProfession(selectedProfession === 'Unspecified' ? 'All' : 'Unspecified')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all shadow-2xs ${
                  selectedProfession === 'Unspecified'
                    ? 'bg-amber-800 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {selectedProfession === 'Unspecified' ? 'Show All Members' : `Review Unspecified (${professionStats.unspecifiedCount})`}
              </button>
            </div>
          </div>
        )}

        {/* Live Filtered Table Preview */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#8b0000] text-white font-semibold sticky top-0 z-10 shadow-xs">
                  {reportMode === 'profession' ? (
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Member ID</th>
                      <th className="p-2.5">Full Name</th>
                      <th className="p-2.5">Profession / Role</th>
                      <th className="p-2.5">Company / Workplace</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5">Contact / WhatsApp</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Emirates ID</th>
                      <th className="p-2.5">Kerala District</th>
                      <th className="p-2.5">NORKA ID</th>
                      <th className="p-2.5 text-center">Blood</th>
                    </tr>
                  ) : reportMode === 'detailed' ? (
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Member ID</th>
                      <th className="p-2.5">Full Name &amp; Malayalam</th>
                      <th className="p-2.5">Profession &amp; Employer</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5">Contact / WhatsApp</th>
                      <th className="p-2.5">Emirates ID &amp; NORKA</th>
                      <th className="p-2.5">District (Kerala)</th>
                      <th className="p-2.5 text-center">Blood</th>
                      <th className="p-2.5">Role / Category</th>
                      <th className="p-2.5 text-right">Fee (AED) &amp; Pay</th>
                      <th className="p-2.5">Status &amp; Expiry</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Member ID</th>
                      <th className="p-2.5">Full Name</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5">Contact</th>
                      <th className="p-2.5">Profession</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Expiry</th>
                      <th className="p-2.5 text-right">Fee (AED)</th>
                      <th className="p-2.5">Payment</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Briefcase className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-600">No member records match the selected criteria.</p>
                          <p className="text-xs text-slate-400">Try adjusting your filters or resetting the search term.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m, idx) => {
                      if (reportMode === 'profession') {
                        const cleanProf = formatCleanProfession(m.profession);
                        return (
                          <tr key={m.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="p-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-[#8b0000]">{m.membershipId}</td>
                            <td className="p-2.5 font-bold text-slate-900">
                              <div>{m.fullName}</div>
                              {m.malayalamName && (
                                <div className="text-[10px] text-slate-500 font-normal">{m.malayalamName}</div>
                              )}
                            </td>
                            <td className="p-2.5">
                              {cleanProf ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                                  <Briefcase className="w-3 h-3 text-blue-600" />
                                  {cleanProf}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-400 italic text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                  Not Specified
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-700 font-medium">
                              {m.companyName && m.companyName.trim() ? m.companyName.trim() : <span className="text-slate-400">&mdash;</span>}
                            </td>
                            <td className="p-2.5 font-medium text-slate-700">{m.unit}</td>
                            <td className="p-2.5 font-mono text-slate-700">
                              <div>{m.phoneUAE || 'N/A'}</div>
                              {m.whatsapp && m.whatsapp !== m.phoneUAE && (
                                <div className="text-[10px] text-emerald-600 font-sans">WA: {m.whatsapp}</div>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-600">{m.email || 'N/A'}</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-700">{m.emiratesId || 'N/A'}</td>
                            <td className="p-2.5 text-slate-700">{m.keralaDistrict || 'N/A'}</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-700">{m.norkaId || 'N/A'}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-[#8b0000]">
                              {formatCardBloodGroup(m.bloodGroup)}
                            </td>
                          </tr>
                        );
                      }

                      if (reportMode === 'detailed') {
                        const cleanProf = formatCleanProfession(m.profession);
                        return (
                          <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-[#8b0000]">{m.membershipId}</td>
                            <td className="p-2.5 font-bold text-slate-900">
                              <div>{m.fullName}</div>
                              {m.malayalamName && (
                                <div className="text-[10px] text-slate-500 font-normal">{m.malayalamName}</div>
                              )}
                            </td>
                            <td className="p-2.5">
                              <div className="font-semibold text-blue-900 flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-blue-600 shrink-0" />
                                {cleanProf ? (
                                  <span>{cleanProf}</span>
                                ) : (
                                  <span className="text-slate-400 italic font-normal">Not Specified</span>
                                )}
                              </div>
                              {m.companyName && m.companyName.trim() && (
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  @ {m.companyName.trim()}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 font-medium text-slate-700">{m.unit}</td>
                            <td className="p-2.5 font-mono text-slate-700">
                              <div>{m.phoneUAE || 'N/A'}</div>
                              {m.whatsapp && m.whatsapp !== m.phoneUAE && (
                                <div className="text-[10px] text-emerald-600 font-sans">WA: {m.whatsapp}</div>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-700">
                              <div>{m.emiratesId || 'EID: N/A'}</div>
                              {m.norkaId && (
                                <div className="text-[10px] text-purple-700 font-sans">NRK: {m.norkaId}</div>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-700 font-medium">{m.keralaDistrict || 'N/A'}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-[#8b0000]">
                              {formatCardBloodGroup(m.bloodGroup)}
                            </td>
                            <td className="p-2.5 text-slate-700">
                              <div className="font-semibold">{m.membershipType.replace(' Member', '')}</div>
                              <div className="text-[10px] text-slate-500">({m.registrationCategory})</div>
                            </td>
                            <td className="p-2.5 text-right font-mono">
                              <div className="font-bold text-emerald-700">{formatAED(m.feeAmountAED)}</div>
                              <span
                                className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  m.paymentStatus === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {m.paymentStatus}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold block w-fit ${
                                  m.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {m.status}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Exp: {formatDate(m.expiryDate)}
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // Standard mode
                      const cleanProf = formatCleanProfession(m.profession);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-[#8b0000]">{m.membershipId}</td>
                          <td className="p-2.5 font-bold text-slate-900">{m.fullName}</td>
                          <td className="p-2.5 font-medium text-slate-700">{m.unit}</td>
                          <td className="p-2.5 font-mono text-slate-700">{m.phoneUAE || m.whatsapp || 'N/A'}</td>
                          <td className="p-2.5 font-medium text-blue-900">
                            {cleanProf ? (
                              <span>{cleanProf}</span>
                            ) : (
                              <span className="text-slate-400 italic font-normal">Not Specified</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-600">{m.membershipType.replace(' Member', '')}</td>
                          <td className="p-2.5 text-slate-600">{m.registrationCategory}</td>
                          <td className="p-2.5 font-mono text-slate-700">{formatDate(m.expiryDate)}</td>
                          <td className="p-2.5 text-right font-mono font-semibold text-emerald-700">
                            {formatAED(m.feeAmountAED)}
                          </td>
                          <td className="p-2.5">
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Action Bar with PDF & CSV Export */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>
              Showing <strong>{filteredMembers.length}</strong> of {members.length} members
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="font-medium text-[#8b0000] capitalize">
              Mode: {reportMode === 'detailed' ? 'Comprehensive Detailed Dossier' : reportMode === 'profession' ? 'Occupational Directory' : 'Standard Register'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Table</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={isExportingCsv || filteredMembers.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              title="Export complete database with 30+ columns including profession, employer, and credentials"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Full CSV / Excel</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf || filteredMembers.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-[#8b0000] hover:bg-[#730000] text-white transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              title="Generate Official Management PDF Register with Selected Format"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>
                {isExportingPdf ? 'Generating PDF...' : `Generate ${reportMode === 'detailed' ? 'Detailed PDF Report' : reportMode === 'profession' ? 'Profession Directory PDF' : 'Standard PDF'}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

