import React, { useState, useMemo } from 'react';
import {
  Member,
  CoordinationCommitteeType,
  UserSession,
  hasAdminPrivilege,
} from '../types/member';
import { COORDINATION_COMMITTEE_DESIGNATIONS } from '../types/subcommittee';
import { isMemberEffectivelyActive } from '../utils/idGenerator';
import {
  Crown,
  ShieldCheck,
  Users,
  UserPlus,
  Building2,
  MapPin,
  Search,
  Check,
  X,
  ArrowDown,
  GitBranch,
  Award,
  Phone,
  IdCard,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Layers,
  Send,
  ChevronRight,
  Edit3,
  Briefcase,
} from 'lucide-react';

interface CoordinationCommitteeViewProps {
  members: Member[];
  units: string[];
  userSession?: UserSession;
  onUpdateMember: (updatedMember: Member) => void;
  onBulkUpdateMembers?: (updatedMembers: Member[]) => void;
  onSelectMember?: (member: Member) => void;
  onViewIdCard?: (member: Member) => void;
  onOpenWhatsApp?: (member: Member) => void;
  onEditMember?: (member: Member) => void;
}

type SourceTeamFilter = 'committee_team' | 'central_only' | 'unit_exec_only' | 'all_members';
type ActiveCommitteeTab = 'all' | 'central_coord' | 'exec_coord';

