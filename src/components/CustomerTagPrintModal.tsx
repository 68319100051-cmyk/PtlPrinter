import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Copy, Check, Download, Tag, QrCode as QrIcon, User, Laptop, Smartphone, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import { Customer, ShopSettings, PawnContract } from '../types/pawn';
import { SecondhandBuyIn } from '../types/buyIn';
import { formatCitizenId, formatPhone, formatThaiDate } from '../utils/thaiFormat';

interface CustomerTagPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  settings: ShopSettings;
  relatedContract?: PawnContract | null;
  relatedBuyIn?: SecondhandBuyIn | null;
}

export const CustomerTagPrintModal: React.FC<CustomerTagPrintModalProps> = ({
  isOpen,
  onClose,
  customer,
  settings,
  relatedContract,
  relatedBuyIn,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [tagFormat, setTagFormat] = useState<'label_compact' | 'label_80mm' | 'sheet_a4'>('label_compact');
  const [includeItemSpecs, setIncludeItemSpecs] = useState<boolean>(!!(relatedContract || relatedBuyIn));
  const [copiedCode, setCopiedCode] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Helper to determine the web link so any mobile phone camera (iPhone/Android/LINE)
  // can scan the sticker directly and open the customer page without entering the site first.
  const getAppBaseUrl = () => {
    const SHARED_APP_URL = 'https://ais-pre-jzkqzjupumrauqntqq2mph-721081949057.asia-southeast1.run.app';
    if (typeof window !== 'undefined' && window.location) {
      const origin = window.location.origin;
      if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1') && !origin.includes('about:blank')) {
        return origin;
      }
    }
    return SHARED_APP_URL;
  };

  const baseUrl = getAppBaseUrl();
  const contractParam = relatedContract ? `&contract=${encodeURIComponent(relatedContract.contractNumber)}` : '';
  const qrPayload = `${baseUrl}/?customer=${encodeURIComponent(customer.id)}${contractParam}`;

  useEffect(() => {
    if (!isOpen) return;

    // Generate high resolution QR code data URL
    QRCode.toDataURL(qrPayload, {
      width: 400,
      margin: 1,
      color: {
        dark: '#0f172a', // Deep slate
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate QR code:', err));
  }, [isOpen, qrPayload]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-${customer.firstName}_${customer.lastName}-${customer.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const customerCode = `CUST-${customer.citizenId ? customer.citizenId.slice(-6) : customer.id.slice(-6)}`;
  const todayDateStr = formatThaiDate(new Date().toISOString());

  // Item info if attached
  const itemInfo = relatedContract
    ? {
        name: relatedContract.item.name,
        category: relatedContract.item.category,
        sn: relatedContract.item.notebook?.serialNumber ||
            relatedContract.item.computer?.modelOrCase ||
            relatedContract.item.printer?.serialNumber ||
            relatedContract.item.phone?.imei ||
            relatedContract.item.itGadget?.serialNumber ||
            relatedContract.contractNumber,
        contractNo: relatedContract.contractNumber,
      }
    : relatedBuyIn
    ? {
        name: `${relatedBuyIn.notebookSpecs.brand} ${relatedBuyIn.notebookSpecs.model}`,
        category: 'notebook',
        sn: relatedBuyIn.notebookSpecs.serialNumber,
        contractNo: relatedBuyIn.buyInNumber,
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-print">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs">
              <QrIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">พิมพ์สติกเกอร์ QR ประจำตัวลูกค้า / ติดเครื่อง</h2>
              <p className="text-xs text-slate-400">สแกนด้วยกล้องหรือปืนบาร์โค้ด จะดึงข้อมูลลูกค้าและเครื่องทั้งหมดขึ้นทันที</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile-Friendly Direct Scan Notice Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-amber-950 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>สแกนด้วยกล้องมือถือได้ทันที (ไม่ต้องเปิดเว็บก่อน):</strong> รองรับทั้งกล้อง iPhone, Android และ LINE สแกนแล้วแตะเปิดดูประวัติลูกค้าและเครื่องได้เลย
            </span>
          </div>
          <a
            href={qrPayload}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs whitespace-nowrap shrink-0 transition-colors"
          >
            <span>ทดสอบเปิดดู</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Options Toolbar */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTagFormat('label_compact')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                tagFormat === 'label_compact'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏷️ สติกเกอร์ติดเครื่อง (50x30mm)
            </button>
            <button
              type="button"
              onClick={() => setTagFormat('label_80mm')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                tagFormat === 'label_80mm'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🧾 สลิป/ป้ายแท็ก (80mm)
            </button>
            <button
              type="button"
              onClick={() => setTagFormat('sheet_a4')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                tagFormat === 'sheet_a4'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📄 แผ่น A4 (พิมพ์หลายดวง)
            </button>
          </div>

          {itemInfo && (
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={includeItemSpecs}
                onChange={(e) => setIncludeItemSpecs(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span>ระบุชื่อเครื่อง/S/N บนสติกเกอร์</span>
            </label>
          )}
        </div>

        {/* Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 max-h-[60vh] bg-slate-100 flex items-center justify-center">
          {/* Printable Preview Container */}
          <div
            ref={printContainerRef}
            className="bg-white p-6 shadow-md rounded-xl border border-slate-300 max-w-full flex flex-col items-center"
          >
            {/* Format 1: Compact Machine Sticker (50x30mm Thermal Label) */}
            {tagFormat === 'label_compact' && (
              <div className="w-[340px] border-2 border-dashed border-slate-400 p-3 rounded-lg bg-white text-slate-950 font-sans shadow-xs flex gap-3 items-center">
                <div className="shrink-0 flex flex-col items-center">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Customer QR" className="w-24 h-24 object-contain" />
                  ) : (
                    <div className="w-24 h-24 bg-slate-200 animate-pulse rounded" />
                  )}
                  <span className="text-[9px] font-mono text-slate-500 mt-0.5 font-bold tracking-tight">
                    {customerCode}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-tight truncate">
                    {settings.shopName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {customer.prefix}{customer.firstName} {customer.lastName}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    โทร: <strong>{formatPhone(customer.phone)}</strong>
                  </div>
                  {includeItemSpecs && itemInfo && (
                    <div className="pt-1 mt-1 border-t border-slate-200 text-[10px] text-slate-700 leading-tight">
                      <div className="font-semibold text-slate-900 truncate">{itemInfo.name}</div>
                      <div className="font-mono text-[9px] text-slate-500 truncate">S/N: {itemInfo.sn}</div>
                    </div>
                  )}
                  <div className="text-[8px] text-amber-700 pt-0.5 font-medium">
                    📷 สแกนด้วยกล้องมือถือดูประวัติเครื่อง
                  </div>
                </div>
              </div>
            )}

            {/* Format 2: 80mm Slip / Hanging Tag */}
            {tagFormat === 'label_80mm' && (
              <div className="w-[300px] border-2 border-dashed border-slate-400 p-4 rounded-xl bg-white text-slate-950 font-sans text-center space-y-2">
                <div className="border-b border-slate-200 pb-2">
                  <div className="text-xs font-bold text-amber-600">
                    {settings.shopName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    ป้ายระบุตัวตนเจ้าของเครื่อง (Customer Asset Tag)
                  </div>
                </div>

                <div className="flex justify-center py-1">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Customer QR" className="w-36 h-36 object-contain" />
                  ) : (
                    <div className="w-36 h-36 bg-slate-200 animate-pulse rounded" />
                  )}
                </div>

                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-left text-xs space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[10px]">รหัสลูกค้า:</span>
                    <span className="font-mono font-bold text-indigo-700">{customerCode}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {customer.prefix}{customer.firstName} {customer.lastName}
                  </div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    เบอร์โทร: <strong>{formatPhone(customer.phone)}</strong>
                  </div>
                  <div className="text-slate-500 text-[10px] font-mono">
                    เลข ปชช: {formatCitizenId(customer.citizenId)}
                  </div>
                  {includeItemSpecs && itemInfo && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-[11px]">
                      <div className="text-slate-500 text-[9px]">อุปกรณ์ที่ฝาก / รับซื้อ:</div>
                      <div className="font-bold text-slate-900">{itemInfo.name}</div>
                      <div className="font-mono text-[10px] text-slate-600">S/N: {itemInfo.sn}</div>
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-amber-800 pt-1 font-medium">
                  📷 ใช้กล้อง iPhone/Android หรือ LINE สแกนดูข้อมูลเครื่องได้ทันที
                </div>
              </div>
            )}

            {/* Format 3: Sheet of 8 stickers on A4 paper */}
            {tagFormat === 'sheet_a4' && (
              <div className="w-full max-w-[500px] border-2 border-dashed border-slate-400 p-4 rounded-xl bg-white">
                <div className="text-center text-xs font-semibold text-slate-600 mb-3 pb-2 border-b border-slate-200">
                  ตัวอย่างชุดสติกเกอร์หลายดวง (สำหรับพิมพ์บนกระดาษสติกเกอร์ A4)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="border border-slate-300 p-2 rounded-lg flex items-center gap-2 bg-slate-50"
                    >
                      {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-14 h-14 object-contain shrink-0" />}
                      <div className="min-w-0 text-[10px] space-y-0.5">
                        <div className="font-bold text-slate-900 truncate">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="font-mono text-slate-600 text-[9px]">{formatPhone(customer.phone)}</div>
                        <div className="font-mono text-indigo-600 text-[8px] font-bold">{customerCode}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copiedCode ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์ QR'}</span>
            </button>
            <a
              href={qrPayload}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>ทดสอบเปิดดูข้อมูล</span>
            </a>
            <button
              type="button"
              onClick={handleDownloadQr}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>ดาวน์โหลดรูป QR</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>สั่งพิมพ์สติกเกอร์ทันที</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY CSS AND LAYOUT */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          #customer-sticker-print-zone, #customer-sticker-print-zone * {
            visibility: visible;
          }
          #customer-sticker-print-zone {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 8px;
            background: white;
          }
        }
      `}</style>

      {/* Hidden container dedicated for native browser window.print() */}
      <div id="customer-sticker-print-zone" className="hidden">
        {tagFormat === 'label_compact' && (
          <div style={{ width: '50mm', height: '30mm', padding: '2mm', display: 'flex', alignItems: 'center', gap: '3mm', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
            {qrDataUrl && <img src={qrDataUrl} style={{ width: '22mm', height: '22mm', objectFit: 'contain' }} alt="QR" />}
            <div style={{ flex: 1, fontSize: '8pt', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 'bold', fontSize: '7pt', color: '#b45309' }}>{settings.shopName || 'พัทลุงปริ้นเตอร์'}</div>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', color: '#000' }}>{customer.prefix}{customer.firstName} {customer.lastName}</div>
              <div style={{ fontSize: '7.5pt' }}>โทร: {customer.phone}</div>
              {includeItemSpecs && itemInfo && (
                <div style={{ fontSize: '7pt', borderTop: '1px solid #ccc', paddingTop: '1mm', marginTop: '1mm' }}>
                  <div style={{ fontWeight: 'bold' }}>{itemInfo.name}</div>
                  <div>S/N: {itemInfo.sn}</div>
                </div>
              )}
              <div style={{ fontSize: '6pt', color: '#b45309', fontWeight: 'bold', marginTop: '1mm' }}>สแกนด้วยกล้องมือถือดูข้อมูลเครื่อง · {customerCode}</div>
            </div>
          </div>
        )}

        {tagFormat === 'label_80mm' && (
          <div style={{ width: '75mm', padding: '4mm', fontFamily: 'sans-serif', textAlign: 'center', boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10pt', color: '#000' }}>{settings.shopName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}</div>
            <div style={{ fontSize: '7.5pt', color: '#b45309', fontWeight: 'bold' }}>สแกนด้วยกล้องมือถือ (iPhone/Android/LINE) ดูข้อมูลทันที</div>
            <div style={{ margin: '3mm auto', display: 'flex', justifyContent: 'center' }}>
              {qrDataUrl && <img src={qrDataUrl} style={{ width: '35mm', height: '35mm', objectFit: 'contain' }} alt="QR" />}
            </div>
            <div style={{ textAlign: 'left', fontSize: '8.5pt', border: '1px solid #ddd', padding: '2mm', borderRadius: '2mm' }}>
              <div>รหัสลูกค้า: <strong>{customerCode}</strong></div>
              <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>{customer.prefix}{customer.firstName} {customer.lastName}</div>
              <div>เบอร์โทร: <strong>{formatPhone(customer.phone)}</strong></div>
              <div>เลขบัตร ปชช: {formatCitizenId(customer.citizenId)}</div>
              {includeItemSpecs && itemInfo && (
                <div style={{ borderTop: '1px solid #eee', marginTop: '1.5mm', paddingTop: '1.5mm' }}>
                  <div>เครื่อง: <strong>{itemInfo.name}</strong></div>
                  <div>S/N: {itemInfo.sn}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {tagFormat === 'sheet_a4' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5mm', padding: '5mm', fontFamily: 'sans-serif' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
              <div key={idx} style={{ border: '1px dashed #999', padding: '3mm', display: 'flex', alignItems: 'center', gap: '3mm', borderRadius: '2mm' }}>
                {qrDataUrl && <img src={qrDataUrl} style={{ width: '18mm', height: '18mm' }} alt="QR" />}
                <div style={{ fontSize: '8pt' }}>
                  <div style={{ fontWeight: 'bold' }}>{customer.prefix}{customer.firstName} {customer.lastName}</div>
                  <div>โทร: {customer.phone}</div>
                  <div style={{ fontSize: '7pt', color: '#666' }}>{customerCode} · {settings.shopName}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
