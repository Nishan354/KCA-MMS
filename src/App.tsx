import React, { useState, useEffect, useMemo } from 'react';
import {
  Member,
  AuditLogItem,
  UserSession,
  CustomFieldDefinition,
  AdminAccount,
  hasAdminPrivilege,
  isUnitOperatorRole,
  MemberDocument,
} from './types/member';
import {
  FinanceTransaction,
  TransactionType,
} from './types/finance';
import {
  InventoryItem,
  InventoryMovementLog,
} from './types/inventory';
import {
  CulturalClass,
  ClassParticipant,
  ClassAttendanceRecord,
} from './types/classes';
import {
  INITIAL_MEMBERS,
  INITIAL_UNITS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_ADMIN_ACCOUNTS,
} from './data/initialData';
import {
  saveMembersToStorage,
  loadMembersFromStorage,
  saveAuditLogs,
  loadAuditLogs,
  loadCustomFields,
  saveCustomFields,
  saveAdminAccounts,
  loadAdminAccounts,
  saveActiveUserSession,
  loadActiveUserSession,
  clearActiveUserSession,
  saveCustomLogo,
} from './utils/storage';
import { hydrateMissingPhotosFromDb, optimizeExistingMemberPhotos, loadMembersFromIndexedDb } from './utils/indexedDbStorage';
import {
  loadFinanceTransactions,
  saveFinanceTransactions,
  loadFinancialParticulars,
  getFinanceLedgerUnitForMember,
  isCentralCommitteeMember,
} from './utils/financeStorage';
import {
  loadInventoryItems,
  saveInventoryItems,
  loadInventoryLogs,
  saveInventoryLogs,
} from './utils/inventoryStorage';
import {
  loadClasses,
  saveClasses,
  loadParticipants,
  saveParticipants,
  loadAttendance,
  saveAttendance,
} from './utils/classesStorage';
import {
  loadContacts,
  saveContacts,
} from './utils/contactStorage';
import { ContactEntry } from './types/contact';
import { GeneralDocument } from './types/document';
import { loadDocuments, saveDocuments } from './utils/documentStorage';
import {
  startCloudSyncManager,
  pushCloudEntity,
  pushFullRestore,
  fetchCloudState,
} from './utils/cloudSync';

import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { MemberTable } from './components/MemberTable';
import { ContactBankView } from './components/ContactBankView';
import { IdCardsView } from './components/IdCardsView';
import { FinanceView } from './components/FinanceView';
import { InventoryView } from './components/InventoryView';
import { ClassesView } from './components/ClassesView';
import { BloodDonorDirectory } from './components/BloodDonorDirectory';
import { BackupAndStorageModal } from './components/BackupAndStorageModal';
import { QrScannerModal } from './components/QrScannerModal';
import { MemberFormModal } from './components/MemberFormModal';
import { MemberDetailsModal } from './components/MemberDetailsModal';
import { IdCardModal } from './components/IdCardModal';
import { ReceiptModal } from './components/ReceiptModal';
import { BatchPrintModal } from './components/BatchPrintModal';
import { UnitManagerModal } from './components/UnitManagerModal';
import { FieldManagerModal } from './components/FieldManagerModal';
import { AdminManagerModal } from './components/AdminManagerModal';
import { LoginModal } from './components/LoginModal';
import { LandingPage } from './components/LandingPage';
import { LogoManagerModal } from './components/LogoManagerModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { MailboxModal } from './components/MailboxModal';
import { PublicVerifyCardView } from './components/PublicVerifyCardView';
import { ReportGeneratorModal } from './components/ReportGeneratorModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { FinanceFormModal } from './components/FinanceFormModal';
import { FinanceReceiptModal } from './components/FinanceReceiptModal';
import { InventoryItemModal } from './components/InventoryItemModal';
import { InventoryIssueModal } from './components/InventoryIssueModal';
import { ClassFormModal } from './components/ClassFormModal';
import { ParticipantFormModal } from './components/ParticipantFormModal';
import { AttendanceModal } from './components/AttendanceModal';
import { ContactFormModal } from './components/ContactFormModal';
import { CertificateGeneratorModal } from './components/CertificateGeneratorModal';
import { LetterPadView } from './components/LetterPadView';
import { DocumentsView } from './components/DocumentsView';
import { DocumentFormModal } from './components/DocumentFormModal';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';

import { loadSavedTheme, applyThemeToCss, getIsDarkMode } from './utils/theme';
import { decodeMemberFromPayload, createFullMemberFromPartial, getRenewalExpiryDate, isMemberEffectivelyActive } from './utils/idGenerator';

const STORAGE_KEY_UNITS = 'kca_fujairah_units_v1';
const SYNC_CHANNEL_NAME = 'kca_fujairah_sync_channel';

interface ParsedVerifyResult {
  id: string;
  showReceipt: boolean;
  embeddedMember?: Partial<Member> | null;
}

function parseVerifyFromUrl(): ParsedVerifyResult | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Search Query Parameters: ?verify=... or ?id=... or ?m=... or ?member=...
    const searchParams = new URLSearchParams(window.location.search);
    let id =
      searchParams.get('verify') ||
      searchParams.get('id') ||
      searchParams.get('m') ||
      searchParams.get('member') ||
      searchParams.get('membershipId') ||
      searchParams.get('card') ||
      searchParams.get('v');
    let isReceipt =
      searchParams.get('receipt') === '1' ||
      searchParams.get('receipt') === 'true' ||
      searchParams.get('tab') === 'receipt';
    let dataPayload = searchParams.get('d') || searchParams.get('data');

    // 2. Hash-based queries: e.g. #?verify=... or #verify=... or #/verify/KCA-FU-1001
    if (!id && window.location.hash) {
      const hash = window.location.hash;
      const hashSearchIndex = hash.indexOf('?');
      if (hashSearchIndex !== -1) {
        const hashParams = new URLSearchParams(hash.substring(hashSearchIndex));
        id =
          hashParams.get('verify') ||
          hashParams.get('id') ||
          hashParams.get('m') ||
          hashParams.get('member') ||
          hashParams.get('membershipId') ||
          hashParams.get('card') ||
          hashParams.get('v');
        if (!isReceipt) {
          isReceipt =
            hashParams.get('receipt') === '1' ||
            hashParams.get('receipt') === 'true' ||
            hashParams.get('tab') === 'receipt';
        }
        if (!dataPayload) {
          dataPayload = hashParams.get('d') || hashParams.get('data');
        }
      }

      if (!id) {
        const cleanHash = hash.replace(/^#\/?/, '').trim();
        if (
          cleanHash.startsWith('verify/') ||
          cleanHash.startsWith('id/') ||
          cleanHash.startsWith('card/')
        ) {
          id = cleanHash.split('/')[1];
        } else if (
          /^(KCA-)?[A-Z]{2}-?\d+/i.test(cleanHash) ||
          /^FU\d+/i.test(cleanHash) ||
          /^\d{4,}$/.test(cleanHash)
        ) {
          id = cleanHash;
        }
      }
    }

    // 3. Pathname: e.g. /verify/KCA-FU-1001 or /id/KCA-FU-1001
    if (!id && window.location.pathname) {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (
        pathParts.length >= 2 &&
        (pathParts[0] === 'verify' || pathParts[0] === 'id' || pathParts[0] === 'card')
      ) {
        id = pathParts[1];
      }
    }

    let embeddedMember: Partial<Member> | null = null;
    if (dataPayload) {
      embeddedMember = decodeMemberFromPayload(dataPayload);
    }

    if (id && id.trim()) {
      return { id: decodeURIComponent(id).trim(), showReceipt: isReceipt, embeddedMember };
    }
  } catch (e) {
    console.error('Error parsing verification query from URL:', e);
  }
  return null;
}

