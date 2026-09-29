import React, { useState, useEffect } from 'react';
import { FinanceTransaction } from '../types/finance';
import { KcaLogo } from './Logo';
import { formatAED, formatDate } from '../utils/idGenerator';
import { OFFICIAL_AFFILIATION } from '../config/constants';
import { downloadFinanceVoucherPdf } from '../utils/financeVoucherGenerator';

import {
  X,
  Printer,
  Download,
  Building2,
  CheckCircle2,
  Paperclip,
  Eye,
  FileCheck,
  Image as ImageIcon,
  Mail,
} from 'lucide-react';

interface FinanceReceiptModalProps {
  isOpen: boolean;
  transaction: FinanceTransaction | null;
  onClose: () => void;
}

export const FinanceReceiptModal: React.FC<FinanceReceiptModalProps> = ({
  isOpen,
  transaction,
  onClose,
}) => {
  const [showBillLightbox, setShowBillLightbox] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showBillLightbox) {
          setShowBillLightbox(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showBillLightbox, onClose]);

  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'INCOME';
  const isInvoice = !!transaction.isInvoice;
  const docTitle = isInvoice
    ? 'INVOICE'
    : isIncome
    ? 'OFFICIAL INCOME RECEIPT'
    : 'OFFICIAL PAYMENT VOUCHER';
  const unitDisplay =
    transaction.unit === 'Central Committee' || transaction.unit === 'Central'
      ? 'Central Committee'
      : `${transaction.unit} Unit`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadFinanceVoucherPdf(transaction);
    } catch (e) {
      console.error('Failed to download voucher PDF:', e);
    }
  };

  const handleDownloadAttachment = () => {
    if (!transaction.billAttachment) return;
    const a = document.createElement('a');
    a.href = transaction.billAttachment.dataUrl;
    a.download = transaction.billAttachment.fileName || `Bill_Voucher_${transaction.receiptNumber}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
                {transaction.receiptNumber}
              </span>
            </h3>
            <p className="text-xs text-rose-100 mt-0.5">
              Unit: <strong>{unitDisplay}</strong> &bull; Date: {formatDate(transaction.date)}
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
            id="kca-finance-voucher-print"
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
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                    isInvoice
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : isIncome
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {docTitle}
                </span>
                <div className="text-xs font-bold text-[#881337] font-mono mt-1">
                  DOC NO: {transaction.receiptNumber}
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="text-slate-500">
                  Date of Issue: <strong className="text-slate-800">{formatDate(transaction.date)}</strong>
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
                  <div className="text-slate-500 font-semibold">
                    {isIncome ? 'Received From (Payer):' : 'Paid To (Beneficiary / Vendor):'}
                  </div>
                  <div className="font-bold text-sm text-[#881337] mt-0.5">
                    {transaction.partyName}
                  </div>
                  {transaction.contactNumber && (
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                      Tel: {transaction.contactNumber}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-slate-500 font-semibold">Payment Mode:</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {transaction.paymentMethod}
                  </div>
                  {transaction.referenceNumber && (
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                      Ref/Bill: {transaction.referenceNumber}
                    </div>
                  )}
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
                        {transaction.particulars || transaction.category}
                      </td>
                      <td className="p-3 text-slate-600">
                        {transaction.category}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-sm text-slate-900">
                        {formatAED(transaction.amountAED)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-slate-700 uppercase text-[11px]">
                        {isIncome ? 'Total Amount Received (AED)' : 'Total Amount Paid (AED)'}
                      </td>
                      <td className="p-2.5 text-right font-mono text-base text-[#881337] font-black">
                        {formatAED(transaction.amountAED)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {transaction.notes && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                  <strong>Remarks / Notes:</strong> {transaction.notes}
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

          {/* Attached Bill / Voucher Document Panel */}
          {transaction.billAttachment && (
            <div className="no-print w-full max-w-xl bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                    {transaction.billAttachment.fileType.startsWith('image/') ? (
                      <ImageIcon className="w-5 h-5" />
                    ) : (
                      <FileCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Attached Bill / Invoice Proof</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-sm">
                      {transaction.billAttachment.fileName} {transaction.billAttachment.fileSizeKb ? `(${transaction.billAttachment.fileSizeKb} KB)` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {transaction.billAttachment.fileType.startsWith('image/') && (
                    <button
                      type="button"
                      onClick={() => setShowBillLightbox(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Bill</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDownloadAttachment}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="no-print px-5 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>Download {isIncome ? 'Receipt PDF' : 'Voucher PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold rounded-lg bg-[#881337] hover:bg-[#700f2b] text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print {isIncome ? 'Receipt' : 'Voucher'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Size Attached Bill Lightbox */}
      {showBillLightbox && transaction.billAttachment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-800">
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Paperclip className="w-4 h-4 text-amber-400" />
                <span>{transaction.billAttachment.fileName}</span>
              </div>
              <button
                onClick={() => setShowBillLightbox(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950">
              <img
                src={transaction.billAttachment.dataUrl}
                alt="Bill attachment"
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
