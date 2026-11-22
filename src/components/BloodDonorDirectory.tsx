import React, { useState, useEffect } from 'react';
import { Member, BloodGroup } from '../types/member';
import {
  X,
  HeartPulse,
  Phone,
  MessageSquare,
  Search,
  Filter,
  MapPin,
  Download,
  AlertCircle,
  ShieldCheck,
  Users,
  Activity,
  RotateCcw,
} from 'lucide-react';
import { loadSavedTheme } from '../utils/theme';
import { ThemePreset } from '../types/theme';

export interface BloodDonorDirectoryProps {
  members: Member[];
  isOpen?: boolean;
  isModal?: boolean;
  onClose?: () => void;
  onSelectMember: (member: Member) => void;
  initialBloodGroup?: string;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const BloodDonorDirectory: React.FC<BloodDonorDirectoryProps> = ({
  members,
  isOpen = true,
  isModal = false,
  onClose,
  onSelectMember,
  initialBloodGroup,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>(initialBloodGroup || 'ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<ThemePreset>(() => loadSavedTheme());

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (e?.detail) {
        setTheme(e.detail);
      } else {
        setTheme(loadSavedTheme());
      }
    };
    window.addEventListener('kca-theme-changed', handleThemeChange);
    return () => window.removeEventListener('kca-theme-changed', handleThemeChange);
  }, []);

