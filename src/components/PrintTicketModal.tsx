import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { X, Printer, FileText, Receipt, Scroll, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
import { PawnContract, ShopSettings, InterestPayment } from '../types/pawn';
import {
  formatCurrency,
  formatThaiDate,
  formatThaiDateTime,
  bahtToText,
  formatCitizenId,
  formatPhone,
  formatDurationText
} from '../utils/thaiFormat';

export type PrintFormat = 'a5_ticket' | 'a5_interest_receipt' | 'a5_redeem_receipt' | 'slip' | 'full_contract';

interface PrintTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: PawnContract;
  settings: ShopSettings;
  defaultMode?: 'slip' | 'half_a4' | 'a5_ticket' | 'full_contract' | 'interest_receipt' | 'a5_interest_receipt' | 'redeem_receipt' | 'a5_redeem_receipt';
  activeReceipt?: InterestPayment;
}

/**
 * Automatically shrinks content proportionally ONLY when its natural height
 * exceeds the available space above .signature-block inside a 148mm x 210mm A5 page.
 */
const AutoFitPrintContent: React.FC<{
  children: React.ReactNode;
  depKey: string;
}> = ({ children, depKey }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  const recalculateScale = useCallback(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    // Measure at natural 100% width so scale never oscillates
    const prevTransform = inner.style.transform;
    const prevOrigin = inner.style.transformOrigin;
    const prevWidth = inner.style.width;
    inner.style.transform = '';
    inner.style.transformOrigin = '';
    inner.style.width = '';

    const availableHeight = container.clientHeight;
    const naturalHeight = inner.scrollHeight;

    inner.style.transform = prevTransform;
    inner.style.transformOrigin = prevOrigin;
    inner.style.width = prevWidth;

    if (availableHeight > 0 && naturalHeight > availableHeight) {
      const nextScale = Math.max(0.62, Math.floor(((availableHeight - 2) / naturalHeight) * 1000) / 1000);
      setScale(nextScale);
    } else {
      setScale(1);
    }
  }, []);

  useLayoutEffect(() => {
    recalculateScale();
  }, [depKey, recalculateScale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      recalculateScale();
    });
    observer.observe(container);

    const handleBeforePrint = () => {
      recalculateScale();
    };
    window.addEventListener('beforeprint', handleBeforePrint);

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        recalculateScale();
      });
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [recalculateScale]);

  return (
    <div ref={containerRef} className="print-content overflow-hidden">
      <div
        ref={innerRef}
        style={
          scale < 1
            ? {
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: `${100 / scale}%`,
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
};

interface A5SignatureBlockProps {
  leftName: string;
  leftRole: string;
  rightName: string;
  rightRole: string;
  showQr?: boolean;
  qrImageUrl?: string;
}

const A5SignatureBlock: React.FC<A5SignatureBlockProps> = ({
  leftName,
  leftRole,
  rightName,
  rightRole,
  showQr = false,
  qrImageUrl,
}) => (
  <div
    className={`signature-block text-[9.5px] text-black ${
      showQr ? '' : 'signature-block--no-qr'
    }`}
  >
    <div className={showQr ? 'flex-1 min-w-0 text-center' : 'w-[46mm] min-w-0 text-center'}>
      <div className="h-[14mm] border-b border-dotted border-black mx-2" />
      <div className="mt-1 font-semibold text-black break-words leading-snug">
        ({leftName})
      </div>
      <div className="text-[8.5px] text-black leading-snug">{leftRole}</div>
    </div>

    <div className="w-[14mm] h-[14mm] border border-dashed border-black rounded flex flex-col items-center justify-center text-[8px] text-black shrink-0 leading-tight">
      <span>ประทับตรา</span>
      <span>ร้าน</span>
    </div>

    <div className={showQr ? 'flex-1 min-w-0 text-center' : 'w-[46mm] min-w-0 text-center'}>
      <div className="h-[14mm] border-b border-dotted border-black mx-2" />
      <div className="mt-1 font-semibold text-black break-words leading-snug">
        ({rightName})
      </div>
      <div className="text-[8.5px] text-black leading-snug">{rightRole}</div>
    </div>

    {showQr && (
      <div className="flex flex-col items-center shrink-0">
        {qrImageUrl ? (
          <img
            src={qrImageUrl}
            alt="QR ตรวจสอบสัญญา"
            className="w-[13.5mm] h-[13.5mm] border border-black rounded p-[1px] bg-white object-contain"
          />
        ) : (
          <div className="w-[13.5mm] h-[13.5mm] border border-black rounded bg-white" />
        )}
        <span className="text-[7.5px] text-black mt-0.5 font-mono leading-none">สแกนตรวจสอบ</span>
      </div>
    )}
  </div>
);

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  isOpen,
  onClose,
  contract,
  settings,
  defaultMode = 'a5_ticket',
  activeReceipt,
}) => {
  const resolveFormat = useCallback((mode: PrintTicketModalProps['defaultMode']): PrintFormat => {
    if (mode === 'slip') return 'slip';
    if (mode === 'full_contract') return 'full_contract';
    if (mode === 'interest_receipt' || mode === 'a5_interest_receipt') return 'a5_interest_receipt';
    if (mode === 'redeem_receipt' || mode === 'a5_redeem_receipt') return 'a5_redeem_receipt';
    return 'a5_ticket';
  }, []);

  const [format, setFormat] = useState<PrintFormat>(() => resolveFormat(defaultMode));
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setFormat(resolveFormat(defaultMode));
    }
  }, [isOpen, defaultMode, resolveFormat]);

  // Generate QR code locally in-browser (zero external network request; omitted for redemption receipt)
  useEffect(() => {
    if (!isOpen || format === 'a5_redeem_receipt') {
      setQrDataUrl(undefined);
      return;
    }

    let cancelled = false;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const verificationUrl = `${origin}/?c=${encodeURIComponent(contract.contractNumber)}`;

    QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate local QR code:', err);
        if (!cancelled) {
          setQrDataUrl(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, format, contract.contractNumber]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const effectiveLogo = (settings.logoUrl && !settings.logoUrl.includes('/src/assets/'))
    ? settings.logoUrl
    : '/shop_logo.jpg';

  const monthlyInterest = (contract.loanAmount * contract.monthlyInterestRate) / 100;
  const totalMonths = Math.max(0, contract.durationMonths || 0) + Math.max(0, contract.durationDays || 0) / 30;
  const periodInterest = Math.round(contract.loanAmount * (contract.monthlyInterestRate / 100) * (totalMonths || 1));

  const customerFullName = `${contract.customerSnapshot.prefix || ''}${contract.customerSnapshot.firstName} ${contract.customerSnapshot.lastName}`.trim();
  const staffOrManagerName = contract.createdBy || settings.ownerName || 'ผู้รับซื้อฝาก';
  const latestInterestReceipt = activeReceipt || contract.interestPayments[contract.interestPayments.length - 1];

  const categoryLabel =
    contract.item.category === 'notebook'
      ? 'โน็ตบุ้ค'
      : contract.item.category === 'printer'
      ? 'เครื่องพิมพ์'
      : contract.item.category === 'computer'
      ? 'คอมพิวเตอร์พีซี'
      : contract.item.category === 'phone'
      ? 'สมาร์ตโฟน/แท็บเล็ต'
      : 'อุปกรณ์ไอที';

  const termsLines = (settings.termsAndConditions || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const renderAssetSpecsBlock = () => (
    <>
      {contract.item.notebook && (
        <div className="grid grid-cols-2 gap-1 bg-white p-1.5 rounded border border-black text-[9.5px] mt-1 font-mono text-black leading-snug">
          <div className="break-words"><strong>S/N:</strong> {contract.item.notebook.serialNumber}</div>
          <div className="break-words"><strong>CPU:</strong> {contract.item.notebook.processor}</div>
          <div className="break-words"><strong>RAM:</strong> {contract.item.notebook.ramGb}GB / <strong>Storage:</strong> {contract.item.notebook.storage}</div>
          <div className="break-words"><strong>อุปกรณ์:</strong> {contract.item.notebook.hasCharger ? 'สายชาร์จแท้' : 'ไม่มีชาร์จ'}{contract.item.notebook.hasBag ? ', กระเป๋า' : ''}</div>
        </div>
      )}

      {contract.item.printer && (
        <div className="grid grid-cols-2 gap-1 bg-white p-1.5 rounded border border-black text-[9.5px] mt-1 text-black leading-snug">
          <div className="break-words"><strong>S/N:</strong> <span className="font-mono">{contract.item.printer.serialNumber}</span></div>
          <div className="break-words"><strong>ยี่ห้อ/รุ่น:</strong> {contract.item.printer.brand} {contract.item.printer.model}</div>
          <div className="break-words"><strong>ระบบหมึก:</strong> {contract.item.printer.inkSystem === 'genuine_tank' ? 'แท็งก์แท้ศูนย์' : 'ตลับหมึก'}</div>
          <div className="break-words"><strong>สภาพหัวพิมพ์:</strong> {contract.item.printer.headCondition === 'normal' ? 'สมบูรณ์ 100%' : 'มีเส้น/ต้องล้าง'}</div>
        </div>
      )}

      {contract.item.computer && (
        <div className="grid grid-cols-2 gap-1 bg-white p-1.5 rounded border border-black text-[9.5px] mt-1 text-black leading-snug">
          <div className="break-words"><strong>เคส/แบรนด์:</strong> {contract.item.computer.brandOrCustom}</div>
          <div className="break-words"><strong>ซีพียู/แรม:</strong> {contract.item.computer.processor} (RAM {contract.item.computer.ramGb}GB)</div>
          <div className="break-words"><strong>การ์ดจอ:</strong> {contract.item.computer.gpu || '-'}</div>
          <div className="break-words"><strong>ความจุ:</strong> {contract.item.computer.storage}</div>
        </div>
      )}

      {contract.item.phone && (
        <div className="grid grid-cols-2 gap-1 bg-white p-1.5 rounded border border-black text-[9.5px] mt-1 font-mono text-black leading-snug">
          <div className="break-words"><strong>IMEI / S/N:</strong> {contract.item.phone.imei}</div>
          <div className="break-words"><strong>ความจุ:</strong> {contract.item.phone.storageGb} · <strong>iCloud:</strong> {contract.item.phone.icloudStatus === 'unlocked' ? 'ปลดล็อคแล้ว' : 'ติดรหัส'}</div>
        </div>
      )}

      {contract.item.itGadget && (
        <div className="grid grid-cols-2 gap-1 bg-white p-1.5 rounded border border-black text-[9.5px] mt-1 text-black leading-snug">
          <div className="break-words"><strong>ยี่ห้อ/รุ่น:</strong> {contract.item.itGadget.brand} {contract.item.itGadget.model}</div>
          <div className="break-words"><strong>S/N:</strong> <span className="font-mono">{contract.item.itGadget.serialNumber || '-'}</span></div>
          <div className="col-span-2 break-words"><strong>รายละเอียด:</strong> {contract.item.itGadget.specsSummary}</div>
        </div>
      )}
    </>
  );

  const renderShopHeader = (badgeTitle: string, rightTopLabel: string, rightTopValue: string, rightSubLabel: string, rightSubValue: string) => (
    <div className="border-b border-black pb-2 mb-2">
      <div className="flex justify-between items-start gap-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <img
            src={effectiveLogo}
            alt="Logo"
            onError={(e) => {
              if (e.currentTarget.src !== window.location.origin + '/shop_logo.jpg') {
                e.currentTarget.src = '/shop_logo.jpg';
              }
            }}
            className="w-11 h-11 rounded object-contain bg-white p-0.5 border border-black shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-[13.5px] font-bold tracking-tight text-black break-words leading-snug">
              {settings.shopName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}
            </h1>
            <p className="text-[9.5px] text-black font-medium leading-snug">
              {settings.branchName} · โทร. {settings.phone}
            </p>
            <p className="text-[9px] text-black leading-snug break-words">
              {settings.address}
            </p>
            <p className="text-[9px] text-black leading-snug">
              Line: {settings.lineId} · Facebook: {settings.facebook || 'พัทลุงปริ้นเตอร์'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 flex flex-col items-end">
          <span className="inline-block border border-black bg-white text-black font-bold px-2 py-0.5 rounded text-[9.5px] tracking-wide mb-1 whitespace-nowrap">
            {badgeTitle}
          </span>
          <div className="text-[10.5px] text-black leading-snug">
            <span className="font-normal">{rightTopLabel}: </span>
            <strong className="font-mono font-bold text-[12px] text-black">{rightTopValue}</strong>
          </div>
          <div className="text-[9.5px] text-black mt-0.5 leading-snug">
            <span>{rightSubLabel}: </span>
            <strong>{rightSubValue}</strong>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto print:static print:block print:inset-auto print:w-[148mm] print:h-auto print:p-0 print:m-0 print:bg-white print:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="w-full h-full sm:h-auto sm:max-h-[96vh] max-w-4xl bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden flex flex-col my-auto print:static print:block print:w-[148mm] print:max-w-none print:h-auto print:max-h-none print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none print:overflow-visible">
        
        {/* Unified A5 Portrait Print Stylesheet */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A5 portrait;
              margin: 0;
            }
            @media print {
              html, body {
                width: 148mm !important;
                height: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                overflow: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print, header, nav, .tabs, button {
                display: none !important;
              }
              .print-page {
                box-sizing: border-box !important;
                width: 148mm !important;
                height: 209.5mm !important;
                max-width: 148mm !important;
                max-height: 209.5mm !important;
                padding: 6mm 6mm 6mm 6mm !important;
                margin: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                overflow: hidden !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .print-page:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              .print-content {
                flex: 1 1 auto !important;
                min-height: 0 !important;
              }
              .signature-block {
                margin-top: auto !important;
                flex: 0 0 auto !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: flex-end !important;
                padding-top: 4mm !important;
              }
              .signature-block.signature-block--no-qr {
                justify-content: space-around !important;
              }
            }
          `
        }} />

        {/* Header - Controls (Hidden during print) */}
        <div className="no-print flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">ศูนย์พิมพ์เอกสาร ตั๋วสัญญา & ใบเสร็จรับเงิน (A5)</h3>
              <p className="text-xs text-slate-500">
                สัญญาเลขที่: <span className="font-mono font-bold text-slate-800">{contract.contractNumber}</span> · ผู้ขายฝาก: {contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>สั่งพิมพ์ (A5)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Format Selector Bar (Hidden during print) */}
        <div className="no-print tabs flex items-center gap-1.5 px-3 sm:px-6 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="text-slate-500 font-medium whitespace-nowrap mr-2">รูปแบบเอกสาร:</span>
          
          <button
            type="button"
            onClick={() => setFormat('a5_ticket')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              format === 'a5_ticket'
                ? 'bg-amber-400 text-slate-950 shadow-xs border border-amber-500'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            ตั๋วสัญญาขายฝากไอที (A5) ⭐
          </button>

          {contract.interestPayments.length > 0 && (
            <button
              type="button"
              onClick={() => setFormat('a5_interest_receipt')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                format === 'a5_interest_receipt'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              ใบเสร็จต่อดอกเบี้ย (A5)
            </button>
          )}

          {contract.redemption && (
            <button
              type="button"
              onClick={() => setFormat('a5_redeem_receipt')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                format === 'a5_redeem_receipt'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              ใบเสร็จไถ่ถอน (A5)
            </button>
          )}

          <button
            type="button"
            onClick={() => setFormat('slip')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              format === 'slip'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            ตั๋วสลิป (พิมพ์ A5)
          </button>

          <button
            type="button"
            onClick={() => setFormat('full_contract')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              format === 'full_contract'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Scroll className="w-3.5 h-3.5" />
            สัญญาเต็มฉบับ (A5 หลายหน้า)
          </button>
        </div>

        {/* Printable Viewport */}
        <div
          className="flex-1 p-2 sm:p-5 overflow-auto bg-slate-200 flex justify-center items-start print:block print:p-0 print:m-0 print:bg-white print:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          
          {/* ========================================================================= */}
          {/* FORMAT 1: A5 PORTRAIT TICKET (ตั๋วสัญญาขายฝากไอที ขนาด A5 แนวตั้ง 148 x 210mm) */}
          {/* ========================================================================= */}
          {format === 'a5_ticket' && (
            <div className="print-page shadow-md border border-slate-300 font-contract leading-snug text-[10px] shrink-0">
              <AutoFitPrintContent depKey={`ticket-${contract.id}-${contract.createdAt}-${contract.amendmentLogs.length}`}>
                {renderShopHeader(
                  'ตั๋วสัญญาขายฝาก / จำนำไอที (A5)',
                  'เลขที่สัญญา',
                  contract.contractNumber,
                  'วันที่ทำรายการ',
                  formatThaiDate(contract.startDate)
                )}

                {/* Customer & Pledged Terms Summary */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-white p-2 rounded border border-black text-black">
                    <div className="font-bold text-black border-b border-black pb-0.5 mb-1 text-[10px] flex justify-between items-center">
                      <span>ข้อมูลผู้ขายฝาก / จำนำ</span>
                      <span className="text-[9px] text-black font-mono">ID: {contract.customerId}</span>
                    </div>
                    <div className="space-y-0.5 text-[9.5px] leading-snug">
                      <div className="break-words">
                        <span>ชื่อ-สกุล: </span>
                        <strong className="text-black font-bold">{customerFullName}</strong>
                      </div>
                      <div>
                        <span>เลขบัตรประชาชน: </span>
                        <strong className="font-mono text-black">{formatCitizenId(contract.customerSnapshot.citizenId)}</strong>
                      </div>
                      <div>
                        <span>เบอร์โทรศัพท์: </span>
                        <strong className="font-mono text-black">{formatPhone(contract.customerSnapshot.phone)}</strong>
                      </div>
                      <div className="text-[9px] text-black break-words leading-snug">
                        <span>ที่อยู่: </span>{contract.customerSnapshot.address}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded border border-black text-black">
                    <div className="font-bold text-black border-b border-black pb-0.5 mb-1 text-[10px] flex justify-between items-center">
                      <span>เงื่อนไขระยะเวลา & ครบกำหนด</span>
                      <span className="font-mono text-black font-bold">{formatDurationText(contract.durationMonths, contract.durationDays)}</span>
                    </div>
                    <div className="space-y-0.5 text-[9.5px] leading-snug">
                      <div>
                        <span>ระยะเวลาสัญญา: </span>
                        <strong className="text-black">{formatDurationText(contract.durationMonths, contract.durationDays)}</strong>
                      </div>
                      <div>
                        <span>วันครบกำหนดไถ่ถอน: </span>
                        <strong className="text-black font-bold underline">{formatThaiDate(contract.dueDate, true)}</strong>
                      </div>
                      <div>
                        <span>อัตราดอกเบี้ย: </span>
                        <strong className="text-black">{contract.monthlyInterestRate}% ต่อเดือน</strong>
                      </div>
                      <div className="text-[9px] text-black break-words leading-snug">
                        <span>ที่เก็บรักษา: </span>
                        <span className="text-black">{contract.storageLocation || 'ตู้นิรภัยไอที ร้านพัทลุงปริ้นเตอร์'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item Details Box */}
                <div className="border border-black rounded p-2 mb-2 bg-white text-black">
                  <div className="font-bold text-black border-b border-black pb-0.5 mb-1 flex justify-between items-center text-[10px]">
                    <span>รายการทรัพย์สินไอทีที่นำมาฝาก / จำนำ</span>
                    <span className="text-[9px] px-1.5 py-0.5 border border-black rounded text-black font-medium">
                      หมวด: {categoryLabel}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10.5px] font-bold text-black break-words leading-snug">{contract.item.name}</div>
                    <div className="text-[9.5px] text-black leading-snug break-words">{contract.item.description}</div>
                    {renderAssetSpecsBlock()}
                  </div>
                </div>

                {/* Financial Box */}
                <div className="bg-white border border-black text-black p-2 rounded mb-2 flex justify-between items-center gap-2 text-[10px]">
                  <div className="min-w-0">
                    <div className="text-black text-[9px]">จำนวนเงินต้นรับจำนำ / ขายฝาก:</div>
                    <div className="text-base font-bold font-mono tracking-tight text-black leading-snug">
                      {formatCurrency(contract.loanAmount)}
                    </div>
                    <div className="text-[9px] text-black font-medium break-words">({bahtToText(contract.loanAmount)})</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-black text-[9px]">ดอกเบี้ยต่องวด ({formatDurationText(contract.durationMonths, contract.durationDays)}):</div>
                    <div className="text-sm font-bold font-mono text-black leading-snug">
                      ฿{periodInterest.toLocaleString()} บาท
                    </div>
                    <div className="text-[9px] text-black font-normal">
                      (เฉลี่ยเดือนละ {formatCurrency(monthlyInterest)})
                    </div>
                  </div>
                </div>

                {/* Shop Payment Transfer Info */}
                <div className="bg-white border border-black rounded p-1.5 mb-1.5 text-[9px] text-black leading-snug">
                  <div className="font-bold text-black mb-0.5">
                    ช่องทางชำระดอกเบี้ย / โอนเงินต่อสัญญา:
                  </div>
                  <div className="break-words">
                    {settings.bankName || 'ธนาคารกสิกรไทย'} เลขที่ <strong className="font-mono text-black">{settings.bankAccountNumber || '083-4-26805-8'}</strong> ({settings.bankAccountName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}) · พร้อมเพย์: <strong className="font-mono text-black">{settings.promptPayId || '0834268058'}</strong>
                  </div>
                  <div className="text-[8.5px] text-black mt-0.5">
                    * เมื่อโอนชำระเงินแล้วกรุณาส่งสลิปทาง Line: <strong>{settings.lineId || 'poi1800'}</strong> พร้อมแจ้งสัญญา <strong>{contract.contractNumber}</strong>
                  </div>
                </div>

                {/* Terms Warning */}
                <div className="text-[8.5px] text-black bg-white p-1.5 rounded border border-black space-y-0.5 leading-snug">
                  <div>1. โปรดนำตั๋วสัญญาฉบับนี้พร้อมบัตรประชาชนมาแสดงทุกครั้งที่ติดต่อชำระดอกเบี้ยหรือไถ่ถอนทรัพย์สิน</div>
                  <div>2. หากครบกำหนดสัญญาและพ้นระยะเวลาผ่อนผัน <strong>{settings.gracePeriodDays || 15} วัน</strong> ทรัพย์สินจะตกเป็นกรรมสิทธิ์ของผู้รับซื้อฝากโดยเด็ดขาดตามกฎหมาย</div>
                </div>
              </AutoFitPrintContent>

              <A5SignatureBlock
                leftName={customerFullName}
                leftRole="ผู้ขายฝาก / จำนำ"
                rightName={staffOrManagerName}
                rightRole="ผู้รับซื้อฝาก / จนท."
                showQr
                qrImageUrl={qrDataUrl}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMAT 2: A5 PORTRAIT INTEREST RECEIPT (ใบเสร็จต่อดอกเบี้ย ขนาด A5 แนวตั้ง) */}
          {/* ========================================================================= */}
          {format === 'a5_interest_receipt' && (
            <div className="print-page shadow-md border border-slate-300 font-contract leading-snug text-[10px] shrink-0">
              {!latestInterestReceipt ? (
                <div className="flex-1 flex items-center justify-center text-black text-xs">
                  ยังไม่มีประวัติการต่อดอกเบี้ยในสัญญานี้
                </div>
              ) : (
                <>
                  <AutoFitPrintContent depKey={`interest-${contract.id}-${latestInterestReceipt.id}`}>
                    {renderShopHeader(
                      'ใบเสร็จรับเงินชำระดอกเบี้ย (A5)',
                      'เลขที่ใบเสร็จ',
                      latestInterestReceipt.receiptNumber,
                      'สัญญาอ้างอิง',
                      contract.contractNumber
                    )}

                    {/* Customer & Payment Meta */}
                    <div className="grid grid-cols-2 gap-2 text-[9.5px] mb-2 bg-white p-2 rounded border border-black text-black leading-snug">
                      <div className="space-y-0.5">
                        <div className="break-words"><span>ชื่อลูกค้า: </span><strong className="text-black">{customerFullName}</strong></div>
                        <div><span>เลขบัตร: </span><span className="font-mono text-black">{formatCitizenId(contract.customerSnapshot.citizenId)}</span></div>
                        <div><span>เบอร์โทร: </span><span className="font-mono text-black">{formatPhone(contract.customerSnapshot.phone)}</span></div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div><span>วันที่ชำระ: </span><strong className="text-black">{formatThaiDateTime(latestInterestReceipt.date)}</strong></div>
                        <div><span>ผู้รับเงิน: </span><strong className="text-black">{latestInterestReceipt.recordedBy}</strong></div>
                        <div><span>ช่องทาง: </span><span className="font-semibold text-black">{latestInterestReceipt.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงินเข้าบัญชี'}</span></div>
                      </div>
                    </div>

                    {/* Interest & Extension Details */}
                    <div className="border border-black rounded p-2 text-[10px] mb-2 space-y-1.5 bg-white text-black leading-snug">
                      <div className="font-bold text-black flex justify-between items-start gap-2 border-b border-black pb-1">
                        <span className="break-words">ทรัพย์สินค้ำประกัน: {contract.item.name}</span>
                        <span className="text-black font-mono shrink-0">เงินต้น: {formatCurrency(contract.loanAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between text-black text-[9.5px]">
                        <span>ระยะเวลาที่ต่อสัญญา:</span>
                        <strong className="text-black">{latestInterestReceipt.monthsPaid} เดือน (อัตรา {latestInterestReceipt.ratePercent}% ต่อเดือน)</strong>
                      </div>

                      <div className="border-t border-slate-300 pt-1 space-y-0.5 text-[9.5px]">
                        <div className="flex justify-between">
                          <span>๑. ค่าดอกเบี้ยตามงวด:</span>
                          <span className="font-mono font-semibold">{formatCurrency(latestInterestReceipt.interestAmount)}</span>
                        </div>
                        {latestInterestReceipt.discountAmount > 0 && (
                          <div className="flex justify-between">
                            <span>๒. ส่วนลดดอกเบี้ย:</span>
                            <span className="font-mono font-semibold">-{formatCurrency(latestInterestReceipt.discountAmount)}</span>
                          </div>
                        )}
                        {latestInterestReceipt.lateFee > 0 && (
                          <div className="flex justify-between">
                            <span>๓. ค่าปรับล่าช้า:</span>
                            <span className="font-mono font-semibold">+{formatCurrency(latestInterestReceipt.lateFee)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white p-1.5 rounded border border-black flex items-center justify-between text-[9.5px] text-black">
                        <div>
                          <div>วันครบกำหนดเดิม:</div>
                          <strong className="text-black">{formatThaiDate(latestInterestReceipt.previousDueDate)}</strong>
                        </div>
                        <div className="text-black font-bold text-sm">➔</div>
                        <div className="text-right">
                          <div className="text-black font-bold">วันครบกำหนดใหม่:</div>
                          <strong className="text-black font-bold text-[11px] underline">{formatThaiDate(latestInterestReceipt.newDueDate, true)}</strong>
                        </div>
                      </div>

                      {latestInterestReceipt.note && (
                        <div className="text-[9px] text-black border-t border-slate-300 pt-1 break-words">
                          <strong>หมายเหตุ:</strong> {latestInterestReceipt.note}
                        </div>
                      )}
                    </div>

                    {/* Total Amount Banner */}
                    <div className="bg-white border border-black text-black p-2.5 rounded mb-2 flex justify-between items-center gap-2 text-[10px]">
                      <div>
                        <div className="text-black text-[9px]">ยอดเงินดอกเบี้ยที่รับชำระสุทธิ:</div>
                        <div className="text-base font-bold font-mono text-black leading-snug">{formatCurrency(latestInterestReceipt.totalPaid)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-black text-[9px]">ตัวอักษร:</div>
                        <div className="text-black font-medium break-words">({bahtToText(latestInterestReceipt.totalPaid)})</div>
                      </div>
                    </div>

                    <div className="text-[9px] text-black bg-white p-1.5 rounded border border-black leading-snug">
                      ใบเสร็จฉบับนี้เป็นหลักฐานการต่ออายุสัญญาขายฝากถึงวันที่ <strong>{formatThaiDate(latestInterestReceipt.newDueDate, true)}</strong> กรุณาเก็บรักษาไว้พร้อมตั๋วสัญญาฉบับจริง
                    </div>
                  </AutoFitPrintContent>

                  <A5SignatureBlock
                    leftName={customerFullName}
                    leftRole="ผู้ชำระเงิน"
                    rightName={latestInterestReceipt.recordedBy}
                    rightRole="ผู้รับเงิน / แคชเชียร์"
                    showQr
                    qrImageUrl={qrDataUrl}
                  />
                </>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMAT 3: A5 PORTRAIT REDEEM RECEIPT (ใบเสร็จรับเงินไถ่ถอน ขนาด A5 แนวตั้ง) */}
          {/* ========================================================================= */}
          {format === 'a5_redeem_receipt' && contract.redemption && (
            <div className="print-page shadow-md border border-slate-300 font-contract leading-snug text-[10px] shrink-0">
              <AutoFitPrintContent depKey={`redeem-${contract.id}-${contract.redemption.receiptNumber}`}>
                {renderShopHeader(
                  'ใบเสร็จรับเงินไถ่ถอน / ส่งมอบคืน (A5)',
                  'เลขที่ใบเสร็จ',
                  contract.redemption.receiptNumber,
                  'สัญญาอ้างอิง',
                  contract.contractNumber
                )}

                {/* Customer & Redemption Meta */}
                <div className="grid grid-cols-2 gap-2 text-[9.5px] mb-2 bg-white p-2 rounded border border-black text-black leading-snug">
                  <div className="space-y-0.5">
                    <div className="break-words"><span>ชื่อลูกค้า: </span><strong className="text-black">{customerFullName}</strong></div>
                    <div><span>เลขบัตร: </span><span className="font-mono text-black">{formatCitizenId(contract.customerSnapshot.citizenId)}</span></div>
                    <div><span>เบอร์โทร: </span><span className="font-mono text-black">{formatPhone(contract.customerSnapshot.phone)}</span></div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div><span>วันที่ไถ่ถอน: </span><strong className="text-black">{formatThaiDateTime(contract.redemption.redeemDate)}</strong></div>
                    <div><span>ผู้ดำเนินการ: </span><strong className="text-black">{contract.redemption.recordedBy}</strong></div>
                    <div><span>วิธีชำระ: </span><strong>{contract.redemption.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงินเข้าบัญชี'}</strong></div>
                  </div>
                </div>

                {/* Returned Item & Financial Breakdown */}
                <div className="border border-black rounded p-2 text-[10px] mb-2 space-y-1 bg-white text-black leading-snug">
                  <div className="font-bold text-black border-b border-black pb-0.5">
                    รายการทรัพย์สินที่ส่งมอบคืน: {contract.item.name}
                  </div>
                  <div className="text-[9.5px] text-black break-words">{contract.item.description}</div>
                  {renderAssetSpecsBlock()}
                  
                  <div className="border-t border-black pt-1.5 mt-1 space-y-0.5 text-[9.5px] text-black">
                    <div className="flex justify-between">
                      <span>๑. เงินต้นที่ไถ่ถอน:</span>
                      <strong className="font-mono text-black">{formatCurrency(contract.redemption.principalPaid)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>๒. ดอกเบี้ยคงค้าง:</span>
                      <strong className="font-mono text-black">{formatCurrency(contract.redemption.interestPaid)}</strong>
                    </div>
                    {contract.redemption.discountAmount > 0 && (
                      <div className="flex justify-between text-black">
                        <span>๓. ส่วนลดพิเศษ:</span>
                        <strong className="font-mono text-black">-{formatCurrency(contract.redemption.discountAmount)}</strong>
                      </div>
                    )}
                    {contract.redemption.extraFee > 0 && (
                      <div className="flex justify-between text-black">
                        <span>๔. ค่าปรับล่าช้า / ธรรมเนียม:</span>
                        <strong className="font-mono text-black">+{formatCurrency(contract.redemption.extraFee)}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Banner */}
                <div className="bg-white border border-black text-black p-2.5 rounded mb-2 flex justify-between items-center gap-2 text-[10px]">
                  <div>
                    <div className="text-black text-[9px]">ยอดรวมทั้งสิ้นที่ชำระไถ่ถอน:</div>
                    <div className="text-base font-bold font-mono text-black leading-snug">{formatCurrency(contract.redemption.totalPaid)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-black text-[9px]">ตัวอักษร:</div>
                    <div className="text-black font-medium break-words">({bahtToText(contract.redemption.totalPaid)})</div>
                  </div>
                </div>

                <p className="text-[9px] text-black bg-white p-1.5 rounded border border-black leading-snug">
                  ผู้ขายฝากได้รับมอบทรัพย์สินตามรายการข้างต้นคืนในสภาพเรียบร้อย ถูกต้องตามความประสงค์แล้ว และไม่ติดใจเรียกร้องสิทธิใดๆ ต่อไป
                </p>
              </AutoFitPrintContent>

              <A5SignatureBlock
                leftName={customerFullName}
                leftRole="ผู้รับมอบทรัพย์สินคืน"
                rightName={contract.redemption.recordedBy}
                rightRole="ผู้ส่งมอบทรัพย์สิน / เจ้าหน้าที่"
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMAT 4: SLIP / SUMMARY TICKET LAID OUT ON A5 PORTRAIT (ตั๋วสลิปย่อบน A5) */}
          {/* ========================================================================= */}
          {format === 'slip' && (
            <div className="print-page shadow-md border border-slate-300 font-contract leading-snug text-[10px] shrink-0">
              <AutoFitPrintContent depKey={`slip-${contract.id}-${contract.startDate}`}>
                {/* Receipt Header adapted cleanly for A5 */}
                <div className="text-center pb-2 border-b border-dashed border-black mb-2">
                  <img
                    src={effectiveLogo}
                    alt="Logo"
                    onError={(e) => {
                      if (e.currentTarget.src !== window.location.origin + '/shop_logo.jpg') {
                        e.currentTarget.src = '/shop_logo.jpg';
                      }
                    }}
                    className="w-12 h-12 mx-auto mb-1 rounded object-contain bg-white p-0.5 border border-black"
                  />
                  <div className="font-bold text-sm tracking-tight text-black leading-snug">
                    {settings.shopName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}
                  </div>
                  <div className="text-[9.5px] text-black">
                    {settings.branchName} · โทร: {settings.phone}
                    {settings.promptPayId ? ` · พร้อมเพย์: ${settings.promptPayId}` : ''}
                  </div>
                  <div className="inline-block font-bold text-[10.5px] mt-1.5 px-4 py-0.5 border border-black rounded bg-white text-black">
                    ใบตั๋วสลิปขายฝาก / จำนำไอที (A5)
                  </div>
                </div>

                {/* Key-Value Summary Grid */}
                <div className="grid grid-cols-2 gap-3 py-2 border-b border-dashed border-black text-[9.5px]">
                  <div className="space-y-1">
                    <div className="flex justify-between gap-2">
                      <span>เลขที่สัญญา:</span>
                      <strong className="font-mono font-bold text-[11px]">{contract.contractNumber}</strong>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>วันที่ทำรายการ:</span>
                      <span>{formatThaiDate(contract.startDate)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>ระยะเวลา:</span>
                      <span>{formatDurationText(contract.durationMonths, contract.durationDays)}</span>
                    </div>
                    <div className="flex justify-between gap-2 font-bold">
                      <span>วันครบกำหนด:</span>
                      <span className="underline">{formatThaiDate(contract.dueDate, true)}</span>
                    </div>
                  </div>

                  <div className="space-y-1 border-l border-dashed border-black pl-3">
                    <div className="break-words">
                      <strong>ผู้ขายฝาก:</strong> {customerFullName}
                    </div>
                    <div>
                      <strong>เลขบัตร:</strong> <span className="font-mono">{formatCitizenId(contract.customerSnapshot.citizenId)}</span>
                    </div>
                    <div>
                      <strong>โทร:</strong> <span className="font-mono">{formatPhone(contract.customerSnapshot.phone)}</span>
                    </div>
                    <div className="break-words">
                      <strong>จุดเก็บ:</strong> {contract.storageLocation || 'ตู้นิรภัยไอที'}
                    </div>
                  </div>
                </div>

                {/* Asset Summary */}
                <div className="py-2 border-b border-dashed border-black space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold">รายการทรัพย์สิน ({categoryLabel}):</span>
                  </div>
                  <div className="font-bold text-[11px] break-words">{contract.item.name}</div>
                  <div className="text-[9.5px] text-black break-words">{contract.item.description}</div>
                  {renderAssetSpecsBlock()}
                </div>

                {/* Financial Totals */}
                <div className="my-2 p-2.5 border border-black rounded bg-white flex justify-between items-center gap-2">
                  <div>
                    <div className="text-[9px]">เงินต้นที่รับ:</div>
                    <div className="text-lg font-bold font-mono leading-snug">{formatCurrency(contract.loanAmount)}</div>
                    <div className="text-[9px] font-medium">({bahtToText(contract.loanAmount)})</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px]">ดอกเบี้ย ({contract.monthlyInterestRate}% / เดือน):</div>
                    <div className="text-sm font-bold font-mono leading-snug">฿{periodInterest.toLocaleString()} / งวด</div>
                    <div className="text-[9px]">(เฉลี่ย {formatCurrency(monthlyInterest)} / เดือน)</div>
                  </div>
                </div>

                {/* Transfer Info & Note */}
                <div className="border border-dashed border-black rounded p-2 text-[9px] space-y-0.5 leading-snug">
                  <div>
                    <strong>โอนต่อดอกเบี้ย:</strong> {settings.bankName} เลขบัญชี <strong className="font-mono">{settings.bankAccountNumber}</strong> ({settings.bankAccountName})
                  </div>
                  <div>
                    <strong>พร้อมเพย์:</strong> <span className="font-mono">{settings.promptPayId}</span> · แจ้งสลิปทาง Line: <strong>{settings.lineId || 'poi1800'}</strong>
                  </div>
                  <div>
                    * พ้นกำหนดและระยะผ่อนผัน {settings.gracePeriodDays || 15} วัน ทรัพย์สินตกเป็นกรรมสิทธิ์ของร้านทันที
                  </div>
                </div>
              </AutoFitPrintContent>

              <A5SignatureBlock
                leftName={customerFullName}
                leftRole="ผู้ขายฝาก / จำนำ"
                rightName={staffOrManagerName}
                rightRole="เจ้าหน้าที่ผู้ทำรายการ"
                showQr
                qrImageUrl={qrDataUrl}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMAT 5: FULL LEGAL CONTRACT ADAPTED FOR A5 PORTRAIT (2 PAGES, 6MM MARGINS) */}
          {/* ========================================================================= */}
          {format === 'full_contract' && (
            <div className="flex flex-col items-center gap-4 print:block print:gap-0">
              {/* PAGE 1 OF 2 */}
              <div className="print-page shadow-md border border-slate-300 font-contract leading-snug text-[10px] shrink-0">
                <AutoFitPrintContent depKey={`full-p1-${contract.id}-${contract.startDate}`}>
                  {/* Formal Contract Header */}
                  <div className="border-b border-black pb-2 mb-2.5 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={effectiveLogo}
                        alt="Logo"
                        onError={(e) => {
                          if (e.currentTarget.src !== window.location.origin + '/shop_logo.jpg') {
                            e.currentTarget.src = '/shop_logo.jpg';
                          }
                        }}
                        className="w-11 h-11 rounded object-contain bg-white p-0.5 border border-black shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h1 className="text-[14px] font-bold tracking-tight text-black leading-snug">
                          สัญญาขายฝากทรัพย์สินไอทีและคอมพิวเตอร์
                        </h1>
                        <p className="text-[9.5px] text-black leading-snug break-words">
                          ทำขึ้น ณ {settings.shopName} · {settings.address}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="border border-black px-2 py-0.5 rounded text-[9px] font-bold">
                        หน้า 1 / 2
                      </div>
                      <div className="text-[10px] mt-1">
                        เลขที่: <strong className="font-mono">{contract.contractNumber}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Intro & Parties */}
                  <div className="space-y-2 text-[10px] leading-relaxed">
                    <p>
                      สัญญาฉบับนี้ทำขึ้นเมื่อวันที่ <strong>{formatThaiDate(contract.startDate, true)}</strong> ณ {settings.shopName} ({settings.branchName}) ระหว่างคู่สัญญาดังต่อไปนี้:
                    </p>

                    <div className="p-2 rounded border border-black space-y-1.5 bg-white text-[9.5px] leading-snug">
                      <div className="break-words">
                        <strong>๑) ผู้รับซื้อฝาก:</strong> {settings.shopName} โดย {staffOrManagerName} (เลขประจำตัวผู้เสียภาษี {settings.taxId}) ตั้งอยู่เลขที่ {settings.address} โทร. <span className="font-mono">{formatPhone(settings.phone)}</span> ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>&ldquo;ผู้รับซื้อฝาก&rdquo;</strong> ฝ่ายหนึ่ง กับ
                      </div>
                      <div className="border-t border-slate-300 pt-1 break-words">
                        <strong>๒) ผู้ขายฝาก:</strong> {customerFullName} บัตรประจำตัวประชาชนเลขที่ <span className="font-mono font-bold">{formatCitizenId(contract.customerSnapshot.citizenId)}</span> ที่อยู่ {contract.customerSnapshot.address} โทร. <span className="font-mono">{formatPhone(contract.customerSnapshot.phone)}</span> ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>&ldquo;ผู้ขายฝาก&rdquo;</strong> อีกฝ่ายหนึ่ง
                      </div>
                    </div>

                    <p className="font-bold text-[10px]">
                      คู่สัญญาทั้งสองฝ่ายตกลงทำสัญญาขายฝากทรัพย์สิน โดยมีข้อความและเงื่อนไขดังต่อไปนี้:
                    </p>

                    {/* Clause 1 */}
                    <div className="space-y-1">
                      <div className="break-words">
                        <strong>ข้อ ๑. รายการทรัพย์สินและราคาขายฝาก:</strong> ผู้ขายฝากตกลงขายฝากและได้ส่งมอบทรัพย์สินประเภท <strong>{categoryLabel}</strong> คือ <strong>{contract.item.name}</strong> ({contract.item.description})
                        {contract.item.estimatedValue > 0 && ` ราคาประเมิน ${formatCurrency(contract.item.estimatedValue)}`}
                        {' '}ไว้แก่ผู้รับซื้อฝาก ในราคาขายฝาก (เงินต้น) ทั้งสิ้น <strong>{formatCurrency(contract.loanAmount)} ({bahtToText(contract.loanAmount)})</strong> ซึ่งผู้ขายฝากได้รับเงินจำนวนดังกล่าวครบถ้วนถูกต้องแล้วในวันทำสัญญานี้
                      </div>
                      {renderAssetSpecsBlock()}
                    </div>

                    {/* Clause 2 */}
                    <div className="break-words">
                      <strong>ข้อ ๒. กำหนดเวลาไถ่ถอนและสินน้ำใจ:</strong> คู่สัญญากำหนดระยะเวลาไถ่ถอนทรัพย์สินไว้มีกำหนด <strong>{formatDurationText(contract.durationMonths, contract.durationDays)}</strong> นับแต่วันทำสัญญานี้ โดยมีวันครบกำหนดไถ่ถอนในวันที่ <strong className="underline">{formatThaiDate(contract.dueDate, true)}</strong> ในอัตราดอกเบี้ย/สินน้ำใจร้อยละ <strong>{contract.monthlyInterestRate}% ต่อเดือน</strong> (คิดเป็นค่าตอบแทนต่องวด <strong>{formatCurrency(periodInterest)}</strong> หรือเฉลี่ยเดือนละ {formatCurrency(monthlyInterest)})
                    </div>

                    {/* Clause 3 */}
                    <div className="break-words">
                      <strong>ข้อ ๓. การผิดนัดและผลของการพ้นกำหนดเวลา:</strong> หากผู้ขายฝากมิได้มาใช้สิทธิไถ่ถอนหรือติดต่อขอขยายระยะเวลาภายในกำหนดเวลาในข้อ ๒ และพ้นกำหนดระยะเวลาผ่อนผันอีก <strong>{settings.gracePeriodDays || 15} วัน</strong> นับจากวันครบกำหนด ให้ถือว่าผู้ขายฝากสละสิทธิในการไถ่ถอน และกรรมสิทธิ์ในทรัพย์สินที่ขายฝากตกเป็นของผู้รับซื้อฝากโดยเด็ดขาดทันทีตามกฎหมาย โดยผู้รับซื้อฝากมีสิทธินำทรัพย์สินออกจำหน่ายจ่ายโอนได้ทันที
                    </div>
                  </div>
                </AutoFitPrintContent>

                {/* Page 1 Continuation Footer pinned at bottom */}
                <div
                  className="mt-auto flex-none pt-2 border-t border-black flex justify-between items-center text-[9px] text-black"
                  style={{ marginTop: 'auto', flex: '0 0 auto' }}
                >
                  <span>สัญญาเลขที่ <strong className="font-mono">{contract.contractNumber}</strong> · ผู้ขายฝาก: {customerFullName}</span>
                  <span className="font-bold">หน้า 1 / 2 · อ่านข้อตกลงต่อและลงลายมือชื่อหน้าถัดไป ➔</span>
                </div>
              </div>

              {/* PAGE 2 OF 2 (WITH SIGNATURE BLOCK AT BOTTOM) */}
              <div className="print-page shadow-md border border-slate-300 font-contract leading-snug text-[10px] shrink-0">
                <AutoFitPrintContent depKey={`full-p2-${contract.id}-${contract.startDate}`}>
                  {/* Page 2 Mini Header */}
                  <div className="border-b border-black pb-1.5 mb-2.5 flex justify-between items-center text-[9.5px]">
                    <div className="font-bold text-[11px]">
                      สัญญาขายฝากทรัพย์สินไอทีและคอมพิวเตอร์ (ต่อ)
                    </div>
                    <div className="flex items-center gap-2">
                      <span>เลขที่: <strong className="font-mono">{contract.contractNumber}</strong></span>
                      <span className="border border-black px-2 py-0.5 rounded font-bold text-[9px]">หน้า 2 / 2</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-[10px] leading-relaxed">
                    {/* Clause 4: Shop Terms */}
                    <div className="border border-black rounded p-2.5 bg-white space-y-1">
                      <div className="font-bold border-b border-black pb-0.5 text-[10.5px]">
                        ข้อ ๔. เงื่อนไขการรับฝาก การตรวจสอบ และความรับผิดชอบของคู่สัญญา
                      </div>
                      <div className="space-y-1 text-[9.5px] leading-snug">
                        {termsLines.length > 0 ? (
                          termsLines.map((line, idx) => (
                            <div key={idx} className="break-words">{line}</div>
                          ))
                        ) : (
                          <>
                            <div>1. ผู้ขายฝากรับรองว่าทรัพย์สินที่นำมาขายฝากเป็นกรรมสิทธิ์ของผู้ขายฝากโดยชอบด้วยกฎหมาย มิใช่ทรัพย์สินที่ได้มาจากการกระทำผิดกฎหมาย</div>
                            <div>2. อุปกรณ์ไอทีได้รับการตรวจเช็คสภาพและปลดล็อคบัญชี iCloud / Google / BIOS เรียบร้อยแล้ว</div>
                            <div>3. การต่อดอกเบี้ยและการไถ่ถอนต้องนำตั๋วสัญญาฉบับจริงพร้อมบัตรประจำตัวประชาชนมาแสดง</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Clause 5: Payment Channels */}
                    <div className="border border-black rounded p-2.5 bg-white space-y-1 text-[9.5px] leading-snug">
                      <div className="font-bold border-b border-black pb-0.5 text-[10.5px]">
                        ข้อ ๕. ช่องทางชำระดอกเบี้ย / ไถ่ถอน และการติดต่อร้าน
                      </div>
                      <div>
                        <strong>บัญชีธนาคารสำหรับโอนชำระ:</strong> {settings.bankName} เลขที่บัญชี <strong className="font-mono">{settings.bankAccountNumber}</strong> ชื่อบัญชี <strong>{settings.bankAccountName}</strong>
                      </div>
                      <div>
                        <strong>พร้อมเพย์ (PromptPay):</strong> <strong className="font-mono">{settings.promptPayId}</strong> · <strong>Line ID:</strong> {settings.lineId} · <strong>โทร:</strong> {formatPhone(settings.phone)}
                      </div>
                      <div>
                        <strong>สถานที่เก็บรักษาทรัพย์สิน:</strong> {contract.storageLocation || 'ตู้นิรภัยไอที ร้านพัทลุงปริ้นเตอร์'}
                      </div>
                    </div>

                    {/* Legal Closing Affirmation */}
                    <div className="p-2 border border-dashed border-black rounded text-[9.5px] leading-snug">
                      คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญาขายฝากฉบับนี้ (หน้า 1/2 และหน้า 2/2) โดยตลอดแล้ว เห็นว่าถูกต้องตรงตามเจตนาทุกประการ จึงได้ลงลายมือชื่อและประทับตรา (ถ้ามี) ไว้เป็นหลักฐานสำคัญต่อหน้าพยาน
                    </div>
                  </div>
                </AutoFitPrintContent>

                <A5SignatureBlock
                  leftName={customerFullName}
                  leftRole="ผู้ขายฝาก / จำนำ"
                  rightName={staffOrManagerName}
                  rightRole="ผู้รับซื้อฝาก / ผู้จัดการ"
                  showQr
                  qrImageUrl={qrDataUrl}
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
