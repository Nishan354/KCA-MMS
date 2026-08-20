import React, { useState } from 'react';
import { Member, BloodGroup } from '../types/member';
import {
  X,
  HeartPulse,
  Phone,
  MessageSquare,
  Search,
  Filter,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

interface BloodDonorDirectoryProps {
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
  onSelectMember: (member: Member) => void;
  initialBloodGroup?: string;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const BloodDonorDirectory: React.FC<BloodDonorDirectoryProps> = ({
  members,
  isOpen,
  onClose,
  onSelectMember,
  initialBloodGroup,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>(initialBloodGroup || 'ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize when initialBloodGroup or modal open state changes
  React.useEffect(() => {
    if (isOpen) {
      if (initialBloodGroup && initialBloodGroup !== 'ALL') {
        setSelectedGroup(initialBloodGroup);
      } else {
        setSelectedGroup('ALL');
      }
    }
  }, [isOpen, initialBloodGroup]);

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) => {
    const matchesGroup = selectedGroup === 'ALL' || m.bloodGroup === selectedGroup;
    const matchesUnit = selectedUnit === 'ALL' || m.unit === selectedUnit;
    const matchesSearch =
      !searchQuery ||
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phoneUAE.includes(searchQuery) ||
      m.unit.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesUnit && matchesSearch;
  });

  const units = Array.from(new Set(members.map((m) => m.unit)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div
          className="px-6 py-4 text-white flex items-center justify-between border-b border-black/15"
          style={{ backgroundColor: 'var(--color-primary, #881337)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/20">
              <HeartPulse className="w-6 h-6 text-red-200" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Emergency Blood Donor Registry
              </h3>
              <p className="text-xs text-white/80">
                KCA Fujairah Community Blood Helpline across East Coast &amp; UAE {selectedGroup !== 'ALL' ? `• Group: ${selectedGroup}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          {/* Blood group selector pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Group:
            </span>
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedGroup === 'ALL'
                  ? 'text-white shadow-xs font-bold'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
              style={selectedGroup === 'ALL' ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
            >
              All Groups ({members.length})
            </button>
            {BLOOD_GROUPS.map((bg) => {
              const count = members.filter((m) => m.bloodGroup === bg).length;
              return (
                <button
                  key={bg}
                  onClick={() => setSelectedGroup(bg)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
                    selectedGroup === bg
                      ? 'text-white shadow-xs font-bold'
                      : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
                  }`}
                  style={selectedGroup === bg ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
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
                placeholder="Search donor name, unit, phone number..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <MapPin className="w-4 h-4 text-slate-500" />
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium bg-white text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
              >
                <option value="ALL">All Fujairah Units</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Donors List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No registered blood donors found for selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Blood Group Badge */}
                    <div className="w-11 h-11 rounded-lg bg-[#8b0000] text-white flex flex-col items-center justify-center font-mono font-bold shrink-0 shadow-xs">
                      <span className="text-sm">{m.bloodGroup}</span>
                      <HeartPulse className="w-3 h-3 text-red-200 mt-0.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {m.fullName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-slate-700">{m.unit}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-slate-600">{m.membershipId}</span>
                      </div>
                      <div className="font-mono text-xs font-semibold text-slate-800 mt-1">
                        {m.phoneUAE}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${m.phoneUAE.replace(/\s+/g, '')}`}
                      className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors"
                      title="Call Donor"
                    >
                      <Phone className="w-4 h-4 text-slate-700" />
                    </a>

                    <a
                      href={`https://wa.me/${(m.whatsapp || m.phoneUAE).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Namaskaram ${m.fullName}, greeting from KCA Fujairah. We have an urgent blood requirement in Fujairah/UAE.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                      title="Send WhatsApp Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => {
                        onSelectMember(m);
                        onClose();
                      }}
                      className="px-2.5 py-2 rounded-md bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold transition-colors"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Found <strong className="text-[#8b0000]">{filteredMembers.length}</strong> available blood donors
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
