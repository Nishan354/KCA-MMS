import React, { useState } from 'react';
import { Member } from '../types/member';
import { getExpiryStatus, formatDate } from '../utils/idGenerator';
import { findMemberByQuery } from '../utils/memberLookup';
import { KcaLogo } from './Logo';
import {
  X,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Search,
  Camera,
  Upload,
  Phone,
  HeartPulse,
  MapPin,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface QrScannerModalProps {
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
  onSelectMember: (member: Member) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  members,
  isOpen,
  onClose,
  onSelectMember,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [scannedMember, setScannedMember] = useState<Member | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setScanError(null);
    const query = searchInput.trim();
    if (!query) return;

    // Search by membershipId, mobile number, or name using findMemberByQuery
    const found = findMemberByQuery(query, members);

    if (found) {
      setScannedMember(found);
    } else {
      setScannedMember(null);
      setScanError(`No member found matching "${query}". Please check the Mobile Number or Membership ID.`);
    }
  };

  const handleSimulateScan = (m: Member) => {
    setScannedMember(m);
    setSearchInput(m.membershipId);
    setScanError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center border border-white/20">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Member ID Verification & QR Scanner
              </h3>
              <p className="text-xs text-red-100">
                Instant authenticity check for KCA Fujairah membership cards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* Search / Scan Box */}
          <form onSubmit={handleManualSearch} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Enter Card ID, Scan QR Payload, or Name:
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g. KCA-FU-1001 or Member Name..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Verify
              </button>
            </div>

            {/* Quick Demo Scan Buttons */}
            <div>
              <span className="text-[11px] font-medium text-slate-500 mr-2">Quick test scan:</span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {members.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSimulateScan(m)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-red-50 hover:text-[#8b0000] border border-slate-200 rounded text-[11px] font-mono text-slate-700 font-medium transition-colors"
                  >
                    {m.membershipId} ({m.fullName.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Scan Error Notice */}
          {scanError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#8b0000] shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Verification Results */}
          {scannedMember && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
              {/* Verified Ribbon */}
              <div className="bg-emerald-800 text-white px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-300" />
                  <span className="font-display font-semibold text-xs uppercase tracking-wider text-emerald-100">
                    Official Authentic Card Verified
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold bg-emerald-900/60 px-2 py-0.5 rounded text-white">
                  {scannedMember.membershipId}
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-20 rounded-md overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-xs">
                    <img
                      src={scannedMember.photoUrl}
                      alt={scannedMember.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-lg text-slate-900 leading-tight truncate">
                      {scannedMember.fullName}
                    </h4>
                    {scannedMember.malayalamName && (
                      <div className="text-xs text-slate-500 font-normal">{scannedMember.malayalamName}</div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-red-50 text-[#8b0000] font-mono font-semibold text-xs rounded border border-red-200">
                        Blood: {scannedMember.bloodGroup}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-medium text-xs rounded border border-slate-200">
                        Unit: {scannedMember.unit}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-900 font-medium text-xs rounded border border-amber-200">
                        {scannedMember.membershipType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expiry & Status check */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] font-semibold">Valid Thru:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatDate(scannedMember.expiryDate)}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] font-semibold">Validity Status:</span>
                    <span className={`font-semibold inline-block px-2 py-0.5 rounded text-[11px] ${getExpiryStatus(scannedMember.expiryDate).color}`}>
                      {getExpiryStatus(scannedMember.expiryDate).label}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      onSelectMember(scannedMember);
                      onClose();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Open Full Member Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