  // Synchronize when initialBloodGroup changes
  useEffect(() => {
    if (initialBloodGroup && initialBloodGroup !== 'ALL') {
      setSelectedGroup(initialBloodGroup);
    } else if (initialBloodGroup === 'ALL') {
      setSelectedGroup('ALL');
    }
  }, [initialBloodGroup]);

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) => {
    const matchesGroup = selectedGroup === 'ALL' || m.bloodGroup === selectedGroup;
    const matchesUnit = selectedUnit === 'ALL' || m.unit === selectedUnit;
    const matchesSearch =
      !searchQuery ||
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.phoneUAE && m.phoneUAE.includes(searchQuery)) ||
      (m.membershipId && m.membershipId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.unit && m.unit.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGroup && matchesUnit && matchesSearch;
  });

  const units = Array.from(new Set(members.map((m) => m.unit))).filter(Boolean);

  // Statistics
  const totalDonors = members.length;
  const universalDonors = members.filter((m) => m.bloodGroup === 'O-' || m.bloodGroup === 'O+').length;
  const rareDonors = members.filter((m) => ['AB-', 'B-', 'A-', 'O-'].includes(m.bloodGroup)).length;
  const activeUnitsCount = units.length;

  const handleExportCSV = () => {
    const headers = ['Membership ID', 'Full Name', 'Blood Group', 'Unit', 'UAE Phone', 'WhatsApp', 'Email', 'Status'];
    const rows = filteredMembers.map((m) => [
      `"${m.membershipId || ''}"`,
      `"${m.fullName || ''}"`,
      `"${m.bloodGroup || ''}"`,
      `"${m.unit || ''}"`,
      `"${m.phoneUAE || ''}"`,
      `"${m.whatsapp || m.phoneUAE || ''}"`,
      `"${m.email || ''}"`,
      `"${m.status || 'Active'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `KCA_Fujairah_Blood_Donors_${selectedGroup}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSelectedGroup('ALL');
    setSelectedUnit('ALL');
    setSearchQuery('');
  };

  // Content for both Modal and Full-Page views
  const filterControls = (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
      {/* Blood group selector pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
          <span>Group:</span>
        </span>
        <button
          onClick={() => setSelectedGroup('ALL')}
          style={selectedGroup === 'ALL' ? { backgroundColor: theme.primary, borderColor: theme.primary } : undefined}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedGroup === 'ALL'
              ? 'text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Groups ({members.length})
        </button>
        {BLOOD_GROUPS.map((bg) => {
          const count = members.filter((m) => m.bloodGroup === bg).length;
          const isSelected = selectedGroup === bg;
          return (
            <button
              key={bg}
              onClick={() => setSelectedGroup(bg)}
              style={isSelected ? { backgroundColor: theme.primary, borderColor: theme.primary } : undefined}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {bg} <span className="text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Unit & search bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search donor name, phone (+971...), unit, ID..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="border-none bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Fujairah Units</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u} Unit
                </option>
              ))}
            </select>
          </div>

          {(selectedGroup !== 'ALL' || selectedUnit !== 'ALL' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const donorCards = (
    <div>
      {filteredMembers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-3">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-slate-800 text-base">No Donors Found</h4>
          <p className="text-slate-500 text-xs max-w-md mx-auto mt-1">
            No registered members match blood group <strong className="text-slate-700">{selectedGroup}</strong> in the selected filter criteria.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            style={{ backgroundColor: theme.primary }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Show All Blood Donors</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMembers.map((m) => (
            <div
              key={m.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Blood Group Badge */}
                  <div
                    className="w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono font-black shrink-0 shadow-xs border text-white"
                    style={{ backgroundColor: theme.primary, borderColor: theme.primaryBorder }}
                  >
                    <span className="text-sm leading-none">{m.bloodGroup || 'N/A'}</span>
                    <HeartPulse className="w-3 h-3 text-rose-200 mt-1" />
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate group-hover:text-rose-900 transition-colors">
                      {m.fullName}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                      <span className="font-semibold text-slate-700">{m.unit}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-500">{m.membershipId}</span>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-700 mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{m.phoneUAE}</span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Available
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${m.phoneUAE ? m.phoneUAE.replace(/\s+/g, '') : ''}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                    title={`Call ${m.fullName}`}
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Call</span>
                  </a>

                  <a
                    href={`https://wa.me/${(m.whatsapp || m.phoneUAE || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Namaskaram ${m.fullName}, greeting from KCA Fujairah. We have an urgent blood requirement (${m.bloodGroup || 'Blood'}) in Fujairah/UAE.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
                    title={`WhatsApp ${m.fullName}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <button
                  onClick={() => {
                    onSelectMember(m);
                    if (isModal && onClose) onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-900 text-slate-600 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // If in MODAL mode
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
          {/* Header - Solid theme */}
          <div
            className="px-6 py-4 text-white flex items-center justify-between"
            style={{ backgroundColor: theme.primary }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20 shadow-xs">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  UAE Blood Bank &amp; Emergency Donors Directory
                </h3>
                <p className="text-xs text-white/90">
                  KCA Fujairah 24/7 Community Blood Helpline across East Coast &amp; UAE {selectedGroup !== 'ALL' ? `• Group: ${selectedGroup}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors border border-white/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">{filterControls}</div>

          {/* Donor Cards Body */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">{donorCards}</div>

          {/* Footer */}
          <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Found <strong className="text-slate-900">{filteredMembers.length}</strong> available blood donors {selectedGroup !== 'ALL' ? `for ${selectedGroup}` : ''}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full Page View Mode (activeTab === 'blood')
  return (
    <div className="space-y-6 pb-12 antialiased">
      {/* Top Banner - Solid Theme Header */}
      <div
        className="rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-black/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-white/25">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>24/7 Humanitarian Healthcare Network</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            UAE Blood Bank &amp; Donors Directory
          </h2>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal">
            Direct access to ready voluntary blood donors from Kairali Cultural Association Fujairah across all blood groups for urgent patient transfusions at Fujairah Hospital, Khorfakkan Hospital, and hospitals across the United Arab Emirates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-rose-700" />
            <span>Export Donors (CSV)</span>
          </button>

          <a
            href="tel:+97192242999"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/30 backdrop-blur-xs transition-all"
            title="Fujairah Hospital Emergency"
          >
            <Phone className="w-4 h-4 text-amber-300" />
            <span>Fujairah Hospital Blood Bank: 09 224 2999</span>
          </a>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Standby Donors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Donors</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-slate-900">{totalDonors}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            Registered KCA community members
          </div>
        </div>

        {/* Universal Donors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Universal (O- &amp; O+)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-amber-700">{universalDonors}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            Critical emergency emergency transfusions
          </div>
        </div>

        {/* Rare Blood Groups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rare Groups</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-purple-700">{rareDonors}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            AB-, B-, A-, O- registered donors
          </div>
        </div>

        {/* Units Active Coverage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Units Covered</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-blue-700">{activeUnitsCount}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            Fujairah &amp; East Coast coverage
          </div>
        </div>
      </div>

      {/* Emergency Guidance Strip */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold">UAE Emergency Protocol:</span> If you are coordinating an urgent blood requirement for an admitted patient, you can call donors directly or click <strong className="font-semibold text-emerald-800">WhatsApp</strong> to dispatch the emergency alert message. Please also notify the Fujairah Hospital Blood Bank or MOHAP UAE Hotline (800 11111) for donation slot booking.
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="font-bold text-sm text-slate-800">Filter Donors Directory</span>
          </div>
          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-900">{filteredMembers.length}</strong> of {members.length} registered donors
          </div>
        </div>
        {filterControls}
      </div>

      {/* Donors Cards Grid */}
      {donorCards}
    </div>
  );
};
