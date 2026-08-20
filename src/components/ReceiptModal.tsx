import React from 'react';
import { Member } from '../types/member';
import { KcaLogo } from './Logo';
import { formatAED, formatDate, getMemberVerifyUrl } from '../utils/idGenerator';
import { downloadReceiptPdf } from '../utils/pdfGenerator';
import {
  X,
  Printer,
  Download,
  Share2,
  ShieldCheck,
  Send,
  CheckCircle,
  Check,
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
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  if (!isOpen || !member) return null;

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

  const handleCopyReceiptLink = () => {
    const link = getMemberVerifyUrl(member, true);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Determine clean payment description: Only "Renewal Membership Fee" or "New Membership Fee"
  const isRenewal =
    member.registrationCategory === 'Renewal' ||
    (member.paymentHistory && member.paymentHistory.some((p) => p.purpose === 'Renewal Fee')) ||
    (!!member.lastRenewalDate && member.lastRenewalDate !== member.registrationDate);
  const paymentDescription = isRenewal ? 'Renewal Membership Fee' : 'New Membership Fee';

  const handleSendWhatsAppReceipt = () => {
    if (onOpenWhatsApp) {
      onOpenWhatsApp(member);
      return;
    }

    const verifyUrl = getMemberVerifyUrl(member, true);
    const messageText = `*KAIRALI CULTURAL ASSOCIATION FUJAIRAH*\n*OFFICIAL PAYMENT RECEIPT*\n\nDear *${member.fullName}*,\n\nWe gratefully acknowledge receipt of your membership payment.\n\n*Receipt Voucher:* ${member.receiptNumber || 'REC-' + member.membershipId}\n*Membership ID:* ${member.membershipId}\n*Description:* ${paymentDescription}\n*Amount Received:* ${formatAED(member.feeAmountAED)}\n*Valid Thru:* ${formatDate(member.expiryDate)}\n*Payment Status:* ${member.paymentStatus}\n\n*View & Download Digital Receipt:* ${verifyUrl}\n\nThank you,\nKairali Cultural Association Fujairah`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Top Controls */}
        <div className="px-6 py-3 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-200" />
            <span className="font-display font-bold text-sm text-white">
              Official Payment Receipt (AED)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 md:p-8 bg-slate-100 overflow-y-auto flex-1 flex justify-center">
          <div
            id="kca-official-receipt-print"
            className="bg-white p-6 md:p-8 rounded-lg border border-slate-200 shadow-sm w-full max-w-xl text-slate-900 font-sans relative"
          >
            {/* Top Ribbon */}
            <div className="flex items-center justify-between border-b-2 border-[#8b0000] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <KcaLogo size={52} />
                <div>
                  <h2 className="font-display font-bold text-lg tracking-tight uppercase text-[#8b0000] leading-tight">
                    KAIRALI CULTURAL ASSOCIATION
                  </h2>
                  <div className="font-display font-semibold text-sm tracking-wider text-slate-800">
                    FUJAIRAH
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    kairalicaf@gmail.com
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono font-bold text-[#8b0000] bg-red-50 px-2 py-1 rounded border border-red-200">
                  OFFICIAL RECEIPT
                </div>
              </div>
            </div>

            {/* Receipt Title & Meta */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase text-[#8b0000] tracking-wider">
                  Receipt Voucher No.
                </div>
                <div className="font-mono font-bold text-base text-[#8b0000]">
                  {member.receiptNumber || `REC-${member.membershipId}`}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">
                  Date of Issue
                </div>
                <div className="font-mono font-semibold text-xs text-slate-800">
                  {formatDate(member.registrationDate)}
                </div>
              </div>
            </div>

            {/* Member Details in Receipt */}
            <div className="space-y-3 mb-6 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Received From:</span>
                  <span className="font-bold text-sm text-slate-900">{member.fullName}</span>
                  {member.malayalamName && (
                    <span className="block text-slate-600 text-xs">{member.malayalamName}</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Membership ID:</span>
                  <span className="font-mono font-bold text-sm text-[#8b0000]">{member.membershipId}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Unit:</span>
                  <span className="font-medium text-slate-800">{member.unit} Unit</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Valid Thru:</span>
                  <span className="font-mono font-semibold text-slate-800">{formatDate(member.expiryDate)}</span>
                </div>
              </div>
            </div>

            {/* Fee Breakdown in United Arab Emirates Dirhams (AED) */}
            <div className="border border-slate-200 rounded-md overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Amount (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-900">
                        {paymentDescription}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Valid for period up to {formatDate(member.expiryDate)}
                      </div>
                    </td>
                    <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                      {formatAED(member.feeAmountAED)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-[#8b0000] font-semibold">
                  <tr>
                    <td className="p-2.5 text-[#8b0000] font-display text-sm">TOTAL AMOUNT RECEIVED (AED)</td>
                    <td className="p-2.5 text-right font-mono text-base text-[#8b0000] font-bold">
                      {formatAED(member.feeAmountAED)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Mode Note */}
            <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded border border-slate-200 mb-8">
              <div>
                <span className="text-slate-500">Payment Mode: </span>
                <span className="font-semibold text-slate-800">{member.paymentMethod || 'Cash'}</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Status: {member.paymentStatus}</span>
              </div>
            </div>

            {/* Only Two Signatures: Secretary and Treasurer */}
            <div className="pt-8 border-t border-slate-200 flex items-end justify-between px-6">
              <div className="text-center w-36">
                <div className="border-b border-slate-400 pb-2"></div>
                <div className="text-xs font-bold text-slate-800 mt-1.5">Secretary</div>
              </div>

              <div className="text-center w-36">
                <div className="border-b border-slate-400 pb-2"></div>
                <div className="text-xs font-bold text-slate-800 mt-1.5">Treasurer</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Send via WhatsApp */}
            <button
              onClick={handleSendWhatsAppReceipt}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer"
              title="Send secure PDF receipt link to member via WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send WhatsApp Receipt</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-[#8b0000] hover:bg-[#730000] text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyReceiptLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
