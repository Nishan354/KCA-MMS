import React, { useState, useEffect } from 'react';
import { Member } from '../types/member';
import { KcaLogo } from './Logo';
import { formatAED, formatDate } from '../utils/idGenerator';
import { downloadReceiptPdf } from '../utils/pdfGenerator';
import { amountToWordsAED } from '../utils/financeVoucherGenerator';
import { OFFICIAL_AFFILIATION } from '../config/constants';
import {
  X,
  Printer,
  Download,
  Building2,
  CheckCircle2,
  Send,
  Share2,
  Check,
  Mail,
  UserCheck,
  Phone,
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onOpenWhatsApp?: (member: Member) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  member,
  onClose,
  onOpenWhatsApp,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !member) return null;

  const isRenewal =
    member.registrationCategory === 'Renewal' ||
    (member.paymentHistory && member.paymentHistory.some((p) => p.purpose === 'Renewal Fee')) ||
    (!!member.lastRenewalDate && member.lastRenewalDate !== member.registrationDate);

  const docTitle = 'OFFICIAL INCOME RECEIPT';
  const receiptNo = member.receiptNumber || `REC-${member.membershipId}`;
  const issueDate = member.lastRenewalDate || member.registrationDate;
  const ledgerHead = isRenewal ? 'Renewal Membership Fee' : 'New Membership Fee';
  const particulars = isRenewal
    ? `Annual Membership Renewal Fee - ID: ${member.membershipId} (${member.fullName})`
    : `Annual Membership Registration Fee - ID: ${member.membershipId} (${member.fullName})`;

  const unitDisplay =
    member.unit === 'Central Committee' || member.unit === 'Central'
      ? 'Central Committee'
      : `${member.unit} Unit`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      await downloadReceiptPdf(member);
    } catch (err) {
      console.error('Failed to download PDF receipt:', err);
      alert('Could not download PDF receipt. Please use the Print button.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyReceiptText = () => {
    const text = `*KAIRALI CULTURAL ASSOCIATION FUJAIRAH*\n*OFFICIAL PAYMENT RECEIPT*\n\nReceipt No: ${receiptNo}\nMember Name: ${member.fullName}\nMembership ID: ${member.membershipId}\nUnit: ${unitDisplay}\nLedger Head: ${ledgerHead}\nAmount Received: AED ${member.feeAmountAED}\nPayment Mode: ${member.paymentMethod || 'Cash'}\nDate: ${formatDate(issueDate)}\nValid Thru: ${formatDate(member.expiryDate)}\nStatus: ${member.paymentStatus}\n\nOfficial financial document issued by Kairali Cultural Association Fujairah • Email: kairalicaf@gmail.com`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendWhatsAppReceipt = () => {
    if (onOpenWhatsApp) {
      onOpenWhatsApp(member);
      return;
    }

    const messageText = `*KAIRALI CULTURAL ASSOCIATION FUJAIRAH*\n*OFFICIAL INCOME RECEIPT*\n\nDear *${member.fullName}*,\n\nWe gratefully acknowledge receipt of your membership payment.\n\n*Receipt No:* ${receiptNo}\n*Membership ID:* ${member.membershipId}\n*Unit:* ${unitDisplay}\n*Category:* ${ledgerHead}\n*Amount Received:* ${formatAED(member.feeAmountAED)} (${amountToWordsAED(member.feeAmountAED)})\n*Valid Thru:* ${formatDate(member.expiryDate)}\n*Payment Status:* ${member.paymentStatus}\n\nThank you,\nKairali Cultural Association Fujairah • Email: kairalicaf@gmail.com`;

    const phone = (member.whatsapp || member.phoneUAE || '').replace(/[^0-9]/g, '');
    if (phone) {
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
      window.open(waUrl, '_blank');
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Modal Top Control Bar */}
        <div className="no-print px-5 py-3.5 bg-[#881337] text-white flex items-center justify-between shadow-xs shrink-0">
          <div>
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <span>{docTitle}</span>
              <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                {receiptNo}
              </span>
            </h3>
            <p className="text-xs text-rose-100 mt-0.5">
              Unit: <strong>{unitDisplay}</strong> &bull; Member: <strong>{member.fullName}</strong> ({member.membershipId})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
              title="Close modal (Esc)"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center gap-4">
          <div
            id="kca-official-receipt-print"
            className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-md w-full max-w-xl text-slate-900 font-sans relative"
          >
            {/* Header with KCA Logo & Title */}
            <div className="flex items-center gap-4 pb-4 border-b-2 border-[#881337]">
              <div className="shrink-0 drop-shadow-xs">
                <KcaLogo size={52} />
              </div>
              <div className="flex-1">
                <h1 className="font-display font-black text-base sm:text-lg text-[#881337] uppercase tracking-tight leading-tight">
                  KAIRALI CULTURAL ASSOCIATION FUJAIRAH
                </h1>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mt-0.5">
                  FUJAIRAH &bull; UNITED ARAB EMIRATES
                </div>
                <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wide mt-0.5">
                  {OFFICIAL_AFFILIATION}
                </div>
                {/* Mandatory Permanent Contact Block */}
                <div className="text-[11px] text-slate-600 font-semibold mt-1 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-[#881337]" />
                  <span>Email: kairalicaf@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Receipt Type & Voucher Number Banner */}
            <div className="my-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {docTitle}
                </span>
                <div className="text-xs font-bold text-[#881337] font-mono mt-1">
                  DOC NO: {receiptNo}
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="text-slate-500">
                  Date of Issue: <strong className="text-slate-800">{formatDate(issueDate)}</strong>
                </div>
                <div className="text-slate-700 font-bold flex items-center justify-end gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-[#881337]" />
                  <span>{unitDisplay}</span>
                </div>
              </div>
            </div>

            {/* Transaction Key Value Details */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/70 rounded-lg border border-slate-200">
                <div>
                  <div className="text-slate-500 font-semibold">Received From (Payer):</div>
                  <div className="font-bold text-sm text-[#881337] mt-0.5">
                    {member.fullName}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    <span>ID: {member.membershipId}</span>
                  </div>
                  {(member.phoneUAE || member.whatsapp) && (
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{member.phoneUAE || member.whatsapp}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-slate-500 font-semibold">Payment Mode:</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {member.paymentMethod || 'Cash'}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Valid Thru: <strong>{formatDate(member.expiryDate)}</strong>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Status: {member.paymentStatus}</span>
                  </div>
                </div>
              </div>

              {/* Table of Particulars & Amount */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#881337] text-white">
                    <tr>
                      <th className="p-2.5">Particulars &amp; Description</th>
                      <th className="p-2.5">Ledger Head</th>
                      <th className="p-2.5 text-right">Amount (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">
                        <div>{particulars}</div>
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Validity Period: Up to {formatDate(member.expiryDate)}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        {ledgerHead}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-sm text-slate-900">
                        {formatAED(member.feeAmountAED)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-slate-700 uppercase text-[11px]">
                        Total Amount Received (AED)
                      </td>
                      <td className="p-2.5 text-right font-mono text-base text-[#881337] font-black">
                        {formatAED(member.feeAmountAED)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* In Words Section */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-500 text-[10px] uppercase font-semibold">
                  Amount in Words (AED):
                </div>
                <div className="font-bold text-slate-900 italic mt-0.5">
                  {amountToWordsAED(member.feeAmountAED)} (AED {member.feeAmountAED.toFixed(2)})
                </div>
              </div>

              {(member as any).remarks && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                  <strong>Remarks / Notes:</strong> {(member as any).remarks}
                </div>
              )}
            </div>

            {/* Authorized Signatures: Secretary and Treasurer */}
            <div className="pt-8 mt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-center">
              <div>
                <div className="border-t border-slate-400 mx-auto w-36 mb-1.5" />
                <div className="font-bold text-xs text-slate-900">{unitDisplay} Secretary</div>
                <div className="text-[10px] text-slate-500">Authorized Signature</div>
              </div>

              <div>
                <div className="border-t border-slate-400 mx-auto w-36 mb-1.5" />
                <div className="font-bold text-xs text-slate-900">{unitDisplay} Treasurer</div>
                <div className="text-[10px] text-slate-500">Treasury Verification</div>
              </div>
            </div>

            {/* Bottom Official Note with Mandatory Email */}
            <div className="mt-6 text-center text-[10px] text-slate-500 border-t border-slate-100 pt-2 font-medium">
              Official computer-generated financial document issued by Kairali Cultural Association Fujairah &bull; Contact: kairalicaf@gmail.com
            </div>
          </div>
        </div>

        {/* Modal Footer Action Bar */}
        <div className="no-print px-5 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Send via WhatsApp */}
            <button
              type="button"
              onClick={handleSendWhatsAppReceipt}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              title="Send receipt details to member via WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp Receipt</span>
            </button>

            {/* Copy Receipt Text */}
            <button
              type="button"
              onClick={handleCopyReceiptText}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>{isExportingPdf ? 'Exporting...' : 'Download Receipt PDF'}</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold rounded-lg bg-[#881337] hover:bg-[#700f2b] text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

