import React from 'react';
import { FinanceTransaction } from '../types/finance';
import { KcaLogo } from './Logo';
import { formatAED, formatDate } from '../utils/idGenerator';
import { PUBLISHED_PORTAL_URL, OFFICIAL_EMAIL } from '../config/constants';
import { downloadFinanceVoucherPdf } from '../utils/financeVoucherGenerator';
import { X, Printer, Download, Building2, CheckCircle2 } from 'lucide-react';

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
  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'INCOME';
  const docTitle = isIncome ? 'Official Income Receipt' : 'Official Payment Voucher';
  const unitDisplay = transaction.unit === 'Central Committee' ? 'Central Committee' : `${transaction.unit} Unit`;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Top Control Bar */}
        <div className="no-print px-5 py-3.5 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div>
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <span>{docTitle}</span>
              <span className="text-[11px] font-mono font-normal bg-white/20 px-2 py-0.5 rounded text-white">
                {transaction.receiptNumber}
              </span>
            </h3>
            <p className="text-xs text-red-100 mt-0.5">
              Unit: <strong>{unitDisplay}</strong> &bull; Date: {formatDate(transaction.date)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          <div
            id="kca-finance-voucher-print"
            className="bg-white p-6 sm:p-8 rounded-lg border border-slate-300 shadow-sm w-full max-w-xl text-slate-900 font-sans relative"
          >
            {/* Header with KCA Logo & Title */}
            <div className="flex items-center gap-4 pb-4 border-b-2 border-[#8b0000]">
              <div className="shrink-0 drop-shadow-xs">
                <KcaLogo size={52} />
              </div>
              <div className="flex-1">
                <h1 className="font-display font-black text-base sm:text-lg text-[#8b0000] uppercase tracking-tight leading-tight">
                  KAIRALI CULTURAL ASSOCIATION FUJAIRAH
                </h1>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mt-0.5">
                  FUJAIRAH
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Email: {OFFICIAL_EMAIL}
                </div>
              </div>
            </div>

            {/* Receipt Type & Voucher Number Banner */}
            <div className="my-4 p-3 bg-slate-50 rounded-md border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                    isIncome
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {docTitle}
                </span>
                <div className="text-xs font-bold text-[#8b0000] font-mono mt-1">
                  VOUCHER NO: {transaction.receiptNumber}
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="text-slate-500">
                  Date: <strong className="text-slate-800">{formatDate(transaction.date)}</strong>
                </div>
                <div className="text-slate-700 font-bold flex items-center justify-end gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-[#8b0000]" />
                  <span>{unitDisplay}</span>
                </div>
              </div>
            </div>

            {/* Transaction Grid */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/70 rounded-md border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium block">
                    {isIncome ? 'Received With Thanks From:' : 'Paid To (Beneficiary / Vendor):'}
                  </span>
                  <span className="font-bold text-slate-900 text-sm block mt-0.5">
                    {transaction.partyName || 'N/A'}
                  </span>
                  {transaction.contactNumber && (
                    <span className="text-[11px] text-slate-500 font-mono block">
                      Contact: {transaction.contactNumber}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Category &amp; Payment Method:</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {transaction.category}
                  </span>
                  <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                    Mode: <strong>{transaction.paymentMethod}</strong>
                    {transaction.referenceNumber ? ` (Ref: ${transaction.referenceNumber})` : ''}
                  </span>
                </div>
              </div>

              {/* Particulars & Amount Table */}
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#8b0000] text-white font-bold">
                    <tr>
                      <th className="p-2.5">Particulars / Transaction Details</th>
                      <th className="p-2.5 text-right w-36">Amount (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3 align-top">
                        <div className="font-semibold text-slate-900 whitespace-pre-wrap leading-relaxed">
                          {transaction.particulars}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Association Unit: {unitDisplay}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-base text-slate-900 align-top">
                        {formatAED(transaction.amountAED)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-100 border-t-2 border-[#8b0000] font-bold">
                    <tr>
                      <td className="p-2.5 text-[#8b0000] uppercase font-display text-xs">
                        Total {isIncome ? 'Received' : 'Paid'} (AED)
                      </td>
                      <td className="p-2.5 text-right font-mono text-base text-[#8b0000] font-black">
                        {formatAED(transaction.amountAED)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {transaction.notes && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded text-[11px] text-amber-900">
                  <strong>Remarks / Notes:</strong> {transaction.notes}
                </div>
              )}
            </div>

            {/* Authorized Signatures: Secretary and Treasurer */}
            <div className="pt-10 mt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-center">
              <div>
                <div className="border-t border-slate-400 mx-auto w-36 mb-1.5" />
                <div className="font-bold text-xs text-slate-900">Secretary</div>
                <div className="text-[10px] text-slate-500">KCA Fujairah</div>
              </div>

              <div>
                <div className="border-t border-slate-400 mx-auto w-36 mb-1.5" />
                <div className="font-bold text-xs text-slate-900">Treasurer</div>
                <div className="text-[10px] text-slate-500">KCA Fujairah</div>
              </div>
            </div>

            {/* Bottom Official Note */}
            <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
              Official computer-generated financial document issued by Kairali Cultural Association Fujairah &bull; {unitDisplay}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="no-print px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>Download {isIncome ? 'Receipt PDF' : 'Voucher PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold rounded-md bg-[#8b0000] hover:bg-[#730000] text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print {isIncome ? 'Receipt' : 'Voucher'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
