import React, { useState } from 'react';
import { Member, CustomFieldDefinition, UserSession, hasAdminPrivilege, isUnitOperatorRole } from '../types/member';
import { IdCard } from './IdCard';
import {
  Search,
  Printer,
  Eye,
  Sparkles,
  Building2,
} from 'lucide-react';

interface IdCardsViewProps {
  members: Member[];
  units: string[];
  customFields?: CustomFieldDefinition[];
  userSession?: UserSession;
  onSelectMember?: (member: Member) => void;
  onOpenCardModal?: (member: Member) => void;
  onOpenBatchPrint?: (members: Member[]) => void;
  onBatchPrint?: (members: Member[]) => void;
  onOpenLogoManager?: () => void;
  onOpenWhatsApp?: (member?: Member) => void;
}

export const IdCardsView: React.FC<IdCardsViewProps> = ({
  members,
  units,
  customFields = [],
  userSession,
  onSelectMember,
  onOpenCardModal,
  onOpenBatchPrint,
  onBatchPrint,
  onOpenLogoManager,
  onOpenWhatsApp,
}) => {
  const handleOpenCard = onOpenCardModal || onSelectMember;
  const handleBatchPrint = onOpenBatchPrint || onBatchPrint;
  const isAdmin = !userSession || hasAdminPrivilege(userSession.role);
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [cardSide, setCardSide] = useState<'front' | 'back' | 'both'>('front');

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.membershipId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.unit.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUnit = unitFilter === 'ALL' || m.unit === unitFilter;
    return matchesSearch && matchesUnit;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-xl text-slate-900 leading-tight">
              {isUnitOp && userSession?.unit ? `${userSession.unit} Membership ID Cards` : 'Official Membership ID Cards'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard CR80 format featuring boxed member photo, official KCA emblem, Unit designation, and QR verification
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onOpenLogoManager && (
              <button
                onClick={onOpenLogoManager}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors border border-slate-300"
                title="Upload custom logo or reset to original"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8b0000]" />
                Logo Options
              </button>
            )}

            {handleBatchPrint && (
              <button
                onClick={() => handleBatchPrint(filteredMembers)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Batch Print ({filteredMembers.length})
              </button>
            )}
          </div>
        </div>

        {/* Filters and View toggles */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member name, ID, unit..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
              />
            </div>

            {/* Unit */}
            {isAdmin ? (
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium bg-slate-50 text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
              >
                <option value="ALL">All Units ({members.length})</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Unit: {userSession?.unit}</span>
              </div>
            )}
          </div>

          {/* Front / Back switch */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setCardSide('front')}
              className={`px-3 py-1 rounded transition-colors ${
                cardSide === 'front' ? 'bg-[#8b0000] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Front View
            </button>
            <button
              onClick={() => setCardSide('back')}
              className={`px-3 py-1 rounded transition-colors ${
                cardSide === 'back' ? 'bg-[#8b0000] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Back View
            </button>
            <button
              onClick={() => setCardSide('both')}
              className={`px-3 py-1 rounded transition-colors ${
                cardSide === 'both' ? 'bg-[#8b0000] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Both Sides
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-500 border border-slate-200">
          No ID cards match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {filteredMembers.map((m) => (
            <div
              key={m.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col items-center gap-4"
            >
              <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#8b0000] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {m.membershipId}
                  </span>
                  <span className="font-bold text-sm text-slate-900 truncate">
                    {m.fullName}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenCard && handleOpenCard(m)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold rounded-md transition-colors shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Open / Export PNG
                  </button>
                </div>
              </div>

              {/* ID Card Display */}
              <div
                onClick={() => handleOpenCard && handleOpenCard(m)}
                className="cursor-pointer transition-transform hover:scale-[1.01]"
              >
                <IdCard member={m} customFields={customFields} side={cardSide} showShadow={true} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
