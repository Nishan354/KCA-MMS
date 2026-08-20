import React, { useState } from 'react';
import { AdminAccount, UserSession, UserRole } from '../types/member';
import { getUnitIdPrefix, formatDate } from '../utils/idGenerator';
import {
  X,
  UserPlus,
  Shield,
  Trash2,
  Edit2,
  Key,
  CheckCircle,
  AlertCircle,
  Lock,
  UserCheck,
  Mail,
  User,
  Building2,
  ShieldAlert,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  Calendar,
  Clock,
} from 'lucide-react';

interface AdminManagerModalProps {
  isOpen: boolean;
  adminAccounts: AdminAccount[];
  currentSession: UserSession;
  units?: string[];
  onClose: () => void;
  onSaveAccount: (account: AdminAccount) => void;
  onDeleteAccount: (accountId: string) => void;
}

export const AdminManagerModal: React.FC<AdminManagerModalProps> = ({
  isOpen,
  adminAccounts,
  currentSession,
  units = ['Fujairah', 'Kalba', 'Khorfakhan', 'Dibba'],
  onClose,
  onSaveAccount,
  onDeleteAccount,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('12345');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [showAccountPasswords, setShowAccountPasswords] = useState<Record<string, boolean>>({});
  const [role, setRole] = useState<UserRole>('Unit Data Operator');
  const [unit, setUnit] = useState(units[0] || 'Fujairah');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [createdAtDate, setCreatedAtDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleStartCreate = (defaultRole: UserRole = 'Unit Data Operator', defaultUnit: string = units[0] || 'Fujairah') => {
    setEditingAccount(null);
    setUsername('');
    setFullName('');
    setEmail('');
    setPassword('12345');
    setShowFormPassword(false);
    setRole(defaultRole);
    setUnit(defaultUnit);
    setStatus('Active');
    setCreatedAtDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(true);
    setFeedback(null);
  };

  const handleQuickAddUnitOperator = (targetUnit: string) => {
    const prefixMap: Record<string, string> = {
      Fujairah: 'fu',
      Kalba: 'kb',
      Khorfakhan: 'kf',
      Dibba: 'db',
    };
    const code = prefixMap[targetUnit] || targetUnit.substring(0, 2).toLowerCase();
    const suggestedUsername = `operator_${code}`;

    setEditingAccount(null);
    setUsername(suggestedUsername);
    setFullName(`${targetUnit} Unit Operator`);
    setEmail(`${suggestedUsername}@kca-fujairah.ae`);
    setPassword('12345');
    setShowFormPassword(false);
    setRole('Unit Data Operator');
    setUnit(targetUnit);
    setStatus('Active');
    setCreatedAtDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(true);
    setFeedback(null);
  };

  const handleStartEdit = (account: AdminAccount) => {
    setEditingAccount(account);
    setUsername(account.username);
    setFullName(account.fullName);
    setEmail(account.email);
    setPassword(account.password);
    setShowFormPassword(false);
    setRole(account.role);
    setUnit(account.unit || units[0] || 'Fujairah');
    setStatus(account.status);
    setCreatedAtDate(account.createdAt ? account.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    setShowAddForm(true);
    setFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !password.trim()) {
      setFeedback({ type: 'error', message: 'Please fill in Username, Full Name, and Password.' });
      return;
    }

    // Check duplicate username if creating
    if (!editingAccount) {
      const isDuplicate = adminAccounts.some(
        (a) => a.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (isDuplicate) {
        setFeedback({ type: 'error', message: `Username "${username}" already exists. Please choose a different username.` });
        return;
      }
    }

    const accountToSave: AdminAccount = {
      id: editingAccount ? editingAccount.id : `admin-${Date.now()}`,
      username: username.trim().toLowerCase(),
      fullName: fullName.trim(),
      email: email.trim() || `${username.trim().toLowerCase()}@kca-fujairah.ae`,
      password: password.trim(),
      role,
      unit,
      status,
      createdAt: createdAtDate ? new Date(createdAtDate).toISOString() : (editingAccount ? editingAccount.createdAt : new Date().toISOString()),
      lastLoginAt: editingAccount?.lastLoginAt,
    };

    onSaveAccount(accountToSave);
    setShowAddForm(false);
    setFeedback({
      type: 'success',
      message: `User account "${accountToSave.fullName}" (${accountToSave.username}) successfully saved!`,
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const isUnitRestricted = role === 'Unit Data Operator' || role === 'Unit Coordinator';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg border border-white/20">
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                User Accounts &amp; Unit Access Control
              </h3>
              <p className="text-xs text-red-100">
                Create unit operators (Fujairah, Kalba, Khorfakhan, Dibba) and central administrators
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!showAddForm ? (
            <>
              {/* Unit Operator Quick Creation Bar */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
                    Quick Setup: Unit Data Operators
                  </h4>
                </div>
                <p className="text-xs text-amber-900 mb-3">
                  Unit operators can only add/edit data for their unit and download ID cards. They cannot access other units&apos; data or system administration.
                </p>
                <div className="flex flex-wrap gap-2">
                  {units.map((u) => {
                    const prefix = getUnitIdPrefix(u);
                    return (
                      <button
                        key={u}
                        onClick={() => handleQuickAddUnitOperator(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-amber-100 text-amber-950 text-xs font-semibold border border-amber-300 shadow-xs transition-colors cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5 text-[#8b0000]" />
                        <span>+ Add {u} User</span>
                        <span className="font-mono text-[10px] bg-amber-100 px-1 py-0.2 rounded text-amber-900">
                          {prefix}1001
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Header and Add Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Registered Users &amp; Unit Operators ({adminAccounts.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Manage login accounts, joined dates, and permission roles for central and unit personnel.
                  </p>
                </div>

                <button
                  onClick={() => handleStartCreate('Unit Data Operator')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Custom User
                </button>
              </div>

              {/* Accounts List Table */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">User &amp; Email</th>
                      <th className="p-3">Username / Login</th>
                      <th className="p-3">Role &amp; Privileges</th>
                      <th className="p-3">Assigned Unit</th>
                      <th className="p-3">Joined Date</th>
                      <th className="p-3">Password</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {adminAccounts.map((acc) => {
                      const isCurrent = acc.username.toLowerCase() === currentSession.username.toLowerCase();
                      const isUnitOp = acc.role === 'Unit Data Operator' || acc.role === 'Unit Coordinator';
                      const unitPrefix = getUnitIdPrefix(acc.unit);

                      return (
                        <tr key={acc.id} className="hover:bg-white transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{acc.fullName}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{acc.email}</div>
                          </td>

                          <td className="p-3 font-mono font-bold text-[#8b0000]">
                            {acc.username}
                          </td>

                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                isUnitOp
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              {acc.role}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {isUnitOp ? 'Unit data only & card export' : 'Central full system access'}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{acc.unit || 'Fujairah'}</span>
                            </div>
                            <div className="text-[10.5px] font-mono text-[#8b0000] mt-0.5">
                              Series: {unitPrefix}1001
                            </div>
                          </td>

                          {/* USER JOINED DATE */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-[#8b0000]" />
                              <span>{formatDate(acc.createdAt || '2024-01-01')}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{acc.lastLoginAt ? `Active: ${formatDate(acc.lastLoginAt)}` : 'Registered User'}</span>
                            </div>
                          </td>

                          <td className="p-3 font-mono text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono select-none">
                                {showAccountPasswords[acc.id] ? acc.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowAccountPasswords((prev) => ({
                                    ...prev,
                                    [acc.id]: !prev[acc.id],
                                  }))
                                }
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                                title={showAccountPasswords[acc.id] ? 'Hide password' : 'Show password'}
                              >
                                {showAccountPasswords[acc.id] ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="p-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                acc.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {acc.status}
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEdit(acc)}
                                className="p-1.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                                title="Edit Account"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {acc.username !== 'admin' && !isCurrent && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete account "${acc.fullName}" (${acc.username})?`)) {
                                      onDeleteAccount(acc.id);
                                    }
                                  }}
                                  className="p-1.5 rounded bg-white hover:bg-red-50 text-red-600 border border-slate-200 transition-colors cursor-pointer"
                                  title="Delete Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Add / Edit Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#8b0000]" />
                  <h4 className="font-bold text-sm text-slate-900">
                    {editingAccount ? 'Edit User Account' : 'Create New User / Unit Operator'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  &larr; Back to List
                </button>
              </div>

              {/* Role explanation callout */}
              {isUnitRestricted ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">Unit Data Operator Privileges &amp; Restrictions:</span>
                    <ul className="list-disc list-inside text-[11.5px] space-y-0.5 text-blue-800">
                      <li>Can <strong>only view and manage data</strong> for the assigned unit (<strong>{unit}</strong>).</li>
                      <li>Can add new members with automatic ID series <strong>{getUnitIdPrefix(unit)}1001</strong>.</li>
                      <li>Can view and download ID cards (PNG / Print) for their unit.</li>
                      <li><strong>No access to other units&apos; data and no admin privileges</strong> (cannot change settings, audit logs, or system accounts).</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">Central Administrator Role:</span>
                    <p className="text-[11.5px] text-amber-800">
                      This user has global access across all units (Fujairah, Kalba, Khorfakhan, Dibba), can manage user accounts, backups, custom fields, and system settings.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Role */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Account Role &amp; Access Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none font-medium"
                  >
                    <option value="Unit Data Operator">Unit Data Operator (Restricted to assigned unit only)</option>
                    <option value="Unit Coordinator">Unit Coordinator (Unit Representative)</option>
                    <option value="Super Admin">Super Admin (Central Full Control)</option>
                    <option value="Admin">Admin (General Central Administration)</option>
                    <option value="Executive Officer">Executive Officer (Central Records &amp; Print)</option>
                    <option value="Desk Auditor">Desk Auditor (Read Only)</option>
                  </select>
                </div>

                {/* Assigned Unit */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Unit <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none font-medium"
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u} Unit &mdash; ID Series ({getUnitIdPrefix(u)}1001)
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    ID series for this unit will follow: <strong className="font-mono text-[#8b0000]">{getUnitIdPrefix(unit)}1001</strong>
                  </span>
                </div>

                {/* Username */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username / Login ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. operator_fu, operator_kb, operator_kf, operator_db"
                      disabled={!!editingAccount && editingAccount.username === 'admin'}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none disabled:bg-slate-100 font-mono"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                      title={showFormPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Operator Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kalba Unit Data Incharge"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. kalba.unit@kca-fujairah.ae"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none"
                    />
                  </div>
                </div>

                {/* USER JOINED DATE */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    User Joined / Account Creation Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      required
                      value={createdAtDate}
                      onChange={(e) => setCreatedAtDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-md bg-[#8b0000] hover:bg-[#730000] text-white transition-colors shadow-xs cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  {editingAccount ? 'Update User Account' : 'Save User Account'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>All accounts are stored in persistent storage with role-based security isolation.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