export const CoordinationCommitteeView: React.FC<CoordinationCommitteeViewProps> = ({
  members,
  units,
  userSession,
  onUpdateMember,
  onBulkUpdateMembers,
  onSelectMember,
  onViewIdCard,
  onOpenWhatsApp,
  onEditMember,
}) => {
  const isAdmin = !userSession || hasAdminPrivilege(userSession.role);

  // View filter state
  const [activeCommitteeTab, setActiveCommitteeTab] = useState<ActiveCommitteeTab>('all');
  const [unitFilter, setUnitFilter] = useState<string>('All');
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [showBlueprintDetails, setShowBlueprintDetails] = useState<boolean>(true);

  // Modal state for "Select from Existing Team"
  const [isSelectModalOpen, setIsSelectModalOpen] = useState<boolean>(false);
  const [targetCommittee, setTargetCommittee] = useState<
    'Central Coordination Committee' | 'Executive Coordination Committee'
  >('Central Coordination Committee');
  const [sourceTeamFilter, setSourceTeamFilter] = useState<SourceTeamFilter>('committee_team');
  const [modalUnitFilter, setModalUnitFilter] = useState<string>('All');
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('Central Coordinator');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [isCustomRole, setIsCustomRole] = useState<boolean>(false);
  const [coordinationNotes, setCoordinationNotes] = useState<string>('');

  // Inline role editing state
  const [editingRoleMemberId, setEditingRoleMemberId] = useState<string | null>(null);
  const [inlineRoleValue, setInlineRoleValue] = useState<string>('');

  // Identify existing Central Committee & Unit Executive members
  const isCentralMember = (m: Member) =>
    m.membershipType === 'Central Committee Member' ||
    m.committeeTier === 'Central' ||
    m.unit.toLowerCase().startsWith('central');

  const isUnitExecMember = (m: Member) =>
    m.membershipType === 'Executive Member' ||
    m.committeeTier === 'Unit' ||
    (!isCentralMember(m) && Boolean(m.designation && m.designation.trim()));

  const isExistingCommitteeTeamMember = (m: Member) =>
    isCentralMember(m) || isUnitExecMember(m) || Boolean(m.subcommittee && m.subcommittee.trim());

  // Derived lists for Central Committee, CCC, ECC, and Unit Committees
  const centralCommitteeMembers = useMemo(
    () => members.filter(isCentralMember),
    [members]
  );

  const unitExecutiveMembers = useMemo(
    () => members.filter((m) => !isCentralMember(m) && isUnitExecMember(m)),
    [members]
  );

  const centralCoordinationMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          m.coordinationCommittee === 'Central Coordination Committee' ||
          m.committeeTier === 'Central Coordination'
      ),
    [members]
  );

  const executiveCoordinationMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          m.coordinationCommittee === 'Executive Coordination Committee' ||
          m.committeeTier === 'Executive Coordination'
      ),
    [members]
  );

  // Filtered rosters for display
  const filterRoster = (list: Member[]) => {
    return list.filter((m) => {
      const matchesUnit =
        unitFilter === 'All' || m.unit.toLowerCase() === unitFilter.toLowerCase();
      const q = rosterSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.membershipId.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q) ||
        (m.designation && m.designation.toLowerCase().includes(q)) ||
        (m.coordinationDesignation && m.coordinationDesignation.toLowerCase().includes(q)) ||
        m.phoneUAE.toLowerCase().includes(q);
      return matchesUnit && matchesSearch;
    });
  };

  const displayedCCC = useMemo(
    () => filterRoster(centralCoordinationMembers),
    [centralCoordinationMembers, unitFilter, rosterSearch]
  );

  const displayedECC = useMemo(
    () => filterRoster(executiveCoordinationMembers),
    [executiveCoordinationMembers, unitFilter, rosterSearch]
  );

  // Candidates in "Select from Existing Team" modal
  const candidateMembers = useMemo(() => {
    return members
      .filter((m) => {
        // Filter by source team pool
        if (sourceTeamFilter === 'central_only' && !isCentralMember(m)) return false;
        if (sourceTeamFilter === 'unit_exec_only' && !isUnitExecMember(m)) return false;
        if (sourceTeamFilter === 'committee_team' && !isExistingCommitteeTeamMember(m))
          return false;

        // Filter by unit in modal
        if (
          modalUnitFilter !== 'All' &&
          m.unit.toLowerCase() !== modalUnitFilter.toLowerCase()
        ) {
          return false;
        }

        // Filter by search query
        const q = modalSearchQuery.toLowerCase().trim();
        if (q) {
          const matches =
            m.fullName.toLowerCase().includes(q) ||
            m.membershipId.toLowerCase().includes(q) ||
            m.unit.toLowerCase().includes(q) ||
            (m.designation && m.designation.toLowerCase().includes(q)) ||
            (m.subcommittee && m.subcommittee.toLowerCase().includes(q)) ||
            m.phoneUAE.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Prioritize Central & Executive members with designations
        const aIsCentral = isCentralMember(a) ? 2 : isUnitExecMember(a) ? 1 : 0;
        const bIsCentral = isCentralMember(b) ? 2 : isUnitExecMember(b) ? 1 : 0;
        if (aIsCentral !== bIsCentral) return bIsCentral - aIsCentral;
        return a.fullName.localeCompare(b.fullName);
      });
  }, [members, sourceTeamFilter, modalUnitFilter, modalSearchQuery]);

  // Open modal helper
  const handleOpenSelectModal = (
    committee: 'Central Coordination Committee' | 'Executive Coordination Committee',
    defaultSource: SourceTeamFilter = 'committee_team'
  ) => {
    setTargetCommittee(committee);
    setSourceTeamFilter(defaultSource);
    setSelectedMemberIds([]);
    setSelectedRole(
      committee === 'Central Coordination Committee'
        ? 'Central Coordinator'
        : 'Executive Coordinator'
    );
    setIsCustomRole(false);
    setCustomRoleInput('');
    setCoordinationNotes('');
    setModalSearchQuery('');
    setModalUnitFilter('All');
    setIsSelectModalOpen(true);
  };

  // Toggle selection in modal
  const toggleSelectMemberId = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Assign selected existing team members to the chosen Coordination Committee
  const handleConfirmAssignMembers = () => {
    if (selectedMemberIds.length === 0) return;
    const finalRole =
      isCustomRole && customRoleInput.trim()
        ? customRoleInput.trim()
        : selectedRole || 'Coordinator';
    const today = new Date().toISOString().split('T')[0];

    const updatedList: Member[] = [];
    selectedMemberIds.forEach((id) => {
      const found = members.find((m) => m.id === id);
      if (found) {
        const updated: Member = {
          ...found,
          coordinationCommittee: targetCommittee,
          coordinationDesignation: finalRole,
          coordinationAssignedDate: today,
          coordinationNotes: coordinationNotes.trim() || found.coordinationNotes,
          updatedAt: new Date().toISOString(),
        };
        updatedList.push(updated);
      }
    });

    if (onBulkUpdateMembers && updatedList.length > 0) {
      onBulkUpdateMembers(updatedList);
    } else {
      updatedList.forEach((m) => onUpdateMember(m));
    }

    setIsSelectModalOpen(false);
    setSelectedMemberIds([]);
  };

  // Quick single-member assign from modal
  const handleQuickAssignSingle = (member: Member) => {
    const finalRole =
      isCustomRole && customRoleInput.trim()
        ? customRoleInput.trim()
        : selectedRole || 'Coordinator';
    const today = new Date().toISOString().split('T')[0];

    onUpdateMember({
      ...member,
      coordinationCommittee: targetCommittee,
      coordinationDesignation: finalRole,
      coordinationAssignedDate: today,
      coordinationNotes: coordinationNotes.trim() || member.coordinationNotes,
      updatedAt: new Date().toISOString(),
    });
  };

  // Switch member between Central Coordination Committee and Executive Coordination Committee
  const handleSwitchCoordinationCommittee = (
    member: Member,
    newCommittee: 'Central Coordination Committee' | 'Executive Coordination Committee'
  ) => {
    onUpdateMember({
      ...member,
      coordinationCommittee: newCommittee,
      updatedAt: new Date().toISOString(),
    });
  };

  // Remove member from Coordination Committee (keeps member in their existing Central/Unit team)
  const handleRemoveFromCoordination = (member: Member) => {
    onUpdateMember({
      ...member,
      coordinationCommittee: '',
      coordinationDesignation: '',
      committeeTier:
        member.committeeTier === 'Central Coordination'
          ? 'Central'
          : member.committeeTier === 'Executive Coordination'
          ? 'Unit'
          : member.committeeTier,
      updatedAt: new Date().toISOString(),
    });
  };

  // Save inline role edit
  const handleSaveInlineRole = (member: Member) => {
    onUpdateMember({
      ...member,
      coordinationDesignation: inlineRoleValue.trim() || 'Coordinator',
      updatedAt: new Date().toISOString(),
    });
    setEditingRoleMemberId(null);
  };

  // All known units for filter
  const allKnownUnits = useMemo(
    () => Array.from(new Set([...units, ...members.map((m) => m.unit)])),
    [units, members]
  );

  // Render a member card inside CCC or ECC roster
  const renderCoordinationMemberCard = (
    member: Member,
    committeeTheme: 'central' | 'executive'
  ) => {
    const isCentral = isCentralMember(member);
    const isUnitExec = isUnitExecMember(member);
    const isActive = isMemberEffectivelyActive(member);
    const isEditingRole = editingRoleMemberId === member.id;

    return (
      <div
        key={member.id}
        className={`p-4 rounded-xl border transition-all duration-200 bg-white shadow-xs hover:shadow-md ${
          committeeTheme === 'central'
            ? 'border-rose-200/80 hover:border-rose-300'
            : 'border-amber-200/80 hover:border-amber-300'
        }`}
      >
        <div className="flex items-start gap-3.5">
          {/* Member Photo */}
          <div
            onClick={() => onSelectMember && onSelectMember(member)}
            className="w-14 h-16 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 cursor-pointer relative group"
          >
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.fullName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display font-black text-base text-slate-400">
                {member.fullName.charAt(0)}
              </div>
            )}
            <span
              className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white ${
                isActive ? 'bg-emerald-500 shadow-xs' : 'bg-rose-500'
              }`}
              title={isActive ? 'Active Member' : 'Expired / Inactive'}
            />
          </div>

          {/* Member Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h5
                  onClick={() => onSelectMember && onSelectMember(member)}
                  className="font-display font-bold text-sm text-slate-900 truncate hover:text-[#8b0000] transition-colors cursor-pointer"
                >
                  {member.fullName}
                </h5>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-[11px] font-bold text-[#8b0000] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    {member.membershipId}
                  </span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {member.unit}
                  </span>
                </div>
              </div>

              {/* Source Team Pill */}
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                  isCentral
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    : isUnitExec
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isCentral
                  ? 'From Central Committee'
                  : isUnitExec
                  ? `From ${member.unit} Exec`
                  : `From ${member.unit} Unit`}
              </span>
            </div>

            {/* Coordination Role & Original Team Designation */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {isEditingRole ? (
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <select
                    value={
                      COORDINATION_COMMITTEE_DESIGNATIONS.includes(inlineRoleValue)
                        ? inlineRoleValue
                        : '__custom__'
                    }
                    onChange={(e) => {
                      if (e.target.value !== '__custom__') {
                        setInlineRoleValue(e.target.value);
                      }
                    }}
                    className="px-2 py-1 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {COORDINATION_COMMITTEE_DESIGNATIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                    <option value="__custom__">Custom Role...</option>
                  </select>
                  <input
                    type="text"
                    value={inlineRoleValue}
                    onChange={(e) => setInlineRoleValue(e.target.value)}
                    placeholder="Role title"
                    className="px-2 py-1 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-36"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveInlineRole(member)}
                    className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                    title="Save Role"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingRoleMemberId(null)}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                      committeeTheme === 'central'
                        ? 'bg-rose-50 text-[#8b0000] border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <Award className="w-3 h-3 shrink-0" />
                    <span>{member.coordinationDesignation || 'Coordinator'}</span>
                  </span>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRoleMemberId(member.id);
                        setInlineRoleValue(member.coordinationDesignation || 'Coordinator');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                      title="Change Coordination Role"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {member.designation && (
                <span className="text-[11px] text-slate-500 font-medium">
                  Team Role: <strong className="text-slate-800">{member.designation}</strong>
                </span>
              )}
            </div>

            {/* Bottom Contact & Action Bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{member.phoneUAE}</span>
              </div>

              <div className="flex items-center gap-1">
                {onSelectMember && (
                  <button
                    type="button"
                    onClick={() => onSelectMember(member)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="View Profile"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
                {onViewIdCard && (
                  <button
                    type="button"
                    onClick={() => onViewIdCard(member)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="View ID Card"
                  >
                    <IdCard className="w-3.5 h-3.5" />
                  </button>
                )}
                {onOpenWhatsApp && (
                  <button
                    type="button"
                    onClick={() => onOpenWhatsApp(member)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors cursor-pointer"
                    title="WhatsApp Member"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleSwitchCoordinationCommittee(
                          member,
                          committeeTheme === 'central'
                            ? 'Executive Coordination Committee'
                            : 'Central Coordination Committee'
                        )
                      }
                      className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                      title={
                        committeeTheme === 'central'
                          ? 'Move to Executive Coordination Committee'
                          : 'Move to Central Coordination Committee'
                      }
                    >
                      Move to {committeeTheme === 'central' ? 'ECC' : 'CCC'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCoordination(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Remove from Coordination Committee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans antialiased">
      {/* Top Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 relative overflow-hidden transition-all duration-300">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-[#8b0000] text-[11px] font-bold uppercase tracking-wider">
              <GitBranch className="w-3.5 h-3.5 text-[#8b0000]" />
              <span>Intermediate Governance &amp; Coordination Layer</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-slate-900">
              Coordination Committees (CCC &amp; ECC)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Strategic and executive bridge operating between the <strong className="text-[#8b0000]">Central Committee</strong> and <strong className="text-slate-800">Unit Committees</strong>. Select members directly from your existing Central and Unit Executive teams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowBlueprintDetails(!showBlueprintDetails)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
            >
              {showBlueprintDetails ? 'Hide Architecture Blueprint' : 'Show Architecture Blueprint'}
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenSelectModal('Central Coordination Committee', 'committee_team')
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8b0000] hover:bg-[#700000] font-bold text-xs text-white shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Select for Central Coordination</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleOpenSelectModal('Executive Coordination Committee', 'committee_team')
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Select for Executive Coordination</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Governance Architecture & Structure */}
      {showBlueprintDetails && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#8b0000] flex items-center justify-center border border-rose-200">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Governance Architecture &amp; Structure
                </h3>
                <p className="text-xs text-slate-500">
                  Two-stream coordination layer connecting Central Committee and Unit Committees
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-rose-50 text-[#8b0000] border border-rose-200">
              Total Selected: {centralCoordinationMembers.length + executiveCoordinationMembers.length}
            </span>
          </div>

          {/* Interactive Hierarchy Diagram */}
          <div className="flex flex-col items-center space-y-2 my-auto py-2">
            {/* TOP TIER: CENTRAL COMMITTEE */}
            <div className="w-full max-w-md p-4 rounded-xl bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-white border border-rose-800 shadow-md text-center relative">
              <div className="inline-flex items-center gap-1.5 text-rose-200 text-[10px] font-bold uppercase tracking-widest">
                <Crown className="w-3.5 h-3.5 text-rose-300" />
                <span>Apex Governing Body</span>
              </div>
              <div className="font-display font-black text-base mt-0.5 text-white">
                Central Committee
              </div>
              <div className="text-[11px] text-rose-200 mt-1 flex items-center justify-center gap-3">
                <span>{centralCommitteeMembers.length} Central Members</span>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenSelectModal('Central Coordination Committee', 'central_only')
                  }
                  className="text-white hover:underline font-semibold cursor-pointer"
                >
                  Select from Central &rarr;
                </button>
              </div>
            </div>

            {/* Connector Down from Central to Split Coordination Layer */}
            <div className="flex flex-col items-center w-full max-w-lg">
              <div className="w-0.5 h-4 bg-slate-300" />
              <div className="w-2/3 h-0.5 bg-slate-300" />
              <div className="w-2/3 flex justify-between">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-rose-700" />
                  <ArrowDown className="w-3.5 h-3.5 text-rose-700 -mt-1" />
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-amber-600" />
                  <ArrowDown className="w-3.5 h-3.5 text-amber-600 -mt-1" />
                </div>
              </div>
            </div>

            {/* MIDDLE TIER: CENTRAL COORDINATION COMMITTEE & EXECUTIVE COORDINATION COMMITTEE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
              {/* Left Box: Central Coordination Committee */}
              <div
                onClick={() => setActiveCommitteeTab('central_coord')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center ${
                  activeCommitteeTab === 'central_coord'
                    ? 'border-rose-700 bg-rose-50/70 shadow-xs'
                    : 'border-rose-200 bg-rose-50/20 hover:border-rose-400'
                }`}
              >
                <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8b0000] bg-rose-100 border border-rose-200 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3 text-[#8b0000]" />
                  <span>Central Coordination (CCC)</span>
                </div>
                <div className="font-display font-black text-sm sm:text-base text-slate-900 mt-1.5">
                  Central Coordination Committee
                </div>
                <div className="font-mono font-black text-xl text-[#8b0000] mt-1">
                  {centralCoordinationMembers.length}{' '}
                  <span className="text-xs font-sans font-semibold text-slate-500">Members</span>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenSelectModal('Central Coordination Committee', 'committee_team');
                    }}
                    className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-[#8b0000] hover:bg-[#700000] text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                  >
                    + Select from Existing Team
                  </button>
                )}
              </div>

              {/* Right Box: Executive Coordination Committee */}
              <div
                onClick={() => setActiveCommitteeTab('exec_coord')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-center ${
                  activeCommitteeTab === 'exec_coord'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                    : 'border-amber-200 bg-amber-50/20 hover:border-amber-400'
                }`}
              >
                <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                  <Award className="w-3 h-3" />
                  <span>Operational Layer (ECC)</span>
                </div>
                <div className="font-display font-black text-sm sm:text-base text-slate-900 mt-1.5">
                  Executive Coordination Committee
                </div>
                <div className="font-mono font-black text-xl text-amber-800 mt-1">
                  {executiveCoordinationMembers.length}{' '}
                  <span className="text-xs font-sans font-semibold text-slate-500">Members</span>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenSelectModal('Executive Coordination Committee', 'committee_team');
                    }}
                    className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    + Select from Existing Team
                  </button>
                )}
              </div>
            </div>

            {/* Connector Down from Split Coordination Layer to Unit Committees */}
            <div className="flex flex-col items-center w-full max-w-lg">
              <div className="w-2/3 flex justify-between">
                <div className="w-0.5 h-3 bg-rose-700" />
                <div className="w-0.5 h-3 bg-amber-600" />
              </div>
              <div className="w-2/3 h-0.5 bg-slate-300" />
              <div className="w-0.5 h-3 bg-slate-300" />
              <ArrowDown className="w-3.5 h-3.5 text-slate-500 -mt-1" />
            </div>

            {/* BOTTOM TIER: UNIT COMMITTEES */}
            <div className="w-full max-w-md p-4 rounded-xl bg-slate-50 border border-slate-200 text-center shadow-xs">
              <div className="inline-flex items-center gap-1.5 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Regional Execution Units</span>
              </div>
              <div className="font-display font-black text-base text-slate-900 mt-0.5">
                Unit Committees ({units.filter((u) => !u.toLowerCase().startsWith('central')).length} Units)
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center justify-center gap-2">
                <span>{unitExecutiveMembers.length} Unit Executive Members</span>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenSelectModal('Executive Coordination Committee', 'unit_exec_only')
                  }
                  className="text-[#8b0000] hover:underline font-bold cursor-pointer"
                >
                  Select from Unit Exec &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & View Switcher Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Committee View Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveCommitteeTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCommitteeTab === 'all'
                ? 'bg-[#8b0000] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Both Committees ({centralCoordinationMembers.length + executiveCoordinationMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCommitteeTab('central_coord')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCommitteeTab === 'central_coord'
                ? 'bg-[#8b0000] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Central Coordination ({centralCoordinationMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCommitteeTab('exec_coord')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCommitteeTab === 'exec_coord'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
            }`}
          >
            Executive Coordination ({executiveCoordinationMembers.length})
          </button>
        </div>

        {/* Right: Unit Filter & Search */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 sm:flex-initial justify-end">
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] cursor-pointer"
          >
            <option value="All">All Units</option>
            {allKnownUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              placeholder="Search coordinator by name, ID, role..."
              className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
            />
            {rosterSearch && (
              <button
                type="button"
                onClick={() => setRosterSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Committee Rosters Grid */}
      <div
        className={`grid grid-cols-1 gap-6 ${
          activeCommitteeTab === 'all' ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
        }`}
      >
        {/* PANEL 1: CENTRAL COORDINATION COMMITTEE (CCC) */}
        {(activeCommitteeTab === 'all' || activeCommitteeTab === 'central_coord') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-rose-50/90 to-white border-b border-rose-200/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8b0000] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Crown className="w-5 h-5 text-rose-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-slate-900">
                      Central Coordination Committee (CCC)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-100 text-[#8b0000] border border-rose-200">
                      {displayedCCC.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Strategic coordination between Central Committee &amp; Unit Leadership
                  </p>
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenSelectModal('Central Coordination Committee', 'committee_team')
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8b0000] hover:bg-[#700000] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Select from Existing Team</span>
                </button>
              )}
            </div>

            <div className="p-5 flex-1">
              {displayedCCC.length > 0 ? (
                <div
                  className={`grid grid-cols-1 gap-3.5 ${
                    activeCommitteeTab === 'central_coord' ? 'md:grid-cols-2' : ''
                  }`}
                >
                  {displayedCCC.map((m) => renderCoordinationMemberCard(m, 'central'))}
                </div>
              ) : (
                <div className="py-12 px-4 text-center border-2 border-dashed border-rose-200 rounded-2xl bg-rose-50/30 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-[#8b0000] flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="max-w-sm mx-auto">
                    <h4 className="font-display font-bold text-sm text-slate-900">
                      No Members Assigned to Central Coordination Yet
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Select members from your existing Central Committee or Unit Leadership team to form the Central Coordination Committee.
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenSelectModal('Central Coordination Committee', 'central_only')
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8b0000] hover:bg-[#700000] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Select from Central Committee</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenSelectModal('Central Coordination Committee', 'committee_team')
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Select from Full Existing Team</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 2: EXECUTIVE COORDINATION COMMITTEE (ECC) */}
        {(activeCommitteeTab === 'all' || activeCommitteeTab === 'exec_coord') && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-amber-50/90 to-white dark:from-amber-950/40 dark:to-slate-900 border-b border-amber-200/70 dark:border-amber-900/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Executive Coordination Committee (ECC)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200">
                      {displayedECC.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Operational &amp; executive coordination across Unit Executive teams
                  </p>
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenSelectModal('Executive Coordination Committee', 'committee_team')
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Select from Existing Team</span>
                </button>
              )}
            </div>

            <div className="p-5 flex-1">
              {displayedECC.length > 0 ? (
                <div
                  className={`grid grid-cols-1 gap-3.5 ${
                    activeCommitteeTab === 'exec_coord' ? 'md:grid-cols-2' : ''
                  }`}
                >
                  {displayedECC.map((m) => renderCoordinationMemberCard(m, 'executive'))}
                </div>
              ) : (
                <div className="py-12 px-4 text-center border-2 border-dashed border-amber-200/70 dark:border-amber-900/40 rounded-xl bg-amber-50/20 dark:bg-amber-950/10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="max-w-sm mx-auto">
                    <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                      No Members Assigned to Executive Coordination Yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Select members from your existing Unit Executive Committees or Central Executive team to form the Executive Coordination Committee.
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenSelectModal('Executive Coordination Committee', 'unit_exec_only')
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Select from Unit Executive Team</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenSelectModal('Executive Coordination Committee', 'committee_team')
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Select from Full Existing Team</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: SELECT COORDINATION COMMITTEE MEMBERS FROM EXISTING TEAM */}
      {isSelectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                targetCommittee === 'Central Coordination Committee'
                  ? 'bg-gradient-to-r from-[#8b0000] via-[#a00000] to-[#700000]'
                  : 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-white">
                    Select Members from Existing Team
                  </h3>
                  <p className="text-xs text-rose-100">
                    Assign existing Central Committee, Unit Executive, or KCA members to{' '}
                    <strong className="text-white underline">{targetCommittee}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls: Step 1 (Target Committee & Role) + Step 2 (Source Team Filter) */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target Coordination Committee Switcher */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    1. Target Coordination Committee
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetCommittee('Central Coordination Committee');
                        setSelectedRole('Central Coordinator');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                        targetCommittee === 'Central Coordination Committee'
                          ? 'bg-[#8b0000] text-white font-bold border-[#8b0000] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold">Central Coordination</div>
                      <div className="text-[10px] opacity-80 font-normal">
                        Central Coordination (CCC)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTargetCommittee('Executive Coordination Committee');
                        setSelectedRole('Executive Coordinator');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                        targetCommittee === 'Executive Coordination Committee'
                          ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold">Executive Coordination</div>
                      <div className="text-[10px] opacity-80 font-normal">
                        Operational Layer (ECC)
                      </div>
                    </button>
                  </div>
                </div>

                {/* Coordination Role / Designation */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      2. Coordination Role / Designation
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomRole(!isCustomRole)}
                      className="text-[11px] font-bold text-[#881337] dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      {isCustomRole ? 'Choose Preset Role' : '+ Custom Role'}
                    </button>
                  </div>
                  {isCustomRole ? (
                    <input
                      type="text"
                      value={customRoleInput}
                      onChange={(e) => setCustomRoleInput(e.target.value)}
                      placeholder="Enter custom coordination role (e.g. Zonal Coordinator)"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  ) : (
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      {COORDINATION_COMMITTEE_DESIGNATIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Source Team Filter Tabs + Search + Unit Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/70">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">Source Team:</span>
                  <button
                    type="button"
                    onClick={() => setSourceTeamFilter('committee_team')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      sourceTeamFilter === 'committee_team'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Central &amp; Unit Exec Team (
                    {members.filter(isExistingCommitteeTeamMember).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceTeamFilter('central_only')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      sourceTeamFilter === 'central_only'
                        ? 'bg-purple-700 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Central Committee ({centralCommitteeMembers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceTeamFilter('unit_exec_only')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      sourceTeamFilter === 'unit_exec_only'
                        ? 'bg-blue-700 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Unit Executive ({unitExecutiveMembers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceTeamFilter('all_members')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      sourceTeamFilter === 'all_members'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    All KCA Members ({members.length})
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <select
                    value={modalUnitFilter}
                    onChange={(e) => setModalUnitFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="All">All Units</option>
                    {allKnownUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      placeholder="Search existing member..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Members List */}
            <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100 dark:divide-slate-800">
              {candidateMembers.length > 0 ? (
                candidateMembers.map((m) => {
                  const isSelected = selectedMemberIds.includes(m.id);
                  const alreadyInTarget = m.coordinationCommittee === targetCommittee;
                  const alreadyInOther =
                    m.coordinationCommittee && m.coordinationCommittee !== targetCommittee;
                  const isCentral = isCentralMember(m);
                  const isUnitExec = isUnitExecMember(m);

                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleSelectMemberId(m.id)}
                      className={`py-3 px-3.5 flex items-center justify-between gap-3 rounded-xl transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-rose-50/80 border-rose-200 shadow-xs'
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded accent-[#8b0000] cursor-pointer"
                        />
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-700">
                          {m.photoUrl ? (
                            <img
                              src={m.photoUrl}
                              alt={m.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            m.fullName.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {m.fullName}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-[#8b0000] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              {m.membershipId}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isCentral
                                  ? 'bg-rose-50 text-[#8b0000] border border-rose-200'
                                  : isUnitExec
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isCentral
                                ? 'Central Committee'
                                : isUnitExec
                                ? `${m.unit} Executive`
                                : `${m.unit} Member`}
                            </span>
                            {m.designation && (
                              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                {m.designation}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Unit: {m.unit}</span>
                            <span>&bull;</span>
                            <span>{m.phoneUAE}</span>
                            {alreadyInTarget && (
                              <span className="text-emerald-400 font-bold">
                                &bull; Already in {targetCommittee} ({m.coordinationDesignation || 'Member'})
                              </span>
                            )}
                            {alreadyInOther && (
                              <span className="text-amber-400 font-bold">
                                &bull; Currently in {m.coordinationCommittee}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAssignSingle(m);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                          alreadyInTarget
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-[#8b0000] hover:bg-[#700000] text-white shadow-xs'
                        }`}
                      >
                        {alreadyInTarget ? 'Update Role' : '+ Assign Now'}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                  <p>No team members match the current filter.</p>
                  {sourceTeamFilter !== 'all_members' && (
                    <button
                      type="button"
                      onClick={() => setSourceTeamFilter('all_members')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold cursor-pointer"
                    >
                      Show All KCA Members ({members.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-700">
                Selected: <strong className="text-[#8b0000] font-mono">{selectedMemberIds.length}</strong> member(s) for{' '}
                <strong className="text-slate-900">{targetCommittee}</strong>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSelectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={selectedMemberIds.length === 0}
                  onClick={handleConfirmAssignMembers}
                  className="px-5 py-2 rounded-xl bg-[#8b0000] hover:bg-[#700000] disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Assign Selected ({selectedMemberIds.length}) to {targetCommittee === 'Central Coordination Committee' ? 'CCC' : 'ECC'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