export default function App() {
  // Check if current URL is for Digital ID or Receipt verification: e.g. ?verify=KCA-FU-1001
  const [verifyQuery, setVerifyQuery] = useState<ParsedVerifyResult | null>(() => {
    return parseVerifyFromUrl();
  });

  // Admin Accounts list state (Stored in persistent local storage)
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>(() => {
    const saved = loadAdminAccounts();
    return saved && saved.length > 0 ? saved : INITIAL_ADMIN_ACCOUNTS;
  });

  // Authentication State - Enforce proper authentication without auto-login bypass
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    const saved = loadActiveUserSession();
    if (saved && saved.isLoggedIn) return saved;
    return null;
  });

  const [showLoginModal, setShowLoginModal] = useState<boolean>(() => {
    const saved = loadActiveUserSession();
    return !saved || !saved.isLoggedIn;
  });

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Members Database & State
  const [members, setMembers] = useState<Member[]>(() => {
    const loaded = loadMembersFromStorage();
    return loaded && loaded.length > 0 ? loaded : INITIAL_MEMBERS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const loaded = loadAuditLogs();
    return loaded && loaded.length > 0 ? loaded : INITIAL_AUDIT_LOGS;
  });

  // Units list state with persistent storage: Fujairah, Kalba, Khorfakhan, Dibba
  const [units, setUnits] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_UNITS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_UNITS;
  });

  // Dynamic Custom Field Definitions State
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(() => {
    const loaded = loadCustomFields();
    return loaded && loaded.length > 0 ? loaded : INITIAL_CUSTOM_FIELDS;
  });

  // ---------------- FINANCE STATE ----------------
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>(() => {
    return loadFinanceTransactions();
  });
  const [showFinanceFormModal, setShowFinanceFormModal] = useState(false);
  const [editingFinanceTransaction, setEditingFinanceTransaction] = useState<FinanceTransaction | null>(null);
  const [newFinanceInitialType, setNewFinanceInitialType] = useState<TransactionType>('INCOME');
  const [selectedFinanceReceipt, setSelectedFinanceReceipt] = useState<FinanceTransaction | null>(null);
  const [showFinanceReceiptModal, setShowFinanceReceiptModal] = useState(false);

  // ---------------- INVENTORY STATE ----------------
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    return loadInventoryItems();
  });
  const [inventoryLogs, setInventoryLogs] = useState<InventoryMovementLog[]>(() => {
    return loadInventoryLogs();
  });
  const [showInventoryItemModal, setShowInventoryItemModal] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [showInventoryIssueModal, setShowInventoryIssueModal] = useState(false);
  const [targetIssueItem, setTargetIssueItem] = useState<InventoryItem | null>(null);

  // ---------------- CLASSES & ATTENDANCE STATE ----------------
  const [classes, setClasses] = useState<CulturalClass[]>(() => {
    return loadClasses();
  });
  const [classParticipants, setClassParticipants] = useState<ClassParticipant[]>(() => {
    return loadParticipants();
  });
  const [classAttendance, setClassAttendance] = useState<ClassAttendanceRecord[]>(() => {
    return loadAttendance();
  });
  const [showClassFormModal, setShowClassFormModal] = useState(false);
  const [editingClass, setEditingClass] = useState<CulturalClass | null>(null);
  const [showParticipantFormModal, setShowParticipantFormModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<ClassParticipant | null>(null);
  const [participantPreselectedClassId, setParticipantPreselectedClassId] = useState<string | undefined>(undefined);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [targetAttendanceClass, setTargetAttendanceClass] = useState<CulturalClass | null>(null);

  // ---------------- CONTACT BANK STATE ----------------
  const [contacts, setContacts] = useState<ContactEntry[]>(() => {
    return loadContacts();
  });
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactEntry | null>(null);

  // ---------------- GENERAL DOCUMENTS STORE STATE ----------------
  const [documents, setDocuments] = useState<GeneralDocument[]>(() => {
    return loadDocuments();
  });
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<GeneralDocument | null>(null);
  const [previewDocument, setPreviewDocument] = useState<GeneralDocument | null>(null);
  const [showDocumentPreviewModal, setShowDocumentPreviewModal] = useState(false);

  const handleSaveDocument = (doc: GeneralDocument) => {
    setDocuments((prev) => {
      const idx = prev.findIndex((d) => d.id === doc.id);
      let updated: GeneralDocument[];
      if (idx >= 0) {
        updated = prev.map((d, i) => (i === idx ? doc : d));
      } else {
        updated = [doc, ...prev];
      }
      saveDocuments(updated);
      return updated;
    });
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      saveDocuments(updated);
      return updated;
    });
  };

  // Modals and Active Member State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const [idCardMember, setIdCardMember] = useState<Member | null>(null);
  const [showIdCardModal, setShowIdCardModal] = useState(false);

  const [receiptMember, setReceiptMember] = useState<Member | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [batchPrintMembers, setBatchPrintMembers] = useState<Member[]>([]);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);

  const [showBloodDirectory, setShowBloodDirectory] = useState(false);
  const [selectedBloodGroupFilter, setSelectedBloodGroupFilter] = useState<string>('ALL');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showUnitManagerModal, setShowUnitManagerModal] = useState(false);
  const [showFieldManagerModal, setShowFieldManagerModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showAdminManagerModal, setShowAdminManagerModal] = useState(false);

  // New Modals: Change Password, WhatsApp, Mailbox, Reports, Theme Customizer
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppTargetMember, setWhatsAppTargetMember] = useState<Member | undefined>(undefined);
  const [showMailboxModal, setShowMailboxModal] = useState(false);
  const [showReportGeneratorModal, setShowReportGeneratorModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certRecipientName, setCertRecipientName] = useState('');
  const [certMemberId, setCertMemberId] = useState('');
  const [certCitation, setCertCitation] = useState('');
  const [certUnit, setCertUnit] = useState('Fujairah');
  const [certCourse, setCertCourse] = useState('');
  const [bulkSelectedMembersForCert, setBulkSelectedMembersForCert] = useState<Member[]>([]);

  // If embedded member payload was passed in the verification link, save/merge into local state
  useEffect(() => {
    if (verifyQuery?.embeddedMember && (verifyQuery.embeddedMember.membershipId || verifyQuery.embeddedMember.id)) {
      const emb = verifyQuery.embeddedMember;
      setMembers((prev) => {
        const embMId = (emb.membershipId || '').toLowerCase();
        const idx = prev.findIndex(
          (m) =>
            (emb.id && m.id === emb.id) ||
            (embMId && m.membershipId.toLowerCase() === embMId)
        );
        let updated: Member[];
        if (idx >= 0) {
          const cleanEmb = Object.fromEntries(
            Object.entries(emb).filter(([_, v]) => v !== undefined && v !== null && v !== '')
          );
          updated = prev.map((m, i) =>
            i === idx
              ? {
                  ...m,
                  ...cleanEmb,
                  id: m.id,
                  membershipId: m.membershipId,
                  updatedAt: new Date().toISOString(),
                }
              : m
          );
        } else {
          const fullNew = createFullMemberFromPartial(emb);
          updated = [fullNew, ...prev];
        }
        saveMembersToStorage(updated);
        return updated;
      });
    }
  }, [verifyQuery]);

  // Listen for browser popstate / url changes
  useEffect(() => {
    const handleUrlChange = () => {
      const parsed = parseVerifyFromUrl();
      if (parsed) {
        setVerifyQuery(parsed);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Apply active theme and dark/light mode on initial mount
  useEffect(() => {
    applyThemeToCss(loadSavedTheme());
    const isDark = getIsDarkMode();
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Centralized Live Cloud Sync Manager (Multi-User / Multi-Location / Multi-Device)
  useEffect(() => {
    const unsubscribe = startCloudSyncManager((cloudState) => {
      if (cloudState) {
        if (Array.isArray(cloudState.members)) {
          setMembers(cloudState.members);
          saveMembersToStorage(cloudState.members);
        }
        if (Array.isArray(cloudState.financeTransactions)) {
          setFinanceTransactions(cloudState.financeTransactions);
          saveFinanceTransactions(cloudState.financeTransactions);
        }
        if (Array.isArray(cloudState.inventoryItems)) {
          setInventoryItems(cloudState.inventoryItems);
          saveInventoryItems(cloudState.inventoryItems);
        }
        if (Array.isArray(cloudState.inventoryLogs)) {
          setInventoryLogs(cloudState.inventoryLogs);
          saveInventoryLogs(cloudState.inventoryLogs);
        }
        if (Array.isArray(cloudState.adminAccounts) && cloudState.adminAccounts.length > 0) {
          setAdminAccounts(cloudState.adminAccounts);
          saveAdminAccounts(cloudState.adminAccounts);
        }
        if (Array.isArray(cloudState.auditLogs)) {
          setAuditLogs(cloudState.auditLogs);
          saveAuditLogs(cloudState.auditLogs);
        }
        if (Array.isArray(cloudState.units) && cloudState.units.length > 0) {
          setUnits(cloudState.units);
          try {
            localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(cloudState.units));
          } catch {}
        }
        if (Array.isArray(cloudState.customFields) && cloudState.customFields.length > 0) {
          setCustomFields(cloudState.customFields);
          saveCustomFields(cloudState.customFields);
        }
        if (Array.isArray(cloudState.classes)) {
          setClasses(cloudState.classes);
          saveClasses(cloudState.classes);
        }
        if (Array.isArray(cloudState.classParticipants)) {
          setClassParticipants(cloudState.classParticipants);
          saveParticipants(cloudState.classParticipants);
        }
        if (Array.isArray(cloudState.classAttendance)) {
          setClassAttendance(cloudState.classAttendance);
          saveAttendance(cloudState.classAttendance);
        }
        if (cloudState.customLogoUrl !== undefined) {
          saveCustomLogo(cloudState.customLogoUrl);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userSession?.username]);

  // Cross-Tab / Cross-Device Real-Time Sync Channel & Storage Listeners
  useEffect(() => {
    const handleSyncPayload = (type?: string) => {
      if (!type || type === 'MEMBERS_SYNC' || type === 'ALL_SYNC') {
        const freshMembers = loadMembersFromStorage();
        if (freshMembers) setMembers(freshMembers);
      }
      if (!type || type === 'ACCOUNTS_SYNC' || type === 'ALL_SYNC') {
        const freshAccounts = loadAdminAccounts();
        if (freshAccounts) setAdminAccounts(freshAccounts);
      }
      if (!type || type === 'FINANCE_SYNC' || type === 'ALL_SYNC') {
        const freshFinance = loadFinanceTransactions();
        if (freshFinance) setFinanceTransactions(freshFinance);
      }
      if (!type || type === 'INVENTORY_SYNC' || type === 'ALL_SYNC') {
        const freshInv = loadInventoryItems();
        if (freshInv) setInventoryItems(freshInv);
        const freshLogs = loadInventoryLogs();
        if (freshLogs) setInventoryLogs(freshLogs);
      }
      if (!type || type === 'CLASSES_SYNC' || type === 'ALL_SYNC') {
        const freshClasses = loadClasses();
        if (freshClasses) setClasses(freshClasses);
        const freshParticipants = loadParticipants();
        if (freshParticipants) setClassParticipants(freshParticipants);
        const freshAtt = loadAttendance();
        if (freshAtt) setClassAttendance(freshAtt);
      }
      if (!type || type === 'UNITS_SYNC' || type === 'ALL_SYNC') {
        try {
          const raw = localStorage.getItem(STORAGE_KEY_UNITS);
          if (raw) setUnits(JSON.parse(raw));
        } catch {}
      }
      if (!type || type === 'FIELDS_SYNC' || type === 'ALL_SYNC') {
        const freshFields = loadCustomFields();
        if (freshFields) setCustomFields(freshFields);
      }
      if (!type || type === 'CONTACTS_SYNC' || type === 'ALL_SYNC') {
        const freshContacts = loadContacts();
        if (freshContacts) setContacts(freshContacts);
      }
      if (!type || type === 'DOCUMENTS_SYNC' || type === 'ALL_SYNC') {
        const freshDocs = loadDocuments();
        if (freshDocs) setDocuments(freshDocs);
      }
      if (!type || type === 'AUDIT_SYNC' || type === 'ALL_SYNC') {
        const freshLogs = loadAuditLogs();
        if (freshLogs) setAuditLogs(freshLogs);
      }
    };

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.onmessage = (event) => {
        handleSyncPayload(event.data?.type);
      };
    }

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key && event.key.startsWith('kca_')) {
        handleSyncPayload('ALL_SYNC');
      }
    };

    const handleCustomSync = (event: Event) => {
      const customEvt = event as CustomEvent;
      handleSyncPayload(customEvt?.detail?.type);
    };

    const handleFullSystemRestored = () => {
      handleSyncPayload('ALL_SYNC');
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('kca_fujairah_sync', handleCustomSync);
    window.addEventListener('kca-full-system-restored', handleFullSystemRestored);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('kca_fujairah_sync', handleCustomSync);
      window.removeEventListener('kca-full-system-restored', handleFullSystemRestored);
    };
  }, []);

  // Hydrate missing photos from persistent IndexedDB and optimize heavy historical images
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let currentList = members;

        // Step 0: If localStorage members was empty, restore full database from IndexedDB
        if (currentList.length === 0) {
          const idbMembers = await loadMembersFromIndexedDb();
          if (idbMembers && idbMembers.length > 0) {
            currentList = idbMembers;
          }
        }

        // Step 1: Hydrate any missing photos from IndexedDB
        const { hydratedMembers, restoredCount } = await hydrateMissingPhotosFromDb(currentList);
        currentList = hydratedMembers;

        // Step 2: Auto-optimize any legacy oversized images (>40KB) and mirror to IndexedDB
        const { members: optimizedMembers, optimizedCount } = await optimizeExistingMemberPhotos(currentList);
        if (optimizedCount > 0) {
          currentList = optimizedMembers;
        }

        if (isMounted && (restoredCount > 0 || optimizedCount > 0 || (members.length === 0 && currentList.length > 0))) {
          setMembers(currentList);
          saveMembersToStorage(currentList);
          console.log(`[Storage] Photo persistence active: ${restoredCount} restored from IndexedDB, ${optimizedCount} compressed.`);
        }
      } catch (err) {
        console.warn('Storage photo hydration notice:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const broadcastSync = (type: string) => {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
          channel.postMessage({ type, timestamp: Date.now() });
          channel.close();
        }
        window.dispatchEvent(new CustomEvent('kca_fujairah_sync', { detail: { type, timestamp: Date.now() } }));
      } catch {}
    }
  };

  // Sync userSession with storage
  useEffect(() => {
    if (userSession) {
      saveActiveUserSession(userSession);
    }
  }, [userSession]);

  const isAdmin = !userSession || hasAdminPrivilege(userSession.role);
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);
  const assignedUnit = userSession?.unit;

  // Filtered members by Role and Unit scope
  const visibleMembers = useMemo(() => {
    if (isUnitOp && assignedUnit) {
      return members.filter((m) => m.unit.toLowerCase().trim() === assignedUnit.toLowerCase().trim());
    }
    return members;
  }, [members, isUnitOp, assignedUnit]);

  // Handler: Save Member (Add or Edit)
  const handleSaveMember = (savedMember: Member) => {
    const isEditing = members.some((m) => m.id === savedMember.id);
    let updated: Member[];

    if (isEditing) {
      updated = members.map((m) => (m.id === savedMember.id ? savedMember : m));
    } else {
      updated = [savedMember, ...members];
    }

    setMembers(updated);
    saveMembersToStorage(updated);
    broadcastSync('MEMBERS_SYNC');
    pushCloudEntity('members', updated, userSession?.username || 'User');

    // Central Committee Payment Logic:
    // If Central Committee Member, payment is routed to 'Central' ledger; otherwise to their local unit ledger.
    const targetFinanceUnit = getFinanceLedgerUnitForMember(savedMember);
    const feeAmount = typeof savedMember.feeAmountAED === 'number' && savedMember.feeAmountAED > 0 ? savedMember.feeAmountAED : 25;
    const isPaid = savedMember.paymentStatus === 'Paid';

    // Find any existing finance transaction linked to this member's registration
    const existingTxIndex = financeTransactions.findIndex(
      (t) =>
        (savedMember.receiptNumber && t.receiptNumber === savedMember.receiptNumber) ||
        (t.referenceNumber === savedMember.membershipId && t.category === 'Membership Dues & Renewals' && !t.particulars.toLowerCase().includes('renewal'))
    );

    let updatedFinance = [...financeTransactions];
    if (existingTxIndex >= 0) {
      // Update existing registration transaction to match current unit / Central status
      const existingTx = financeTransactions[existingTxIndex];
      const updatedTx: FinanceTransaction = {
        ...existingTx,
        receiptNumber: savedMember.receiptNumber || existingTx.receiptNumber,
        unit: targetFinanceUnit,
        amountAED: feeAmount,
        partyName: savedMember.fullName,
        contactNumber: savedMember.phoneUAE,
        status: isPaid ? 'Completed' : 'Pending',
        paymentMethod: (savedMember.paymentMethod as any) || existingTx.paymentMethod || 'Cash',
        particulars: targetFinanceUnit === 'Central'
          ? `Central Committee Membership Fee - ${savedMember.fullName} (${savedMember.membershipId}) [Assigned Unit: ${savedMember.unit}]`
          : `New Membership Fee - ${savedMember.fullName} (${savedMember.membershipId}) [Unit: ${savedMember.unit}]`,
        updatedAt: new Date().toISOString(),
      };
      updatedFinance[existingTxIndex] = updatedTx;
      setFinanceTransactions(updatedFinance);
      saveFinanceTransactions(updatedFinance);
      broadcastSync('FINANCE_SYNC');
      pushCloudEntity('finance', updatedFinance, userSession?.username || 'User');
    } else if (isPaid || feeAmount > 0) {
      // Create new Finance Transaction record
      const newTx: FinanceTransaction = {
        id: `fin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        receiptNumber: savedMember.receiptNumber || `REC-${savedMember.membershipId}`,
        date: savedMember.registrationDate || new Date().toISOString().split('T')[0],
        type: 'INCOME',
        category: 'Membership Dues & Renewals',
        particulars: targetFinanceUnit === 'Central'
          ? `Central Committee Membership Fee - ${savedMember.fullName} (${savedMember.membershipId}) [Assigned Unit: ${savedMember.unit}]`
          : `New Membership Fee - ${savedMember.fullName} (${savedMember.membershipId}) [Unit: ${savedMember.unit}]`,
        unit: targetFinanceUnit,
        amountAED: feeAmount,
        paymentMethod: (savedMember.paymentMethod as any) || 'Cash',
        partyName: savedMember.fullName,
        contactNumber: savedMember.phoneUAE,
        recordedBy: userSession?.fullName || 'Registration Desk',
        referenceNumber: savedMember.membershipId,
        status: isPaid ? 'Completed' : 'Pending',
        createdAt: new Date().toISOString(),
      };
      updatedFinance = [newTx, ...financeTransactions];
      setFinanceTransactions(updatedFinance);
      saveFinanceTransactions(updatedFinance);
      broadcastSync('FINANCE_SYNC');
      pushCloudEntity('finance', updatedFinance, userSession?.username || 'User');
    }

    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: isEditing ? 'UPDATE' : 'CREATE',
      performedBy: userSession?.fullName || 'System',
      targetMemberId: savedMember.id,
      targetMembershipId: savedMember.membershipId,
      details: `${isEditing ? 'Updated' : 'Created'} member record: ${savedMember.fullName} (${savedMember.membershipId}) - Unit: ${savedMember.unit} (${targetFinanceUnit === 'Central' ? 'Payment credited to Central Committee Ledger' : `Payment credited to ${savedMember.unit} Unit Ledger`})`,
    };
    const updatedLogs = [logItem, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveAuditLogs(updatedLogs);
    pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');

    setShowFormModal(false);
    setEditingMember(null);
  };

  // Handler: Update Member in list
  const handleUpdateMember = (updatedMember: Member) => {
    const updated = members.map((m) => (m.id === updatedMember.id ? updatedMember : m));
    setMembers(updated);
    saveMembersToStorage(updated);
    broadcastSync('MEMBERS_SYNC');
    pushCloudEntity('members', updated, userSession?.username || 'User');

    // Synchronize finance records for this member to the correct ledger
    const targetFinanceUnit = getFinanceLedgerUnitForMember(updatedMember);
    const hasFinanceTx = financeTransactions.some(
      (t) =>
        t.referenceNumber === updatedMember.membershipId ||
        (updatedMember.receiptNumber && t.receiptNumber === updatedMember.receiptNumber)
    );
    if (hasFinanceTx) {
      const updatedFinance = financeTransactions.map((t) => {
        if (
          t.referenceNumber === updatedMember.membershipId ||
          (updatedMember.receiptNumber && t.receiptNumber === updatedMember.receiptNumber)
        ) {
          return {
            ...t,
            unit: targetFinanceUnit,
            partyName: updatedMember.fullName,
            contactNumber: updatedMember.phoneUAE,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      setFinanceTransactions(updatedFinance);
      saveFinanceTransactions(updatedFinance);
      broadcastSync('FINANCE_SYNC');
      pushCloudEntity('finance', updatedFinance, userSession?.username || 'User');
    }

    if (selectedMember && selectedMember.id === updatedMember.id) {
      setSelectedMember(updatedMember);
    }
  };

  // Handler: Delete Member
  const handleDeleteMember = (memberId: string) => {
    const memberToDelete = members.find((m) => m.id === memberId);
    const updated = members.filter((m) => m.id !== memberId);
    setMembers(updated);
    saveMembersToStorage(updated);
    broadcastSync('MEMBERS_SYNC');
    pushCloudEntity('members', updated, userSession?.username || 'User');

    // Clean up all transient state pointers and close open editing modals
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember(null);
      setShowDetailsModal(false);
    }
    if (editingMember && editingMember.id === memberId) {
      setEditingMember(null);
      setShowFormModal(false);
    }
    if (receiptMember && receiptMember.id === memberId) {
      setReceiptMember(null);
    }

    if (memberToDelete) {
      const logItem: AuditLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'DELETE',
        performedBy: userSession?.fullName || 'System',
        targetMemberId: memberToDelete.id,
        targetMembershipId: memberToDelete.membershipId,
        details: `Deleted member record: ${memberToDelete.fullName} (${memberToDelete.membershipId})`,
      };
      const updatedLogs = [logItem, ...auditLogs];
      setAuditLogs(updatedLogs);
      saveAuditLogs(updatedLogs);
      pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');
    }
  };

  // Handler: Bulk Delete Members
  const handleBulkDeleteMembers = (memberIds: string[]) => {
    const updated = members.filter((m) => !memberIds.includes(m.id));
    setMembers(updated);
    saveMembersToStorage(updated);
    broadcastSync('MEMBERS_SYNC');
    pushCloudEntity('members', updated, userSession?.username || 'User');

    if (selectedMember && memberIds.includes(selectedMember.id)) {
      setSelectedMember(null);
      setShowDetailsModal(false);
    }
    if (editingMember && memberIds.includes(editingMember.id)) {
      setEditingMember(null);
      setShowFormModal(false);
    }
    if (receiptMember && memberIds.includes(receiptMember.id)) {
      setReceiptMember(null);
    }

    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DELETE',
      performedBy: userSession?.fullName || 'System',
      details: `Bulk deleted ${memberIds.length} member records`,
    };
    const updatedLogs = [logItem, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveAuditLogs(updatedLogs);
    pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');
  };

  // Handler: Renew Member
  const handleRenewMember = (memberToRenew: Member) => {
    const now = new Date();
    const renewalExpiryDate = getRenewalExpiryDate(memberToRenew.expiryDate);
    const renewalDateStr = now.toISOString().split('T')[0];
    const targetFinanceUnit = getFinanceLedgerUnitForMember(memberToRenew);
    const renewalAmount = typeof memberToRenew.feeAmountAED === 'number' && memberToRenew.feeAmountAED > 0 ? memberToRenew.feeAmountAED : 30;
    const renewalReceiptNo = `REC-REN-${Date.now().toString().slice(-6)}`;

    const newPaymentRecord = {
      id: `pay-${Date.now()}`,
      receiptNumber: renewalReceiptNo,
      amountAED: renewalAmount,
      date: renewalDateStr,
      purpose: 'Renewal Fee' as const,
      status: 'Paid' as const,
      method: memberToRenew.paymentMethod || 'Cash',
      recordedBy: userSession?.fullName || 'Renewal Desk',
      notes: targetFinanceUnit === 'Central' ? 'Central Committee Annual Renewal' : `${memberToRenew.unit} Unit Renewal`,
    };

    const updatedMember: Member = {
      ...memberToRenew,
      registrationCategory: 'Renewal',
      status: 'Active',
      paymentStatus: 'Paid',
      expiryDate: renewalExpiryDate,
      lastRenewalDate: renewalDateStr,
      receiptNumber: renewalReceiptNo,
      paymentHistory: [newPaymentRecord, ...(memberToRenew.paymentHistory || [])],
      updatedAt: now.toISOString(),
    };


    handleUpdateMember(updatedMember);

    // Auto-record Renewal in corresponding Finance Ledger (Central or Unit)
    const renewalFinanceTx: FinanceTransaction = {
      id: `fin-ren-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      receiptNumber: renewalReceiptNo,
      date: renewalDateStr,
      type: 'INCOME',
      category: 'Membership Dues & Renewals',
      particulars: targetFinanceUnit === 'Central'
        ? `Central Committee Annual Renewal - ${memberToRenew.fullName} (${memberToRenew.membershipId}) [Assigned Unit: ${memberToRenew.unit}]`
        : `Annual Membership Renewal - ${memberToRenew.fullName} (${memberToRenew.membershipId}) [Unit: ${memberToRenew.unit}]`,
      unit: targetFinanceUnit,
      amountAED: renewalAmount,
      paymentMethod: (memberToRenew.paymentMethod as any) || 'Cash',
      partyName: memberToRenew.fullName,
      contactNumber: memberToRenew.phoneUAE,
      recordedBy: userSession?.fullName || 'Renewal Desk',
      referenceNumber: memberToRenew.membershipId,
      status: 'Completed',
      createdAt: now.toISOString(),
    };

    const updatedFinance = [renewalFinanceTx, ...financeTransactions];
    setFinanceTransactions(updatedFinance);
    saveFinanceTransactions(updatedFinance);
    broadcastSync('FINANCE_SYNC');
    pushCloudEntity('finance', updatedFinance, userSession?.username || 'User');

    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: now.toISOString(),
      action: 'RENEWAL',
      performedBy: userSession?.fullName || 'System',
      targetMemberId: memberToRenew.id,
      targetMembershipId: memberToRenew.membershipId,
      details: `Renewed membership for ${memberToRenew.fullName} (${memberToRenew.membershipId}) until ${updatedMember.expiryDate} (AED ${renewalAmount} recorded in ${targetFinanceUnit === 'Central' ? 'Central Committee' : memberToRenew.unit} finance ledger)`,
    };
    const updatedLogs = [logItem, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveAuditLogs(updatedLogs);
    pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');

    setReceiptMember(updatedMember);
    setShowReceiptModal(true);
  };

  // Handler: Update Unit for member
  const handleUpdateMemberUnit = (targetInput: Member | string, newUnit: string) => {
    const memberId = typeof targetInput === 'string' ? targetInput : targetInput.id;
    const target = members.find((m) => m.id === memberId || m.membershipId === memberId);
    if (!target) return;
    const oldUnit = target.unit;
    const updatedMember: Member = {
      ...target,
      unit: newUnit,
      updatedAt: new Date().toISOString(),
    };
    handleUpdateMember(updatedMember);

    // If member is not Central Committee, update their finance transaction unit
    if (!isCentralCommitteeMember(target)) {
      const updatedFinance = financeTransactions.map((t) => {
        if (
          t.referenceNumber === target.membershipId ||
          (t.receiptNumber && t.receiptNumber === target.receiptNumber)
        ) {
          return { ...t, unit: newUnit, updatedAt: new Date().toISOString() };
        }
        return t;
      });
      setFinanceTransactions(updatedFinance);
      saveFinanceTransactions(updatedFinance);
      broadcastSync('FINANCE_SYNC');
      pushCloudEntity('finance', updatedFinance, userSession?.username || 'User');
    }

    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'UPDATE',
      performedBy: userSession?.fullName || 'System',
      targetMemberId: target.id,
      targetMembershipId: target.membershipId,
      details: `Transferred member ${target.fullName} (${target.membershipId}) from ${oldUnit} to ${newUnit} Unit`,
    };
    const updatedLogs = [logItem, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveAuditLogs(updatedLogs);
    pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');
  };

  // Handler: Update Member Documents (Passport, Emirates ID, Visa, Photo)
  const handleUpdateMemberDocuments = (targetInput: Member | string, documents: MemberDocument[]) => {
    const memberId = typeof targetInput === 'string' ? targetInput : targetInput.id;
    const target = members.find((m) => m.id === memberId || m.membershipId === memberId);
    if (!target) return;
    const updatedMember: Member = {
      ...target,
      documents,
      updatedAt: new Date().toISOString(),
    };
    handleUpdateMember(updatedMember);
  };

  // Handler: Save Admin Account
  const handleSaveAdminAccount = (accountToSave: AdminAccount) => {
    const exists = adminAccounts.some((a) => a.id === accountToSave.id);
    let updated: AdminAccount[];
    if (exists) {
      updated = adminAccounts.map((a) => (a.id === accountToSave.id ? accountToSave : a));
    } else {
      updated = [...adminAccounts, accountToSave];
    }
    setAdminAccounts(updated);
    saveAdminAccounts(updated);
    broadcastSync('ACCOUNTS_SYNC');
    pushCloudEntity('accounts', updated, userSession?.username || 'User');

    if (userSession && userSession.id === accountToSave.id) {
      setUserSession({
        ...userSession,
        fullName: accountToSave.fullName,
        username: accountToSave.username,
        role: accountToSave.role,
        unit: accountToSave.unit,
        email: accountToSave.email,
      });
    }

    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'UPDATE',
      performedBy: userSession?.fullName || 'System',
      details: `${exists ? 'Updated' : 'Created'} user account: ${accountToSave.fullName} (${accountToSave.username}) - Role: ${accountToSave.role}`,
    };
    const updatedLogs = [logItem, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveAuditLogs(updatedLogs);
    pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');
  };

  // Handler: Delete Admin Account
  const handleDeleteAdminAccount = (accountId: string) => {
    const accountToDelete = adminAccounts.find((a) => a.id === accountId);
    const updated = adminAccounts.filter((a) => a.id !== accountId);
    setAdminAccounts(updated);
    saveAdminAccounts(updated);
    broadcastSync('ACCOUNTS_SYNC');
    pushCloudEntity('accounts', updated, userSession?.username || 'User');

    if (accountToDelete) {
      const logItem: AuditLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'DELETE',
        performedBy: userSession?.fullName || 'System',
        details: `Deleted user account: ${accountToDelete.fullName} (${accountToDelete.username})`,
      };
      const updatedLogs = [logItem, ...auditLogs];
      setAuditLogs(updatedLogs);
      saveAuditLogs(updatedLogs);
      pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');
    }
  };

  // Handler: Password Change for logged-in user
  const handlePasswordChange = (newPassword: string) => {
    if (!userSession) return;
    const existingIndex = adminAccounts.findIndex(
      (a) => a.username.toLowerCase() === userSession.username.toLowerCase() || a.id === userSession.id
    );

    let updated: AdminAccount[];
    if (existingIndex >= 0) {
      updated = adminAccounts.map((acc, idx) =>
        idx === existingIndex ? { ...acc, password: newPassword } : acc
      );
    } else {
      const newAcc: AdminAccount = {
        id: userSession.id || `admin-${Date.now()}`,
        username: userSession.username,
        password: newPassword,
        fullName: userSession.fullName,
        role: userSession.role,
        unit: userSession.unit,
        email: userSession.email || `${userSession.username}@kca-fujairah.ae`,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };
      updated = [...adminAccounts, newAcc];
    }

    setAdminAccounts(updated);
    saveAdminAccounts(updated);
    broadcastSync('ACCOUNTS_SYNC');
    pushCloudEntity('accounts', updated, userSession?.username || 'User');
    setShowChangePasswordModal(false);
  };

  // Handler: Unit Management
  const handleAddUnit = (unitName: string) => {
    if (units.includes(unitName)) return;
    const updated = [...units, unitName];
    setUnits(updated);
    try {
      localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(updated));
    } catch {}
    broadcastSync('UNITS_SYNC');
    pushCloudEntity('units', updated, userSession?.username || 'User');
  };

  const handleRenameUnit = (oldName: string, newName: string) => {
    if (!oldName || !newName || oldName.trim().toLowerCase() === newName.trim().toLowerCase()) return;
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();

    // 1. Units array
    const updatedUnits = units.map((u) => (u.toLowerCase() === cleanOld.toLowerCase() ? cleanNew : u));
    setUnits(updatedUnits);
    try {
      localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(updatedUnits));
    } catch {}
    broadcastSync('UNITS_SYNC');
    pushCloudEntity('units', updatedUnits, userSession?.username || 'User');

    // 2. Members
    const updatedMembers = members.map((m) =>
      m.unit.toLowerCase() === cleanOld.toLowerCase() ? { ...m, unit: cleanNew, updatedAt: new Date().toISOString() } : m
    );
    setMembers(updatedMembers);
    saveMembersToStorage(updatedMembers);
    broadcastSync('MEMBERS_SYNC');
    pushCloudEntity('members', updatedMembers, userSession?.username || 'User');

    // 3. Finance Transactions
    const updatedFinance = financeTransactions.map((f) =>
      f.unit.toLowerCase() === cleanOld.toLowerCase() ? { ...f, unit: cleanNew, updatedAt: new Date().toISOString() } : f
    );
    setFinanceTransactions(updatedFinance);
    saveFinanceTransactions(updatedFinance);
    broadcastSync('FINANCE_SYNC');
    pushCloudEntity('finance', updatedFinance, userSession?.username || 'User');

    // 4. Inventory Items & Logs
    const updatedInventory = inventoryItems.map((i) =>
      i.unit.toLowerCase() === cleanOld.toLowerCase() ? { ...i, unit: cleanNew, updatedAt: new Date().toISOString() } : i
    );
    setInventoryItems(updatedInventory);
    saveInventoryItems(updatedInventory);
    broadcastSync('INVENTORY_SYNC');
    pushCloudEntity('inventory', updatedInventory, userSession?.username || 'User');

    // 5. Classes & Participants & Attendance
    const updatedClasses = classes.map((c) =>
      c.unit.toLowerCase() === cleanOld.toLowerCase() ? { ...c, unit: cleanNew, updatedAt: new Date().toISOString() } : c
    );
    setClasses(updatedClasses);
    saveClasses(updatedClasses);
    broadcastSync('CLASSES_SYNC');
    pushCloudEntity('classes', updatedClasses, userSession?.username || 'User');

    const updatedParticipants = classParticipants.map((p) =>
      p.unit.toLowerCase() === cleanOld.toLowerCase() ? { ...p, unit: cleanNew, updatedAt: new Date().toISOString() } : p
    );
    setClassParticipants(updatedParticipants);
    saveParticipants(updatedParticipants);
    broadcastSync('PARTICIPANTS_SYNC');
    pushCloudEntity('participants', updatedParticipants, userSession?.username || 'User');

    const updatedAttendance = classAttendance.map((a) =>
      a.unit.toLowerCase() === cleanOld.toLowerCase() ? { ...a, unit: cleanNew } : a
    );
    setClassAttendance(updatedAttendance);
    saveAttendance(updatedAttendance);

    // 6. Admin Accounts
    const updatedAccounts = adminAccounts.map((a) =>
      a.unit && a.unit.toLowerCase() === cleanOld.toLowerCase() ? { ...a, unit: cleanNew } : a
    );
    setAdminAccounts(updatedAccounts);
    saveAdminAccounts(updatedAccounts);
    broadcastSync('ACCOUNTS_SYNC');
    pushCloudEntity('accounts', updatedAccounts, userSession?.username || 'User');

    // 7. Audit Log
    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'UPDATE',
      performedBy: userSession?.fullName || 'System',
      details: `Renamed Unit "${cleanOld}" to "${cleanNew}" across all membership, finance, asset, and class registers.`,
    };
    const updatedLogs = [logItem, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveAuditLogs(updatedLogs);
    pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');
  };

  const handleDeleteUnit = (unitName: string) => {
    const updated = units.filter((u) => u !== unitName);
    setUnits(updated);
    try {
      localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(updated));
    } catch {}
    broadcastSync('UNITS_SYNC');
    pushCloudEntity('units', updated, userSession?.username || 'User');
  };

  // Handler: Custom Fields Management
  const handleSaveCustomField = (field: CustomFieldDefinition) => {
    const exists = customFields.some((f) => f.id === field.id);
    let updated: CustomFieldDefinition[];
    if (exists) {
      updated = customFields.map((f) => (f.id === field.id ? field : f));
    } else {
      updated = [...customFields, field];
    }
    setCustomFields(updated);
    saveCustomFields(updated);
    broadcastSync('FIELDS_SYNC');
    pushCloudEntity('customFields', updated, userSession?.username || 'User');
  };

  const handleDeleteCustomField = (fieldId: string) => {
    const updated = customFields.filter((f) => f.id !== fieldId);
    setCustomFields(updated);
    saveCustomFields(updated);
    broadcastSync('FIELDS_SYNC');
    pushCloudEntity('customFields', updated, userSession?.username || 'User');
  };

  const handleReorderCustomFields = (reorderedFields: CustomFieldDefinition[]) => {
    setCustomFields(reorderedFields);
    saveCustomFields(reorderedFields);
    broadcastSync('FIELDS_SYNC');
    pushCloudEntity('customFields', reorderedFields, userSession?.username || 'User');
  };

  // Handler: Smart Merge Database from User JSON without corrupting existing Admin data
  const handleSmartMergeBackup = (importedData: any) => {
    let addedMembersCount = 0;
    let updatedMembersCount = 0;

    // 1. Smart Merge Members
    const importedMembers: Member[] = Array.isArray(importedData)
      ? importedData
      : Array.isArray(importedData?.members)
      ? importedData.members
      : [];

    let currentMembers = [...members];
    if (importedMembers.length > 0) {
      importedMembers.forEach((imp) => {
        const existingIdx = currentMembers.findIndex(
          (m) =>
            m.id === imp.id ||
            (imp.membershipId && m.membershipId === imp.membershipId) ||
            (imp.emiratesId && m.emiratesId && m.emiratesId.trim() === imp.emiratesId.trim())
        );
        if (existingIdx >= 0) {
          currentMembers[existingIdx] = {
            ...currentMembers[existingIdx],
            ...imp,
            updatedAt: new Date().toISOString(),
          };
          updatedMembersCount++;
        } else {
          currentMembers.push(imp);
          addedMembersCount++;
        }
      });
      setMembers(currentMembers);
      saveMembersToStorage(currentMembers);
      broadcastSync('MEMBERS_SYNC');
      pushCloudEntity('members', currentMembers, userSession?.username || 'Admin');
    }

    // 2. Smart Merge Finance Transactions
    const importedFinance: FinanceTransaction[] = Array.isArray(importedData?.financeTransactions)
      ? importedData.financeTransactions
      : [];
    let currentFinance = [...financeTransactions];
    if (importedFinance.length > 0) {
      importedFinance.forEach((imp) => {
        const existingIdx = currentFinance.findIndex(
          (f) => f.id === imp.id || (imp.receiptNumber && f.receiptNumber === imp.receiptNumber)
        );
        if (existingIdx >= 0) {
          currentFinance[existingIdx] = { ...currentFinance[existingIdx], ...imp, updatedAt: new Date().toISOString() };
        } else {
          currentFinance.push(imp);
        }
      });
      setFinanceTransactions(currentFinance);
      saveFinanceTransactions(currentFinance);
      broadcastSync('FINANCE_SYNC');
      pushCloudEntity('finance', currentFinance, userSession?.username || 'Admin');
    }

    // 3. Smart Merge Inventory Items
    const importedInventory: InventoryItem[] = Array.isArray(importedData?.inventoryItems)
      ? importedData.inventoryItems
      : [];
    let currentInventory = [...inventoryItems];
    if (importedInventory.length > 0) {
      importedInventory.forEach((imp) => {
        const existingIdx = currentInventory.findIndex(
          (i) => i.id === imp.id || (imp.itemCode && i.itemCode === imp.itemCode)
        );
        if (existingIdx >= 0) {
          currentInventory[existingIdx] = { ...currentInventory[existingIdx], ...imp, updatedAt: new Date().toISOString() };
        } else {
          currentInventory.push(imp);
        }
      });
      setInventoryItems(currentInventory);
      saveInventoryItems(currentInventory);
      broadcastSync('INVENTORY_SYNC');
      pushCloudEntity('inventory', currentInventory, userSession?.username || 'Admin');
    }

    // 4. Smart Merge Classes & Participants
    const importedClasses: CulturalClass[] = Array.isArray(importedData?.classes) ? importedData.classes : [];
    let currentClasses = [...classes];
    if (importedClasses.length > 0) {
      importedClasses.forEach((imp) => {
        const existingIdx = currentClasses.findIndex((c) => c.id === imp.id || (imp.code && c.code === imp.code));
        if (existingIdx >= 0) {
          currentClasses[existingIdx] = { ...currentClasses[existingIdx], ...imp, updatedAt: new Date().toISOString() };
        } else {
          currentClasses.push(imp);
        }
      });
      setClasses(currentClasses);
      saveClasses(currentClasses);
      broadcastSync('CLASSES_SYNC');
      pushCloudEntity('classes', currentClasses, userSession?.username || 'Admin');
    }

    const importedParticipants: ClassParticipant[] = Array.isArray(importedData?.classParticipants)
      ? importedData.classParticipants
      : Array.isArray(importedData?.participants)
      ? importedData.participants
      : [];
    let currentParticipants = [...classParticipants];
    if (importedParticipants.length > 0) {
      importedParticipants.forEach((imp) => {
        const existingIdx = currentParticipants.findIndex(
          (p) => p.id === imp.id || (imp.studentId && p.studentId === imp.studentId)
        );
        if (existingIdx >= 0) {
          currentParticipants[existingIdx] = { ...currentParticipants[existingIdx], ...imp, updatedAt: new Date().toISOString() };
        } else {
          currentParticipants.push(imp);
        }
      });
      setClassParticipants(currentParticipants);
      saveParticipants(currentParticipants);
      broadcastSync('PARTICIPANTS_SYNC');
      pushCloudEntity('participants', currentParticipants, userSession?.username || 'Admin');
    }

    // 5. Smart Merge Units
    const importedUnits: string[] = Array.isArray(importedData?.units) ? importedData.units : [];
    if (importedUnits.length > 0) {
      const mergedUnits = Array.from(new Set([...units, ...importedUnits]));
      setUnits(mergedUnits);
      localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(mergedUnits));
      broadcastSync('UNITS_SYNC');
      pushCloudEntity('units', mergedUnits, userSession?.username || 'Admin');
    }

    // 6. Audit Log
    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'IMPORT',
      performedBy: userSession?.fullName || 'Admin',
      details: `Smart Merged JSON data: Added ${addedMembersCount} new members, updated ${updatedMembersCount} existing records without data loss on Admin PC.`,
    };
    const updatedLogs = [logItem, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveAuditLogs(updatedLogs);
    pushCloudEntity('audit', updatedLogs, userSession?.username || 'Admin');

    return { addedMembersCount, updatedMembersCount, totalMembers: currentMembers.length };
  };

  // Handler: Restore Complete Database from Backup JSON
  const handleRestoreBackup = (restoredMembers: Member[], restoredLogs?: AuditLogItem[]) => {
    setMembers(restoredMembers);
    saveMembersToStorage(restoredMembers);
    if (restoredLogs) {
      setAuditLogs(restoredLogs);
      saveAuditLogs(restoredLogs);
    }
    broadcastSync('MEMBERS_SYNC');
    pushFullRestore({
      members: restoredMembers,
      auditLogs: restoredLogs || auditLogs,
      user: userSession?.username || 'Admin',
    });
    setShowBackupModal(false);
  };

  // ---------------- FINANCE HANDLERS ----------------
  const handleOpenNewFinanceTransaction = (defaultType?: TransactionType) => {
    setEditingFinanceTransaction(null);
    setNewFinanceInitialType(defaultType || 'INCOME');
    setShowFinanceFormModal(true);
  };

  const handleEditFinanceTransaction = (transaction: FinanceTransaction) => {
    setEditingFinanceTransaction(transaction);
    setShowFinanceFormModal(true);
  };

  const handleSaveFinanceTransaction = (savedTransaction: FinanceTransaction) => {
    const isEditing = financeTransactions.some((t) => t.id === savedTransaction.id);
    let updated: FinanceTransaction[];
    if (isEditing) {
      updated = financeTransactions.map((t) => (t.id === savedTransaction.id ? savedTransaction : t));
    } else {
      updated = [savedTransaction, ...financeTransactions];
    }

    setFinanceTransactions(updated);
    saveFinanceTransactions(updated);
    broadcastSync('FINANCE_SYNC');
    pushCloudEntity('finance', updated, userSession?.username || 'User');

    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: isEditing ? 'UPDATE' : 'CREATE',
      performedBy: userSession?.fullName || 'System',
      details: `${isEditing ? 'Updated' : 'Recorded'} finance transaction: ${savedTransaction.receiptNumber} (${savedTransaction.type} AED ${savedTransaction.amountAED}) - Unit: ${savedTransaction.unit}`,
    };
    const updatedLogs = [logItem, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveAuditLogs(updatedLogs);
    pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');

    setShowFinanceFormModal(false);
    setEditingFinanceTransaction(null);
  };

  const handleDeleteFinanceTransaction = (id: string) => {
    const toDelete = financeTransactions.find((t) => t.id === id);
    const updated = financeTransactions.filter((t) => t.id !== id);
    setFinanceTransactions(updated);
    saveFinanceTransactions(updated);
    broadcastSync('FINANCE_SYNC');
    pushCloudEntity('finance', updated, userSession?.username || 'User');

    if (editingFinanceTransaction && editingFinanceTransaction.id === id) {
      setEditingFinanceTransaction(null);
      setShowFinanceFormModal(false);
    }
    if (selectedFinanceReceipt && selectedFinanceReceipt.id === id) {
      setSelectedFinanceReceipt(null);
      setShowFinanceReceiptModal(false);
    }

    if (toDelete) {
      const logItem: AuditLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'DELETE',
        performedBy: userSession?.fullName || 'System',
        details: `Deleted finance transaction ${toDelete.receiptNumber} (${toDelete.type} AED ${toDelete.amountAED})`,
      };
      const updatedLogs = [logItem, ...auditLogs];
      setAuditLogs(updatedLogs);
      saveAuditLogs(updatedLogs);
      pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');
    }
  };

  const handleViewFinanceReceipt = (transaction: FinanceTransaction) => {
    setSelectedFinanceReceipt(transaction);
    setShowFinanceReceiptModal(true);
  };

  // ---------------- INVENTORY HANDLERS ----------------
  const handleOpenAddInventoryItem = () => {
    setEditingInventoryItem(null);
    setShowInventoryItemModal(true);
  };

  const handleEditInventoryItem = (item: InventoryItem) => {
    setEditingInventoryItem(item);
    setShowInventoryItemModal(true);
  };

  const handleSaveInventoryItem = (savedItem: InventoryItem) => {
    const isEditing = inventoryItems.some((i) => i.id === savedItem.id);
    let updated: InventoryItem[];
    if (isEditing) {
      updated = inventoryItems.map((i) => (i.id === savedItem.id ? savedItem : i));
    } else {
      updated = [savedItem, ...inventoryItems];
    }

    setInventoryItems(updated);
    saveInventoryItems(updated);
    broadcastSync('INVENTORY_SYNC');
    pushCloudEntity('inventory', updated, userSession?.username || 'User');

    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: isEditing ? 'UPDATE' : 'CREATE',
      performedBy: userSession?.fullName || 'System',
      details: `${isEditing ? 'Updated' : 'Added'} inventory asset: ${savedItem.name} (${savedItem.itemCode}) - Unit: ${savedItem.unit}`,
    };
    const updatedLogs = [logItem, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveAuditLogs(updatedLogs);
    pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');

    setShowInventoryItemModal(false);
    setEditingInventoryItem(null);
  };

  const handleDeleteInventoryItem = (itemId: string) => {
    const toDelete = inventoryItems.find((i) => i.id === itemId);
    const updated = inventoryItems.filter((i) => i.id !== itemId);
    setInventoryItems(updated);
    saveInventoryItems(updated);
    broadcastSync('INVENTORY_SYNC');
    pushCloudEntity('inventory', updated, userSession?.username || 'User');

    if (toDelete) {
      const logItem: AuditLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'DELETE',
        performedBy: userSession?.fullName || 'System',
        details: `Deleted inventory asset ${toDelete.name} (${toDelete.itemCode})`,
      };
      const updatedLogs = [logItem, ...auditLogs];
      setAuditLogs(updatedLogs);
      saveAuditLogs(updatedLogs);
      pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');
    }
  };

  const handleOpenInventoryIssue = (item: InventoryItem) => {
    setTargetIssueItem(item);
    setShowInventoryIssueModal(true);
  };

  const handleConfirmInventoryMovement = (
    updatedItem: InventoryItem,
    movementLog: InventoryMovementLog
  ) => {
    // 1. Update item stock
    const updatedItemList = inventoryItems.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    setInventoryItems(updatedItemList);
    saveInventoryItems(updatedItemList);

    // 2. Append movement log
    const updatedLogs = [movementLog, ...inventoryLogs];
    setInventoryLogs(updatedLogs);
    saveInventoryLogs(updatedLogs);

    broadcastSync('INVENTORY_SYNC');
    pushCloudEntity('inventory', updatedItemList, userSession?.username || 'User');
    pushCloudEntity('inventoryLogs', updatedLogs, userSession?.username || 'User');

    const auditItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'UPDATE',
      performedBy: userSession?.fullName || 'System',
      details: `Inventory ${movementLog.type}: ${movementLog.quantity}x ${updatedItem.name} (${updatedItem.itemCode}) ${movementLog.issuedToName ? `-> ${movementLog.issuedToName}` : ''}`,
    };
    const updatedAudit = [auditItem, ...auditLogs];
    setAuditLogs(updatedAudit);
    saveAuditLogs(updatedAudit);
    pushCloudEntity('audit', updatedAudit, userSession?.username || 'User');

    setShowInventoryIssueModal(false);
    setTargetIssueItem(null);
  };

  // ---------------- CLASSES & ATTENDANCE HANDLERS ----------------
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setShowClassFormModal(true);
  };

  const handleEditClass = (classData: CulturalClass) => {
    setEditingClass(classData);
    setShowClassFormModal(true);
  };

  const handleSaveClass = (savedClass: CulturalClass) => {
    const isEditing = classes.some((c) => c.id === savedClass.id);
    let updated: CulturalClass[];
    if (isEditing) {
      updated = classes.map((c) => (c.id === savedClass.id ? savedClass : c));
    } else {
      updated = [savedClass, ...classes];
    }

    setClasses(updated);
    saveClasses(updated);
    broadcastSync('CLASSES_SYNC');
    pushCloudEntity('classes', updated, userSession?.username || 'User');

    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: isEditing ? 'UPDATE' : 'CREATE',
      performedBy: userSession?.fullName || 'System',
      details: `${isEditing ? 'Updated' : 'Created'} cultural class batch: ${savedClass.name} (${savedClass.code}) - Unit: ${savedClass.unit}`,
    };
    const updatedLogs = [logItem, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveAuditLogs(updatedLogs);
    pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');

    setShowClassFormModal(false);
    setEditingClass(null);
  };

  const handleDeleteClass = (classId: string) => {
    const toDelete = classes.find((c) => c.id === classId);
    const updated = classes.filter((c) => c.id !== classId);
    setClasses(updated);
    saveClasses(updated);
    broadcastSync('CLASSES_SYNC');
    pushCloudEntity('classes', updated, userSession?.username || 'User');

    if (toDelete) {
      const logItem: AuditLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'DELETE',
        performedBy: userSession?.fullName || 'System',
        details: `Deleted cultural class ${toDelete.name} (${toDelete.code})`,
      };
      const updatedLogs = [logItem, ...auditLogs];
      setAuditLogs(updatedLogs);
      saveAuditLogs(updatedLogs);
      pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');
    }
  };

  const handleOpenAddParticipant = (classId?: string) => {
    setEditingParticipant(null);
    setParticipantPreselectedClassId(classId);
    setShowParticipantFormModal(true);
  };

  const handleEditParticipant = (participant: ClassParticipant) => {
    setEditingParticipant(participant);
    setParticipantPreselectedClassId(participant.classId);
    setShowParticipantFormModal(true);
  };

  const handleSaveParticipant = (savedParticipant: ClassParticipant) => {
    const isEditing = classParticipants.some((p) => p.id === savedParticipant.id);
    let updated: ClassParticipant[];
    if (isEditing) {
      updated = classParticipants.map((p) => (p.id === savedParticipant.id ? savedParticipant : p));
    } else {
      updated = [savedParticipant, ...classParticipants];
    }

    setClassParticipants(updated);
    saveParticipants(updated);
    broadcastSync('CLASSES_SYNC');
    pushCloudEntity('classParticipants', updated, userSession?.username || 'User');

    // Link Student Fee to Finance Ledger if marked Paid
    if (savedParticipant.feeStatus === 'Paid' && (savedParticipant.feeAmountAED || 0) > 0) {
      const receiptNo = savedParticipant.receiptNumber || `REC-STU-${savedParticipant.studentId}`;
      const existingTxIndex = financeTransactions.findIndex(
        (t) =>
          t.receiptNumber === receiptNo ||
          (t.studentId === savedParticipant.studentId && t.date === savedParticipant.paymentDate)
      );

      const txData: FinanceTransaction = {
        id: existingTxIndex >= 0 ? financeTransactions[existingTxIndex].id : `tx-stu-${Date.now()}`,
        receiptNumber: receiptNo,
        date: savedParticipant.paymentDate || new Date().toISOString().split('T')[0],
        type: 'INCOME',
        category: 'Class / Tuition Fee',
        particulars: `Cultural Class Tuition Fee: ${savedParticipant.className} (${savedParticipant.studentId}) - Student: ${savedParticipant.fullName}`,
        amountAED: Number(savedParticipant.feeAmountAED) || 0,
        unit: savedParticipant.unit || 'Fujairah',
        paymentMethod: (savedParticipant.paymentMethod as any) || 'Cash',
        partyName: savedParticipant.fullName,
        contactNumber: savedParticipant.guardianPhone || savedParticipant.whatsapp,
        referenceNumber: savedParticipant.studentId,
        notes: `Class: ${savedParticipant.className}, Enrolled on: ${savedParticipant.joiningDate}`,
        status: 'Completed',
        recordedBy: userSession?.fullName || 'System',
        studentId: savedParticipant.studentId,
        classId: savedParticipant.classId,
        createdAt: existingTxIndex >= 0 ? financeTransactions[existingTxIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updatedFinance: FinanceTransaction[];
      if (existingTxIndex >= 0) {
        updatedFinance = financeTransactions.map((t, idx) => (idx === existingTxIndex ? txData : t));
      } else {
        updatedFinance = [txData, ...financeTransactions];
      }
      setFinanceTransactions(updatedFinance);
      saveFinanceTransactions(updatedFinance);
      broadcastSync('FINANCE_SYNC');
      pushCloudEntity('finance', updatedFinance, userSession?.username || 'User');
    }

    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: isEditing ? 'UPDATE' : 'CREATE',
      performedBy: userSession?.fullName || 'System',
      details: `${isEditing ? 'Updated' : 'Enrolled'} student: ${savedParticipant.fullName} (${savedParticipant.studentId}) in ${savedParticipant.className} - Unit: ${savedParticipant.unit} (Fee: AED ${savedParticipant.feeAmountAED} ${savedParticipant.feeStatus === 'Paid' ? 'Paid & Linked to Finance' : 'Pending'})`,
    };
    const updatedLogs = [logItem, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveAuditLogs(updatedLogs);
    pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');

    setShowParticipantFormModal(false);
    setEditingParticipant(null);
  };

  const handleDeleteParticipant = (participantId: string) => {
    const toDelete = classParticipants.find((p) => p.id === participantId);
    const updated = classParticipants.filter((p) => p.id !== participantId);
    setClassParticipants(updated);
    saveParticipants(updated);
    broadcastSync('CLASSES_SYNC');
    pushCloudEntity('classParticipants', updated, userSession?.username || 'User');

    if (toDelete) {
      const logItem: AuditLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'DELETE',
        performedBy: userSession?.fullName || 'System',
        details: `Deleted student participant ${toDelete.fullName} (${toDelete.studentId})`,
      };
      const updatedLogs = [logItem, ...auditLogs];
      setAuditLogs(updatedLogs);
      saveAuditLogs(updatedLogs);
      pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');
    }
  };

  const handleOpenTakeAttendance = (targetClass: CulturalClass) => {
    setTargetAttendanceClass(targetClass);
    setShowAttendanceModal(true);
  };

  const handleUpdateParticipantBatch = (participantId: string, newBatch: string) => {
    const updated = classParticipants.map((p) =>
      p.id === participantId ? { ...p, batchName: newBatch, updatedAt: new Date().toISOString() } : p
    );
    setClassParticipants(updated);
    saveParticipants(updated);
    broadcastSync('PARTICIPANTS_SYNC');
    pushCloudEntity('participants', updated, userSession?.username || 'User');
  };

  const handleSaveAttendance = (record: ClassAttendanceRecord) => {
    const updated = [record, ...classAttendance];
    setClassAttendance(updated);
    saveAttendance(updated);
    broadcastSync('CLASSES_SYNC');
    pushCloudEntity('classAttendance', updated, userSession?.username || 'User');

    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'CREATE',
      performedBy: userSession?.fullName || 'System',
      details: `Logged class attendance for ${record.className} (${record.unit} Unit) on ${record.date}: ${record.presentCount}/${record.totalStudents} present`,
    };
    const updatedLogs = [logItem, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveAuditLogs(updatedLogs);
    pushCloudEntity('audit', updatedLogs, userSession?.username || 'User');

    setShowAttendanceModal(false);
    setTargetAttendanceClass(null);
  };

  // If public verification URL was opened, render standalone Public Verification Screen
  if (verifyQuery) {
    return (
      <PublicVerifyCardView
        searchId={verifyQuery.id}
        members={members}
        customFields={customFields}
        embeddedMember={verifyQuery.embeddedMember}
        onBackToHome={() => {
          setVerifyQuery(null);
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', window.location.pathname.replace(/\/verify.*$/, ''));
          }
        }}
      />
    );
  }

  // If user is not authenticated as staff/operator, show redesigned Landing Page
  if (!userSession || !userSession.isLoggedIn) {
    return (
      <>
        <LandingPage
          members={members}
          customFields={customFields}
          adminAccounts={adminAccounts}
          onLogin={(session, rememberMe) => {
            setUserSession(session);
            if (rememberMe) {
              saveActiveUserSession(session);
            }
            setShowLoginModal(false);
          }}
          onOpenPublicVerify={(m) => {
            setVerifyQuery({ id: m.membershipId, showReceipt: false });
          }}
          onOpenQrScanner={() => setShowVerifyModal(true)}
        />

        {/* Public-accessible QR code scanner modal */}
        <QrScannerModal
          isOpen={showVerifyModal}
          members={members}
          onClose={() => setShowVerifyModal(false)}
          onSelectMember={(m) => {
            setVerifyQuery({ id: m.membershipId, showReceipt: false });
            setShowVerifyModal(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans antialiased selection:bg-[#8b0000] selection:text-white transition-colors duration-150">
      {/* Left-side Vertical Navigation Sidebar on Desktop / Mobile Header & Drawer */}
      {userSession && userSession.isLoggedIn && (
        <Navbar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'backup') {
              setShowBackupModal(true);
            } else if (tab === 'verify') {
              setShowVerifyModal(true);
            } else {
              setActiveTab(tab);
            }
          }}
          onOpenNewMember={() => {
            setEditingMember(null);
            setShowFormModal(true);
          }}
          onOpenAdminManager={() => setShowAdminManagerModal(true)}
          onOpenUnitManager={() => setShowUnitManagerModal(true)}
          onOpenLogoManager={() => setShowLogoModal(true)}
          onOpenCertificateGenerator={() => {
            setCertRecipientName('');
            setCertUnit(units[0] || 'Fujairah');
            setCertCourse('Kerala Kalolsavam & Cultural Excellence');
            setShowCertificateModal(true);
          }}
          onOpenBackupSettings={() => setShowBackupModal(true)}
          onOpenThemeSelector={() => setShowThemeModal(true)}

          onOpenMailbox={() => setShowMailboxModal(true)}
          onOpenWhatsApp={() => {
            setWhatsAppTargetMember(undefined);
            setShowWhatsAppModal(true);
          }}
          onOpenChangePassword={() => setShowChangePasswordModal(true)}
          onOpenReportGenerator={() => setShowReportGeneratorModal(true)}
          userSession={userSession}
          onLogout={() => {
            clearActiveUserSession();
            setUserSession(null);
            setShowLoginModal(true);
          }}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        <main className="flex-1 max-w-[1850px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            members={visibleMembers}
            financeTransactions={financeTransactions}
            inventoryItems={inventoryItems}
            inventoryLogs={inventoryLogs}
            classes={classes}
            participants={classParticipants}
            units={units}
            userSession={userSession || undefined}
            onSelectMember={(m) => {
              setSelectedMember(m);
              setShowDetailsModal(true);
            }}
            onOpenNewMember={() => {
              setEditingMember(null);
              setShowFormModal(true);
            }}
            onOpenBatchPrint={() => {
              setBatchPrintMembers(visibleMembers);
              setShowBatchPrintModal(true);
            }}
            onOpenBloodDirectory={(bg) => {
              setSelectedBloodGroupFilter(bg || 'ALL');
              setShowBloodDirectory(true);
            }}
            onOpenBackupModal={() => setShowBackupModal(true)}
            onOpenVerifyModal={() => setShowVerifyModal(true)}
            onOpenReportGenerator={() => setShowReportGeneratorModal(true)}
            onOpenNewFinance={() => handleOpenNewFinanceTransaction('INCOME')}
            onOpenNewInventory={() => {
              setEditingInventoryItem(null);
              setShowInventoryItemModal(true);
            }}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'members' && (
          <MemberTable
            members={visibleMembers}
            units={units}
            customFields={customFields}
            userSession={userSession}
            onSelectMember={(m) => {
              setSelectedMember(m);
              setShowDetailsModal(true);
            }}
            onViewDetails={(m) => {
              setSelectedMember(m);
              setShowDetailsModal(true);
            }}
            onViewReceipt={(m) => {
              setReceiptMember(m);
              setShowReceiptModal(true);
            }}
            onEditMember={(m) => {
              setEditingMember(m);
              setShowFormModal(true);
            }}
            onViewIdCard={(m) => {
              setIdCardMember(m);
              setShowIdCardModal(true);
            }}
            onRenewMember={handleRenewMember}
            onDeleteMember={handleDeleteMember}
            onBulkDeleteMembers={handleBulkDeleteMembers}
            onAddNewMember={() => {
              setEditingMember(null);
              setShowFormModal(true);
            }}
            onOpenNewMember={() => {
              setEditingMember(null);
              setShowFormModal(true);
            }}
            onBatchPrint={(selected) => {
              setBatchPrintMembers(selected);
              setShowBatchPrintModal(true);
            }}
            onOpenBatchPrint={(selected) => {
              setBatchPrintMembers(selected);
              setShowBatchPrintModal(true);
            }}
            onOpenWhatsApp={(m) => {
              setWhatsAppTargetMember(m);
              setShowWhatsAppModal(true);
            }}
            onOpenCertificateGenerator={(certInfo) => {
              if (certInfo) {
                setCertRecipientName(certInfo.name || '');
                setCertMemberId(certInfo.memberId || '');
                setCertCitation(certInfo.citation || '');
                setCertUnit(certInfo.unit || units[0] || 'Fujairah');
                setCertCourse(certInfo.course || 'Annual Kerala Kalolsavam & Cultural Excellence');
                setBulkSelectedMembersForCert(certInfo.selectedMembers || []);
              } else {
                setCertRecipientName('');
                setCertMemberId('');
                setCertCitation('');
                setBulkSelectedMembersForCert([]);
              }
              setShowCertificateModal(true);
            }}
            onToggleMemberStatus={(m) => {
              const newStatus = isMemberEffectivelyActive(m) ? 'Inactive' : 'Active';
              handleUpdateMember({
                ...m,
                status: newStatus,
              });
            }}
            onUpdateMemberUnit={handleUpdateMemberUnit}
            onOpenUnitManager={() => setShowUnitManagerModal(true)}
            onOpenFieldManager={() => setShowFieldManagerModal(true)}
          />
        )}

        {activeTab === 'ladies_wing' && (
          <MemberTable
            members={visibleMembers}
            units={units}
            customFields={customFields}
            userSession={userSession}
            initialGenderFilter="Female"
            isLadiesWingMode={true}
            title="Ladies Wing Register"
            subtitle="Dedicated register for all female members of KCA Fujairah."
            onSelectMember={(m) => {
              setSelectedMember(m);
              setShowDetailsModal(true);
            }}
            onViewDetails={(m) => {
              setSelectedMember(m);
              setShowDetailsModal(true);
            }}
            onViewReceipt={(m) => {
              setReceiptMember(m);
              setShowReceiptModal(true);
            }}
            onEditMember={(m) => {
              setEditingMember(m);
              setShowFormModal(true);
            }}
            onViewIdCard={(m) => {
              setIdCardMember(m);
              setShowIdCardModal(true);
            }}
            onRenewMember={handleRenewMember}
            onDeleteMember={handleDeleteMember}
            onBulkDeleteMembers={handleBulkDeleteMembers}
            onAddNewMember={() => {
              setEditingMember(null);
              setShowFormModal(true);
            }}
            onOpenNewMember={() => {
              setEditingMember(null);
              setShowFormModal(true);
            }}
            onBatchPrint={(selected) => {
              setBatchPrintMembers(selected);
              setShowBatchPrintModal(true);
            }}
            onOpenBatchPrint={(selected) => {
              setBatchPrintMembers(selected);
              setShowBatchPrintModal(true);
            }}
            onOpenWhatsApp={(m) => {
              setWhatsAppTargetMember(m);
              setShowWhatsAppModal(true);
            }}
            onOpenCertificateGenerator={(certInfo) => {
              if (certInfo) {
                setCertRecipientName(certInfo.name || '');
                setCertMemberId(certInfo.memberId || '');
                setCertCitation(certInfo.citation || '');
                setCertUnit(certInfo.unit || units[0] || 'Fujairah');
                setCertCourse(certInfo.course || 'Annual Kerala Kalolsavam & Cultural Excellence');
                setBulkSelectedMembersForCert(certInfo.selectedMembers || []);
              } else {
                setCertRecipientName('');
                setCertMemberId('');
                setCertCitation('');
                setBulkSelectedMembersForCert([]);
              }
              setShowCertificateModal(true);
            }}
            onToggleMemberStatus={(m) => {
              const newStatus = isMemberEffectivelyActive(m) ? 'Inactive' : 'Active';
              handleUpdateMember({
                ...m,
                status: newStatus,
              });
            }}
            onUpdateMemberUnit={handleUpdateMemberUnit}
            onOpenUnitManager={() => setShowUnitManagerModal(true)}
            onOpenFieldManager={() => setShowFieldManagerModal(true)}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactBankView
            contacts={contacts}
            units={units}
            userSession={userSession}
            onOpenAddContact={() => {
              setEditingContact(null);
              setShowContactModal(true);
            }}
            onEditContact={(contact) => {
              setEditingContact(contact);
              setShowContactModal(true);
            }}
            onDeleteContact={(id) => {
              const updated = contacts.filter((c) => c.id !== id);
              setContacts(updated);
              saveContacts(updated);
            }}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            documents={documents}
            units={units}
            userSession={userSession}
            onOpenUploadModal={() => {
              setEditingDocument(null);
              setShowDocumentModal(true);
            }}
            onOpenEditModal={(doc) => {
              setEditingDocument(doc);
              setShowDocumentModal(true);
            }}
            onDeleteDocument={handleDeleteDocument}
            onPreviewDocument={(doc) => {
              setPreviewDocument(doc);
              setShowDocumentPreviewModal(true);
            }}
          />
        )}

        {activeTab === 'idcards' && (
          <IdCardsView
            members={visibleMembers}
            units={units}
            customFields={customFields}
            userSession={userSession}
            onSelectMember={(m) => {
              setIdCardMember(m);
              setShowIdCardModal(true);
            }}
            onOpenCardModal={(m) => {
              setIdCardMember(m);
              setShowIdCardModal(true);
            }}
            onBatchPrint={(selected) => {
              setBatchPrintMembers(selected);
              setShowBatchPrintModal(true);
            }}
            onOpenBatchPrint={(selected) => {
              setBatchPrintMembers(selected);
              setShowBatchPrintModal(true);
            }}
            onOpenWhatsApp={(m) => {
              setWhatsAppTargetMember(m);
              setShowWhatsAppModal(true);
            }}
            onOpenLogoManager={() => setShowLogoModal(true)}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceView
            transactions={financeTransactions}
            units={units}
            userSession={userSession}
            onOpenNewTransaction={handleOpenNewFinanceTransaction}
            onEditTransaction={handleEditFinanceTransaction}
            onDeleteTransaction={handleDeleteFinanceTransaction}
            onViewReceipt={handleViewFinanceReceipt}
            onSaveTransactions={(txs) => {
              setFinanceTransactions(txs);
              saveFinanceTransactions(txs);
            }}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            items={inventoryItems}
            movementLogs={inventoryLogs}
            units={units}
            userSession={userSession}
            onOpenAddItem={handleOpenAddInventoryItem}
            onEditItem={handleEditInventoryItem}
            onDeleteItem={handleDeleteInventoryItem}
            onOpenIssueModal={handleOpenInventoryIssue}
          />
        )}

        {activeTab === 'classes' && (
          <ClassesView
            classes={classes}
            participants={classParticipants}
            attendanceRecords={classAttendance}
            units={units}
            userSession={userSession}
            onOpenAddClass={handleOpenAddClass}
            onEditClass={handleEditClass}
            onDeleteClass={handleDeleteClass}
            onOpenAddParticipant={handleOpenAddParticipant}
            onEditParticipant={handleEditParticipant}
            onDeleteParticipant={handleDeleteParticipant}
            onOpenTakeAttendance={handleOpenTakeAttendance}
          />
        )}

        {activeTab === 'blood' && (
          <BloodDonorDirectory
            isOpen={true}
            members={visibleMembers}
            initialBloodGroup={selectedBloodGroupFilter}
            onClose={() => setActiveTab('dashboard')}
            onSelectMember={(m) => {
              setSelectedMember(m);
              setShowDetailsModal(true);
            }}
          />
        )}

        {(activeTab === 'letters' || (activeTab as string) === 'letter_pad') && (
          <LetterPadView
            units={units}
            userSession={userSession}
          />
        )}
      </main>
      </div>

      {/* MODALS */}
      {/* 1. Member Add/Edit Modal */}
      <MemberFormModal
        isOpen={showFormModal}
        member={editingMember}
        existingMembers={members}
        units={units}
        customFields={customFields}
        lockedUnit={isUnitOp ? assignedUnit : undefined}
        initialGender={activeTab === 'ladies_wing' ? 'Female' : undefined}
        userSession={userSession}
        onClose={() => {
          setShowFormModal(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
        onOpenFieldManager={() => setShowFieldManagerModal(true)}
      />

      {/* 2. Member Profile Details Modal */}
      <MemberDetailsModal
        isOpen={showDetailsModal}
        member={selectedMember}
        units={units}
        customFields={customFields}
        userSession={userSession}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedMember(null);
        }}
        onEdit={(m) => {
          setShowDetailsModal(false);
          setEditingMember(m);
          setShowFormModal(true);
        }}
        onViewIdCard={(m) => {
          setIdCardMember(m);
          setShowIdCardModal(true);
        }}
        onViewReceipt={(m) => {
          setReceiptMember(m);
          setShowReceiptModal(true);
        }}
        onRenew={(m) => {
          setShowDetailsModal(false);
          handleRenewMember(m);
        }}
        onUpdateMember={handleUpdateMember}
        onUpdateUnit={handleUpdateMemberUnit}
        onOpenFieldManager={() => setShowFieldManagerModal(true)}
        onOpenWhatsApp={(m) => {
          setWhatsAppTargetMember(m);
          setShowWhatsAppModal(true);
        }}
        onGenerateCertificate={(m) => {
          setCertRecipientName(m.fullName);
          setCertUnit(m.unit || units[0] || 'Fujairah');
          setCertCourse('Kerala Kalolsavam & Cultural Excellence');
          setShowCertificateModal(true);
        }}
        onUpdateMemberDocuments={handleUpdateMemberDocuments}
        onDeleteMember={handleDeleteMember}
      />

      {/* 3. Official ID Card Generator Modal */}
      <IdCardModal
        member={idCardMember}
        customFields={customFields}
        onClose={() => {
          setShowIdCardModal(false);
          setIdCardMember(null);
        }}
        onViewReceipt={(m) => {
          setReceiptMember(m);
          setShowReceiptModal(true);
        }}
      />

      {/* 4. Official AED Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        member={receiptMember}
        onClose={() => {
          setShowReceiptModal(false);
          setReceiptMember(null);
        }}
      />

      {/* 5. Batch Print Studio Modal */}
      <BatchPrintModal
        isOpen={showBatchPrintModal}
        members={batchPrintMembers.length > 0 ? batchPrintMembers : visibleMembers}
        customFields={customFields}
        onClose={() => {
          setShowBatchPrintModal(false);
          setBatchPrintMembers([]);
        }}
      />

      {/* 6. Units & Areas Manager Modal */}
      <UnitManagerModal
        isOpen={showUnitManagerModal}
        units={units}
        members={members}
        onClose={() => setShowUnitManagerModal(false)}
        onAddUnit={handleAddUnit}
        onRenameUnit={handleRenameUnit}
        onDeleteUnit={handleDeleteUnit}
      />

      {/* 7. Advanced Field Manager Modal */}
      <FieldManagerModal
        isOpen={showFieldManagerModal}
        customFields={customFields}
        onClose={() => setShowFieldManagerModal(false)}
        onSaveCustomFields={(fields) => {
          setCustomFields(fields);
          saveCustomFields(fields);
          broadcastSync('CUSTOM_FIELDS_SYNC');
          pushCloudEntity('customFields', fields, userSession?.username || 'User');
        }}
      />

      {/* 8. Admin Accounts Management Modal */}
      <AdminManagerModal
        isOpen={showAdminManagerModal}
        adminAccounts={adminAccounts}
        currentSession={userSession}
        units={units}
        onClose={() => setShowAdminManagerModal(false)}
        onSaveAccount={handleSaveAdminAccount}
        onDeleteAccount={handleDeleteAdminAccount}
      />

      {/* 9. Emergency Blood Donor Directory Modal */}
      <BloodDonorDirectory
        isOpen={showBloodDirectory}
        members={visibleMembers}
        initialBloodGroup={selectedBloodGroupFilter}
        onClose={() => setShowBloodDirectory(false)}
        onSelectMember={(m) => {
          setSelectedMember(m);
          setShowDetailsModal(true);
        }}
      />

      {/* 10. Data Storage & Google Drive / PC Backup Modal */}
      <BackupAndStorageModal
        isOpen={showBackupModal}
        members={members}
        auditLogs={auditLogs}
        userSession={userSession}
        onClose={() => setShowBackupModal(false)}
        onRestoreBackup={handleRestoreBackup}
        onSmartMergeBackup={handleSmartMergeBackup}
        fullDataPayload={{
          members,
          financeTransactions,
          inventoryItems,
          inventoryLogs,
          classes,
          classParticipants,
          classAttendance,
          adminAccounts,
          auditLogs,
          units,
          customFields,
          contacts,
          documents,
        }}
        onCloudStateReloaded={(cloudState) => {
          if (cloudState) {
            if (Array.isArray(cloudState.members)) {
              setMembers(cloudState.members);
              saveMembersToStorage(cloudState.members);
            }
            if (Array.isArray(cloudState.financeTransactions)) {
              setFinanceTransactions(cloudState.financeTransactions);
              saveFinanceTransactions(cloudState.financeTransactions);
            }
            if (Array.isArray(cloudState.inventoryItems)) {
              setInventoryItems(cloudState.inventoryItems);
              saveInventoryItems(cloudState.inventoryItems);
            }
            if (Array.isArray(cloudState.inventoryLogs)) {
              setInventoryLogs(cloudState.inventoryLogs);
              saveInventoryLogs(cloudState.inventoryLogs);
            }
            if (Array.isArray(cloudState.classes)) {
              setClasses(cloudState.classes);
              saveClasses(cloudState.classes);
            }
            if (Array.isArray(cloudState.classParticipants)) {
              setClassParticipants(cloudState.classParticipants);
              saveParticipants(cloudState.classParticipants);
            }
            if (Array.isArray(cloudState.classAttendance)) {
              setClassAttendance(cloudState.classAttendance);
              saveAttendance(cloudState.classAttendance);
            }
            if (Array.isArray(cloudState.adminAccounts)) {
              setAdminAccounts(cloudState.adminAccounts);
              saveAdminAccounts(cloudState.adminAccounts);
            }
            if (Array.isArray(cloudState.units)) {
              setUnits(cloudState.units);
              try {
                localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(cloudState.units));
              } catch {}
            }
            if (Array.isArray(cloudState.customFields)) {
              setCustomFields(cloudState.customFields);
              saveCustomFields(cloudState.customFields);
            }
            if (Array.isArray(cloudState.contacts) || Array.isArray(cloudState.contactBank)) {
              const loadedContacts = cloudState.contacts || cloudState.contactBank;
              setContacts(loadedContacts);
              saveContacts(loadedContacts);
            }
            if (Array.isArray(cloudState.documents) || Array.isArray(cloudState.generalDocuments)) {
              const loadedDocs = cloudState.documents || cloudState.generalDocuments;
              setDocuments(loadedDocs);
              saveDocuments(loadedDocs);
            }
            if (Array.isArray(cloudState.auditLogs)) {
              setAuditLogs(cloudState.auditLogs);
              saveAuditLogs(cloudState.auditLogs);
            }
          }
        }}
      />

      {/* 11. QR Scanner & Member Verifier Modal */}
      <QrScannerModal
        isOpen={showVerifyModal}
        members={members}
        onClose={() => setShowVerifyModal(false)}
        onSelectMember={(m) => {
          setSelectedMember(m);
          setShowDetailsModal(true);
        }}
      />

      {/* 12. Secure Admin Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        adminAccounts={adminAccounts}
        members={members}
        onLogin={(session) => {
          setUserSession(session);
          setShowLoginModal(false);
          fetchCloudState().then((state) => {
            if (state) {
              if (Array.isArray(state.members) && state.members.length > 0) {
                setMembers(state.members);
                saveMembersToStorage(state.members);
              }
              if (Array.isArray(state.financeTransactions)) {
                setFinanceTransactions(state.financeTransactions);
                saveFinanceTransactions(state.financeTransactions);
              }
              if (Array.isArray(state.inventoryItems)) {
                setInventoryItems(state.inventoryItems);
                saveInventoryItems(state.inventoryItems);
              }
            }
          });
        }}
        onClose={() => setShowLoginModal(false)}
        canClose={!!userSession && userSession.isLoggedIn}
      />

      {/* 13. KCA Logo Customizer Modal */}
      <LogoManagerModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
      />

      {/* 14. Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userSession={userSession}
        adminAccounts={adminAccounts}
        onPasswordChanged={handlePasswordChange}
      />

      {/* 15. WhatsApp Integration Modal */}
      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => {
          setShowWhatsAppModal(false);
          setWhatsAppTargetMember(undefined);
        }}
        members={visibleMembers}
        initialMember={whatsAppTargetMember}
        userSession={userSession}
      />

      {/* 16. Dedicated Official Mailbox Modal */}
      <MailboxModal
        isOpen={showMailboxModal}
        onClose={() => setShowMailboxModal(false)}
        members={visibleMembers}
        userSession={userSession}
      />

      {/* 17. Official Report Generator & Analytics Modal */}
      <ReportGeneratorModal
        isOpen={showReportGeneratorModal}
        onClose={() => setShowReportGeneratorModal(false)}
        members={visibleMembers}
        units={units}
        userSession={userSession || undefined}
      />

      {/* 18. Site Theme & Color Scheme Customizer Modal */}
      <ThemeSelectorModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />

      {/* 19. Finance Transaction Entry & Edit Modal */}
      <FinanceFormModal
        isOpen={showFinanceFormModal}
        transactionToEdit={editingFinanceTransaction}
        initialType={newFinanceInitialType}
        existingTransactions={financeTransactions}
        particularsList={loadFinancialParticulars()}
        units={units}
        userSession={userSession}
        lockedUnit={isUnitOp ? assignedUnit : undefined}
        onClose={() => {
          setShowFinanceFormModal(false);
          setEditingFinanceTransaction(null);
        }}
        onSave={handleSaveFinanceTransaction}
      />

      {/* 20. Finance Official Receipt & Payment Voucher Modal */}
      <FinanceReceiptModal
        isOpen={showFinanceReceiptModal}
        transaction={selectedFinanceReceipt}
        onClose={() => {
          setShowFinanceReceiptModal(false);
          setSelectedFinanceReceipt(null);
        }}
      />

      {/* 21. Inventory Item Modal */}
      <InventoryItemModal
        isOpen={showInventoryItemModal}
        item={editingInventoryItem}
        existingItems={inventoryItems}
        units={units}
        lockedUnit={isUnitOp ? assignedUnit : undefined}
        onClose={() => {
          setShowInventoryItemModal(false);
          setEditingInventoryItem(null);
        }}
        onSave={handleSaveInventoryItem}
      />

      {/* 22. Inventory Movement / Handover Modal */}
      <InventoryIssueModal
        isOpen={showInventoryIssueModal}
        item={targetIssueItem}
        recordedByName={userSession?.fullName || 'Admin Officer'}
        onClose={() => {
          setShowInventoryIssueModal(false);
          setTargetIssueItem(null);
        }}
        onConfirm={handleConfirmInventoryMovement}
      />

      {/* 23. Cultural Class / Batch Modal */}
      <ClassFormModal
        isOpen={showClassFormModal}
        editingClass={editingClass}
        units={units}
        existingClasses={classes}
        userSession={userSession}
        onClose={() => {
          setShowClassFormModal(false);
          setEditingClass(null);
        }}
        onSave={handleSaveClass}
      />

      {/* 24. Student / Participant Form Modal */}
      <ParticipantFormModal
        isOpen={showParticipantFormModal}
        editingParticipant={editingParticipant}
        classes={classes}
        units={units}
        existingParticipants={classParticipants}
        userSession={userSession}
        preselectedClassId={participantPreselectedClassId}
        onClose={() => {
          setShowParticipantFormModal(false);
          setEditingParticipant(null);
          setParticipantPreselectedClassId(undefined);
        }}
        onSave={handleSaveParticipant}
      />

      {/* 25. Class Attendance Session Modal */}
      {targetAttendanceClass && (
        <AttendanceModal
          isOpen={showAttendanceModal}
          targetClass={targetAttendanceClass}
          students={classParticipants.filter(
            (p) => p.classId === targetAttendanceClass.id && p.status === 'Active'
          )}
          userSession={userSession}
          onClose={() => {
            setShowAttendanceModal(false);
            setTargetAttendanceClass(null);
          }}
          onSaveAttendance={handleSaveAttendance}
          onUpdateParticipantBatch={handleUpdateParticipantBatch}
        />
      )}
      {/* 26. Official KCA Certificate Generator Modal */}
      <CertificateGeneratorModal
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        units={units}
        initialRecipientName={certRecipientName}
        initialMemberId={certMemberId}
        initialCitation={certCitation}
        initialUnit={certUnit}
        initialCourse={certCourse}
        selectedMembersForBulk={bulkSelectedMembersForCert}
        userSession={userSession}
      />

      {/* 27. Contact Bank Form Modal */}
      <ContactFormModal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setEditingContact(null);
        }}
        initialContact={editingContact}
        units={units}
        userSession={userSession}
        onSave={(savedContact) => {
          let updated: ContactEntry[];
          const idx = contacts.findIndex((c) => c.id === savedContact.id);
          if (idx >= 0) {
            updated = [...contacts];
            updated[idx] = savedContact;
          } else {
            updated = [savedContact, ...contacts];
          }
          setContacts(updated);
          saveContacts(updated);
          setShowContactModal(false);
          setEditingContact(null);
        }}
      />

      {/* 28. General Document Upload/Edit Modal */}
      <DocumentFormModal
        isOpen={showDocumentModal}
        onClose={() => {
          setShowDocumentModal(false);
          setEditingDocument(null);
        }}
        onSave={handleSaveDocument}
        editingDocument={editingDocument}
        existingDocuments={documents}
        units={units}
        userSession={userSession}
      />

      {/* 29. General Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={showDocumentPreviewModal}
        onClose={() => {
          setShowDocumentPreviewModal(false);
          setPreviewDocument(null);
        }}
        document={previewDocument}
        onEdit={(doc) => {
          setEditingDocument(doc);
          setShowDocumentModal(true);
        }}
        onDelete={handleDeleteDocument}
        canEdit={hasAdminPrivilege(userSession.role)}
      />
    </div>
  );
}
