import React, { useState, useMemo } from 'react';
import { Member, CustomFieldDefinition, UserSession, hasAdminPrivilege, isUnitOperatorRole } from '../types/member';
import { IdCard } from './IdCard';
import { IdCardDesignId, ID_CARD_DESIGNS, getIdCardDesign } from '../types/cardDesign';
import {
  Search,
  Printer,
  Eye,
  Sparkles,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Palette,
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

const ITEMS_PER_PAGE = 8;

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
}) => {
  const handleOpenCard = onOpenCardModal || onSelectMember;
  const handleBatchPrint = onOpenBatchPrint || onBatchPrint;
  const isAdmin = !userSession || hasAdminPrivilege(userSession.role);
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [designFilter, setDesignFilter] = useState<IdCardDesignId | 'all'>('all');
  const [cardSide, setCardSide] = useState<'front' | 'back' | 'both'>('front');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        !searchQuery ||
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.membershipId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.unit.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUnit = unitFilter === 'ALL' || m.unit === unitFilter;
      return matchesSearch && matchesUnit;
    });
  }, [members, searchQuery, unitFilter]);

  // Pagination calculation to prevent main-thread freezing and eliminate navigation latency
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedMembers = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredMembers, safeCurrentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  return (
    <div className="space-y-6 pb-12 font-sans antialiased">
      {/* Top Controls Glassy Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#8b0000] shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-xl sm:text-2xl text-slate-900 tracking-tight leading-tight">
                {isUnitOp && userSession?.unit
                  ? `${userSession.unit} Membership ID Cards`
                  : 'Official Membership ID Cards'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard CR80 format • Dynamic templates • QR verification • High-resolution rendering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {isAdmin && onOpenLogoManager && (
              <button
                onClick={onOpenLogoManager}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-xs cursor-pointer"
                title="Upload custom logo or reset to original"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Logo Options</span>
              </button>
            )}

            {handleBatchPrint && (
              <button
                onClick={() => handleBatchPrint(filteredMembers)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8b0000] hover:bg-[#700000] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Batch Print ({filteredMembers.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and View toggles */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search member name, ID, unit..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 placeholder-slate-400 focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] outline-none transition-all"
              />
            </div>

            {/* Unit Filter */}
            {isAdmin ? (
              <select
                value={unitFilter}
                onChange={(e) => {
                  setUnitFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-700 focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] outline-none cursor-pointer transition-all"
              >
                <option value="ALL">All Units ({members.length})</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Unit: {userSession?.unit}</span>
              </div>
            )}

            {/* Dynamic Card Design Template Filter */}
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={designFilter}
                onChange={(e) => setDesignFilter(e.target.value as IdCardDesignId | 'all')}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-700 focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] outline-none cursor-pointer transition-all"
                title="Filter or preview cards in a specific design template"
              >
                <option value="all">Design: All (Member Default)</option>
                {ID_CARD_DESIGNS.map((d) => (
                  <option key={d.id} value={d.id}>
                    Design: {d.name} ({d.badge})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Front / Back switch */}
          <div className="flex items-center justify-between gap-3 self-end md:self-auto">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setCardSide('front')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  cardSide === 'front'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Front View
              </button>
              <button
                onClick={() => setCardSide('back')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  cardSide === 'back'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Back View
              </button>
              <button
                onClick={() => setCardSide('both')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  cardSide === 'both'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Both Sides
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#8b0000] flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6" />
          </div>
          <p className="font-semibold text-slate-700">No ID cards match your search criteria.</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or search terms.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {paginatedMembers.map((m) => {
              const effectiveDesign = designFilter === 'all' ? (m.cardDesign || 'classic_wave') : designFilter;
              const designInfo = getIdCardDesign(effectiveDesign);

              return (
                <div
                  key={m.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col items-center gap-4 group"
                >
                  <div className="w-full flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-xs text-[#8b0000] bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 shrink-0">
                        {m.membershipId}
                      </span>
                      <span className="font-bold text-sm text-slate-900 truncate group-hover:text-[#8b0000] transition-colors">
                        {m.fullName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200 shrink-0 hidden sm:inline-block">
                        {designInfo.name.split(' ')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenCard && handleOpenCard(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#8b0000] text-xs font-bold rounded-xl transition-all border border-rose-200 shadow-xs cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#8b0000]" />
                        <span>Open / Export</span>
                      </button>
                    </div>
                  </div>

                  {/* ID Card Display */}
                  <div
                    onClick={() => handleOpenCard && handleOpenCard(m)}
                    className="cursor-pointer transition-transform duration-300 group-hover:scale-[1.015]"
                  >
                    <IdCard
                      member={m}
                      customFields={customFields}
                      side={cardSide}
                      cardDesign={designFilter === 'all' ? undefined : designFilter}
                      showShadow={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Smooth Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
              <span className="text-slate-600 font-medium">
                Showing{' '}
                <strong className="text-slate-900 font-mono">
                  {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900 font-mono">
                  {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredMembers.length)}
                </strong>{' '}
                of <strong className="text-slate-900 font-mono">{filteredMembers.length}</strong> ID Cards
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1 px-2">
                  <span className="text-slate-500">Page</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    {safeCurrentPage}
                  </span>
                  <span className="text-slate-500">of {totalPages}</span>
                </div>

                <button
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
