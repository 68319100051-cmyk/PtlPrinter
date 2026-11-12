import React, { useState } from 'react';
import { X, Printer, FileText, Receipt, Scroll, CheckCircle2 } from 'lucide-react';
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

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  isOpen,
  onClose,
  contract,
  settings,
  defaultMode = 'a5_ticket',
  activeReceipt,
}) => {
  // Map incoming mode to supported A5 and standard formats
  const initialFormat: PrintFormat = (() => {
    if (defaultMode === 'slip') return 'slip';
    if (defaultMode === 'full_contract') return 'full_contract';
    if (defaultMode === 'interest_receipt' || defaultMode === 'a5_interest_receipt') return 'a5_interest_receipt';
    if (defaultMode === 'redeem_receipt' || defaultMode === 'a5_redeem_receipt') return 'a5_redeem_receipt';
    return 'a5_ticket';
  })();

  const [format, setFormat] = useState<PrintFormat>(initialFormat);

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

  // Dynamic QR code verification URL / payload
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const qrVerificationUrl = `${currentOrigin}/?c=${encodeURIComponent(contract.contractNumber)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrVerificationUrl)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto print:p-0 print:bg-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="w-full h-full sm:h-auto sm:max-h-[96vh] max-w-4xl bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden flex flex-col my-auto print:m-0 print:p-0 print:border-none print:shadow-none print:max-h-none print:h-auto print:overflow-visible">
        
        {/* Dynamic print page styling depending on active format */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: ${format === 'full_contract' ? 'A4 portrait' : format === 'slip' ? '80mm auto' : 'A5 portrait'};
                margin: ${format === 'full_contract' ? '8mm 10mm' : format === 'slip' ? '2mm 3mm' : '8mm'};
              }
              html, body {
                background: white !important;
                color: #000 !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                overflow: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              ::-webkit-scrollbar {
                display: none !important;
              }
              * {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
              }
              .a5-portrait-sheet {
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                overflow: visible !important;
              }
              /* Ink-saver: clear heavy dark fills and background shadows */
              .a5-portrait-sheet,
              .a5-portrait-sheet *:not(img):not(svg) {
                background-color: transparent !important;
                background-image: none !important;
                color: #000000 !important;
                box-shadow: none !important;
                text-shadow: none !important;
              }
              .a5-portrait-sheet img {
                background: transparent !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
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
              <h3 className="font-bold text-slate-900 text-base">ศูนย์พิมพ์เอกสาร ตั๋วสัญญา & ใบเสร็จรับเงิน</h3>
              <p className="text-xs text-slate-500">
                สัญญาเลขที่: <span className="font-mono font-bold text-slate-800">{contract.contractNumber}</span> · ผู้ขายฝาก: {contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>สั่งพิมพ์ (Print A5/A4/Slip)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Format Selector Bar (Hidden during print) */}
        <div className="no-print flex items-center gap-1.5 px-3 sm:px-6 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="text-slate-500 font-medium whitespace-nowrap mr-2">รูปแบบเอกสาร:</span>
          
          <button
            onClick={() => setFormat('a5_ticket')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              format === 'a5_ticket'
                ? 'bg-amber-400 text-slate-950 shadow-xs border border-amber-500'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            ตั๋วสัญญาขายฝากไอที (ขนาด A5 แนวตั้ง) ⭐
          </button>

          {contract.interestPayments.length > 0 && (
            <button
              onClick={() => setFormat('a5_interest_receipt')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                format === 'a5_interest_receipt'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              ใบเสร็จต่อดอกเบี้ย (ขนาด A5 แนวตั้ง)
            </button>
          )}

          {contract.redemption && (
            <button
              onClick={() => setFormat('a5_redeem_receipt')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                format === 'a5_redeem_receipt'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              ใบเสร็จไถ่ถอน (ขนาด A5 แนวตั้ง)
            </button>
          )}

          <button
            onClick={() => setFormat('slip')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              format === 'slip'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            ตั๋วสลิปความร้อน (80mm)
          </button>

          <button
            onClick={() => setFormat('full_contract')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              format === 'full_contract'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Scroll className="w-3.5 h-3.5" />
            สัญญาขายฝากเต็มฉบับ (A4 แนวตั้ง)
          </button>
        </div>

        {/* Printable Viewport */}
        <div
          className="flex-1 p-2 sm:p-5 overflow-y-auto bg-slate-200 flex justify-center items-start print:p-0 print:m-0 print:bg-white print:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          
          {/* ========================================================================= */}
          {/* FORMAT 1: A5 PORTRAIT TICKET (ตั๋วสัญญาขายฝากไอที ขนาด A5 แนวตั้ง 148 x 210mm) */}
          {/* Ink-saver design, 100% width, no overflow, full visible right-side texts    */}
          {/* ========================================================================= */}
          {format === 'a5_ticket' && (
            <div className="a5-portrait-sheet w-full max-w-2xl bg-white p-4 sm:p-5 rounded-lg shadow-md border border-slate-300 font-contract text-black box-border print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-full leading-tight text-[10.5px] [page-break-inside:avoid] [break-inside:avoid]">
              
              {/* Header with Logo & Shop Info */}
              <div className="border-b border-black pb-2 mb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={effectiveLogo}
                      alt="Logo"
                      onError={(e) => {
                        if (e.currentTarget.src !== window.location.origin + '/shop_logo.jpg') {
                          e.currentTarget.src = '/shop_logo.jpg';
                        }
                      }}
                      className="w-12 h-12 rounded object-contain bg-white p-0.5 border border-slate-300 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h1 className="text-sm sm:text-base font-bold tracking-tight text-black break-words leading-tight">
                        {settings.shopName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}
                      </h1>
                      <p className="text-[10px] text-black font-medium leading-tight">
                        {settings.branchName} · โทร. {settings.phone}
                      </p>
                      <p className="text-[9.5px] text-black leading-tight break-words">
                        {settings.address}
                      </p>
                      <p className="text-[9.5px] text-black leading-tight">
                        Line: {settings.lineId} · Facebook: {settings.facebook || 'พัทลุงปริ้นเตอร์'}
                      </p>
                    </div>
                  </div>

                  {/* Right Header: Full width on mobile/flex, clear non-clipped contract info */}
                  <div className="text-left sm:text-right shrink-0 min-w-0 max-w-full flex flex-col items-start sm:items-end self-stretch sm:self-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <span className="inline-block border border-black bg-white text-black font-bold px-2 py-0.5 rounded text-[10px] tracking-wide mb-1 whitespace-nowrap">
                      ตั๋วสัญญาขายฝาก / จำนำไอที (A5)
                    </span>
                    <div className="flex flex-wrap items-baseline justify-start sm:justify-end gap-1 text-[11px] text-black">
                      <span className="text-slate-600 font-normal">เลขที่สัญญา:</span>
                      <strong className="font-mono font-bold text-sm text-black break-all">{contract.contractNumber}</strong>
                    </div>
                    <div className="text-[10px] text-black mt-0.5 break-words">
                      <span className="text-slate-600">วันที่ทำรายการ: </span>
                      <strong>{formatThaiDate(contract.startDate)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer & Pledged Terms Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <div className="bg-white p-2 rounded border border-black text-black">
                  <div className="font-bold text-black border-b border-black pb-0.5 mb-1 text-[10.5px] flex justify-between items-center">
                    <span>ข้อมูลผู้ขายฝาก / จำนำ</span>
                    <span className="text-[9.5px] text-black font-mono">ID: {contract.customerId}</span>
                  </div>
                  <div className="space-y-0.5 text-[10px]">
                    <div className="break-words">
                      <span className="text-slate-600">ชื่อ-สกุล: </span>
                      <strong className="text-black font-bold whitespace-normal">{contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600">เลขบัตรประชาชน: </span>
                      <strong className="font-mono text-black">{formatCitizenId(contract.customerSnapshot.citizenId)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600">เบอร์โทรศัพท์: </span>
                      <strong className="font-mono text-black">{formatPhone(contract.customerSnapshot.phone)}</strong>
                    </div>
                    <div className="text-[9.5px] text-black break-words whitespace-normal leading-tight">
                      <span className="text-slate-600">ที่อยู่: </span>{contract.customerSnapshot.address}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-2 rounded border border-black text-black">
                  <div className="font-bold text-black border-b border-black pb-0.5 mb-1 text-[10.5px] flex justify-between items-center">
                    <span>เงื่อนไขระยะเวลา & วันครบกำหนด</span>
                    <span className="font-mono text-black font-bold">{formatDurationText(contract.durationMonths, contract.durationDays)}</span>
                  </div>
                  <div className="space-y-0.5 text-[10px]">
                    <div>
                      <span className="text-slate-600">ระยะเวลาสัญญา: </span>
                      <strong className="text-black">{formatDurationText(contract.durationMonths, contract.durationDays)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600">วันครบกำหนดไถ่ถอน: </span>
                      <strong className="text-black font-bold underline">{formatThaiDate(contract.dueDate, true)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600">อัตราดอกเบี้ย: </span>
                      <strong className="text-black">{contract.monthlyInterestRate}% ต่อเดือน</strong>
                    </div>
                    <div className="text-[9.5px] text-black break-words leading-tight">
                      <span className="text-slate-600">ที่เก็บรักษา: </span>
                      <span className="text-black">{contract.storageLocation || 'ตู้นิรภัยไอที ร้านพัทลุงปริ้นเตอร์'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Details Box */}
              <div className="border border-black rounded p-2 mb-2 bg-white text-black">
                <div className="font-bold text-black border-b border-black pb-0.5 mb-1 flex justify-between items-center text-[10.5px]">
                  <span>รายการทรัพย์สินไอทีที่นำมาฝาก / จำนำ</span>
                  <span className="text-[9.5px] px-1 py-0.2 border border-black rounded text-black font-medium">
                    หมวด: {contract.item.category === 'notebook' ? 'โน็ตบุ้ค' : contract.item.category === 'printer' ? 'เครื่องพิมพ์' : contract.item.category === 'computer' ? 'คอมพิวเตอร์พีซี' : 'อุปกรณ์ไอที'}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-black break-words">{contract.item.name}</div>
                  <div className="text-[10px] text-black leading-snug break-words">{contract.item.description}</div>
                  
                  {/* Detailed Specs chip rows */}
                  {contract.item.notebook && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-white p-1 rounded border border-slate-400 text-[10px] mt-1 font-mono text-black">
                      <div><strong>S/N:</strong> {contract.item.notebook.serialNumber}</div>
                      <div><strong>CPU:</strong> {contract.item.notebook.processor}</div>
                      <div><strong>RAM:</strong> {contract.item.notebook.ramGb}GB / <strong>Storage:</strong> {contract.item.notebook.storage}</div>
                      <div><strong>อุปกรณ์:</strong> {contract.item.notebook.hasCharger ? 'สายชาร์จแท้' : 'ไม่มีชาร์จ'}{contract.item.notebook.hasBag ? ', กระเป๋า' : ''}</div>
                    </div>
                  )}

                  {contract.item.printer && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-white p-1 rounded border border-slate-400 text-[10px] mt-1 text-black">
                      <div><strong>S/N:</strong> <span className="font-mono">{contract.item.printer.serialNumber}</span></div>
                      <div><strong>ยี่ห้อ/รุ่น:</strong> {contract.item.printer.brand} {contract.item.printer.model}</div>
                      <div><strong>ระบบหมึก:</strong> {contract.item.printer.inkSystem === 'genuine_tank' ? 'แท็งก์แท้ศูนย์' : 'ตลับหมึก'}</div>
                      <div><strong>สภาพหัวพิมพ์:</strong> {contract.item.printer.headCondition === 'normal' ? 'สมบูรณ์ 100%' : 'มีเส้น/ต้องล้าง'}</div>
                    </div>
                  )}

                  {contract.item.computer && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-white p-1 rounded border border-slate-400 text-[10px] mt-1 text-black">
                      <div><strong>เคส/แบรนด์:</strong> {contract.item.computer.brandOrCustom}</div>
                      <div><strong>ซีพียู/แรม:</strong> {contract.item.computer.processor} (RAM {contract.item.computer.ramGb}GB)</div>
                      <div><strong>การ์ดจอ:</strong> {contract.item.computer.gpu || '-'}</div>
                      <div><strong>ความจุ:</strong> {contract.item.computer.storage}</div>
                    </div>
                  )}

                  {contract.item.phone && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-white p-1 rounded border border-slate-400 text-[10px] mt-1 font-mono text-black">
                      <div><strong>IMEI / S/N:</strong> {contract.item.phone.imei}</div>
                      <div><strong>ความจุ:</strong> {contract.item.phone.storageGb} · <strong>iCloud:</strong> {contract.item.phone.icloudStatus === 'unlocked' ? 'ปลดล็อคแล้ว' : 'ติดรหัส'}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Box - INK SAVER: White background, 1px black border, solid black text */}
              <div className="bg-white border border-black text-black p-2 rounded mb-2 flex justify-between items-center text-[10.5px]">
                <div>
                  <div className="text-black text-[9.5px]">จำนวนเงินต้นรับจำนำ / ขายฝาก:</div>
                  <div className="text-base font-bold font-mono tracking-tight text-black">
                    {formatCurrency(contract.loanAmount)}
                  </div>
                  <div className="text-[9.5px] text-black font-medium">({bahtToText(contract.loanAmount)})</div>
                </div>
                <div className="text-right">
                  <div className="text-black text-[9.5px]">ดอกเบี้ยต่องวด ({formatDurationText(contract.durationMonths, contract.durationDays)}):</div>
                  <div className="text-sm font-bold font-mono text-black">
                    ฿{periodInterest.toLocaleString()} บาท
                  </div>
                  <div className="text-[9.5px] text-black font-normal">
                    (เฉลี่ยเดือนละ {formatCurrency(monthlyInterest)})
                  </div>
                </div>
              </div>

              {/* Shop Payment Transfer Info & Terms */}
              <div className="bg-white border border-black rounded p-1.5 mb-1.5 text-[9.5px] text-black leading-snug">
                <div className="font-bold text-black mb-0.5">
                  🏦 ช่องทางชำระดอกเบี้ย / โอนเงินต่อสัญญา:
                </div>
                <div className="break-words">
                  {settings.bankName || 'ธนาคารกสิกรไทย'} เลขที่ <strong className="font-mono text-black">{settings.bankAccountNumber || '083-4-26805-8'}</strong> ({settings.bankAccountName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}) · พร้อมเพย์: <strong className="font-mono text-black">{settings.promptPayId || '0834268058'}</strong>
                </div>
                <div className="text-[9px] text-black mt-0.5">
                  * เมื่อโอนชำระเงินแล้วกรุณาส่งสลิปทาง Line: <strong>{settings.lineId || 'poi1800'}</strong> พร้อมแจ้งสัญญา <strong>{contract.contractNumber}</strong>
                </div>
              </div>

              {/* Terms Warning */}
              <div className="text-[9px] text-black bg-white p-1.5 rounded border border-black mb-2 space-y-0.5 leading-tight">
                <div>1. โปรดนำตั๋วสัญญาฉบับนี้พร้อมบัตรประชาชนมาแสดงทุกครั้งที่ติดต่อชำระดอกเบี้ยหรือไถ่ถอนทรัพย์สิน</div>
                <div>2. หากครบกำหนดสัญญาและพ้นระยะเวลาผ่อนผัน <strong>{settings.gracePeriodDays || 15} วัน</strong> ทรัพย์สินจะตกเป็นกรรมสิทธิ์ของผู้รับซื้อฝากโดยเด็ดขาดตามกฎหมาย</div>
              </div>

              {/* Signatures & QR Code - Perfectly fitted on 1 page */}
              <div className="pt-1.5 border-t border-black flex items-end justify-between gap-1 text-[10px] text-black [page-break-inside:avoid] [break-inside:avoid]">
                <div className="text-center w-32 sm:w-36 shrink-0">
                  <div className="h-9 border-b border-dotted border-black"></div>
                  <div className="mt-1 font-semibold text-black break-words whitespace-normal leading-tight">
                    ({contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName})
                  </div>
                  <div className="text-[9px] text-black">ผู้ขายฝาก / จำนำ</div>
                </div>

                <div className="w-12 h-12 border border-dashed border-black rounded flex flex-col items-center justify-center text-[8.5px] text-black shrink-0">
                  <span>ประทับตรา</span>
                  <span>ร้าน</span>
                </div>

                <div className="text-center w-32 sm:w-36 shrink-0">
                  <div className="h-9 border-b border-dotted border-black"></div>
                  <div className="mt-1 font-semibold text-black break-words whitespace-normal leading-tight">
                    ({contract.createdBy || settings.ownerName || 'ผู้รับซื้อฝาก'})
                  </div>
                  <div className="text-[9px] text-black">ผู้รับซื้อฝาก / จนท.</div>
                </div>

                {/* QR Code for quick mobile scanning */}
                <div className="flex flex-col items-center shrink-0">
                  <img
                    src={qrImageUrl}
                    alt="Scan QR"
                    className="w-12 h-12 border border-black rounded p-0.5 bg-white"
                  />
                  <span className="text-[8px] text-black mt-0.5 font-mono">สแกนตรวจสอบ</span>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMAT 2: A5 PORTRAIT INTEREST RECEIPT (ใบเสร็จต่อดอกเบี้ย ขนาด A5 แนวตั้ง) */}
          {/* ========================================================================= */}
          {format === 'a5_interest_receipt' && (
            <div className="a5-portrait-sheet w-full max-w-2xl bg-white p-4 sm:p-5 rounded-lg shadow-md border border-slate-300 font-contract text-black box-border print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-full leading-tight text-[10.5px] [page-break-inside:avoid] [break-inside:avoid]">
              {(() => {
                const receipt = activeReceipt || contract.interestPayments[contract.interestPayments.length - 1];
                if (!receipt) return <div className="text-center py-8 text-black">ยังไม่มีประวัติการต่อดอกเบี้ยในสัญญานี้</div>;
                return (
                  <div>
                    {/* Header with Logo */}
                    <div className="border-b border-black pb-2 mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <img
                          src={effectiveLogo}
                          alt="Logo"
                          onError={(e) => {
                            if (e.currentTarget.src !== window.location.origin + '/shop_logo.jpg') {
                              e.currentTarget.src = '/shop_logo.jpg';
                            }
                          }}
                          className="w-12 h-12 rounded object-contain bg-white p-0.5 border border-slate-300 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base font-bold text-black break-words leading-tight">{settings.shopName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}</h2>
                          <p className="text-[10px] text-black font-medium leading-tight">{settings.branchName} · โทร. {settings.phone}</p>
                          <p className="text-[9.5px] text-black leading-tight break-words">{settings.address}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block border border-black bg-white text-black font-bold px-2 py-0.5 rounded text-[10px]">
                          ใบเสร็จรับเงินชำระดอกเบี้ย (A5)
                        </span>
                        <div className="text-[10px] text-black mt-1">เลขที่ใบเสร็จ: <strong className="font-mono text-black">{receipt.receiptNumber}</strong></div>
                        <div className="text-[9.5px] text-black">สัญญาอ้างอิง: <strong className="font-mono text-black">{contract.contractNumber}</strong></div>
                      </div>
                    </div>

                    {/* Customer & Payment Meta */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] mb-2 bg-white p-2 rounded border border-black text-black">
                      <div>
                        <div className="break-words"><span className="text-slate-600">ชื่อลูกค้า: </span><strong className="text-black">{contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</strong></div>
                        <div><span className="text-slate-600">เลขบัตร: </span><span className="font-mono text-black">{formatCitizenId(contract.customerSnapshot.citizenId)}</span></div>
                        <div><span className="text-slate-600">เบอร์โทร: </span><span className="font-mono text-black">{formatPhone(contract.customerSnapshot.phone)}</span></div>
                      </div>
                      <div className="text-right">
                        <div><span className="text-slate-600">วันที่ชำระ: </span><strong className="text-black">{formatThaiDateTime(receipt.date)}</strong></div>
                        <div><span className="text-slate-600">ผู้รับเงิน: </span><strong className="text-black">{receipt.recordedBy}</strong></div>
                        <div><span className="text-slate-600">ช่องทาง: </span><span className="font-semibold text-black">{receipt.paymentMethod === 'cash' ? '💵 เงินสด' : '📱 โอนเงินเข้าบัญชี'}</span></div>
                      </div>
                    </div>

                    {/* Interest & Extension Details */}
                    <div className="border border-black rounded p-2 text-[10.5px] mb-2 space-y-1.5 bg-white text-black">
                      <div className="font-bold text-black flex justify-between border-b border-black pb-1">
                        <span className="break-words">ทรัพย์สินค้ำประกัน: {contract.item.name}</span>
                        <span className="text-black font-mono text-[10.5px] shrink-0">เงินต้น: {formatCurrency(contract.loanAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between text-black text-[10px]">
                        <span>จำนวนระยะเวลาที่ต่อสัญญา:</span>
                        <strong className="text-black">{receipt.monthsPaid} เดือน (อัตรา {receipt.ratePercent}% ต่อเดือน)</strong>
                      </div>
                      
                      <div className="bg-white p-1.5 rounded border border-slate-300 flex items-center justify-between text-[10px] text-black">
                        <div>
                          <div className="text-slate-600">วันครบกำหนดเดิม:</div>
                          <strong className="text-black">{formatThaiDate(receipt.previousDueDate)}</strong>
                        </div>
                        <div className="text-black font-bold text-sm">➔</div>
                        <div className="text-right">
                          <div className="text-black font-bold">วันครบกำหนดใหม่:</div>
                          <strong className="text-black font-bold text-xs underline">{formatThaiDate(receipt.newDueDate, true)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Total Amount Banner - INK SAVER */}
                    <div className="bg-white border border-black text-black p-2.5 rounded mb-3 flex justify-between items-center text-[10.5px]">
                      <div>
                        <div className="text-black text-[9.5px]">ยอดเงินดอกเบี้ยที่รับชำระสุทธิ:</div>
                        <div className="text-base font-bold font-mono text-black">{formatCurrency(receipt.totalPaid)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-black text-[9.5px]">ตัวอักษร:</div>
                        <div className="text-black font-medium">{bahtToText(receipt.totalPaid)}</div>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-8 text-center text-[10px] pt-3 border-t border-black text-black [page-break-inside:avoid] [break-inside:avoid]">
                      <div>
                        <div className="h-9 border-b border-dotted border-black mx-6"></div>
                        <div className="mt-1">ผู้ชำระเงิน</div>
                        <div className="text-[9px] text-black break-words">({contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName})</div>
                      </div>
                      <div>
                        <div className="h-9 border-b border-dotted border-black mx-6"></div>
                        <div className="mt-1 font-semibold">{receipt.recordedBy}</div>
                        <div className="text-[9px] text-black">ผู้รับเงิน / แคชเชียร์</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMAT 3: A5 PORTRAIT REDEEM RECEIPT (ใบเสร็จรับเงินไถ่ถอน ขนาด A5 แนวตั้ง) */}
          {/* ========================================================================= */}
          {format === 'a5_redeem_receipt' && contract.redemption && (
            <div className="a5-portrait-sheet w-full max-w-2xl bg-white p-4 sm:p-5 rounded-lg shadow-md border border-slate-300 font-contract text-black box-border print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-full leading-tight text-[10.5px] [page-break-inside:avoid] [break-inside:avoid]">
              {/* Header with Logo */}
              <div className="border-b border-black pb-2 mb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <img
                    src={effectiveLogo}
                    alt="Logo"
                    onError={(e) => {
                      if (e.currentTarget.src !== window.location.origin + '/shop_logo.jpg') {
                        e.currentTarget.src = '/shop_logo.jpg';
                      }
                    }}
                    className="w-12 h-12 rounded object-contain bg-white p-0.5 border border-slate-300 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-black break-words leading-tight">{settings.shopName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}</h2>
                    <p className="text-[10px] text-black font-medium leading-tight">{settings.branchName} · โทร. {settings.phone}</p>
                    <p className="text-[9.5px] text-black leading-tight break-words">{settings.address}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block border border-black bg-white text-black font-bold px-2 py-0.5 rounded text-[10px]">
                    ใบเสร็จรับเงินไถ่ถอน / ส่งมอบคืน (A5)
                  </span>
                  <div className="text-[10px] text-black mt-1">เลขที่ใบเสร็จ: <strong className="font-mono text-black">{contract.redemption.receiptNumber}</strong></div>
                  <div className="text-[9.5px] text-black">สัญญาอ้างอิง: <strong className="font-mono text-black">{contract.contractNumber}</strong></div>
                </div>
              </div>

              {/* Customer & Redemption Meta */}
              <div className="grid grid-cols-2 gap-2 text-[10px] mb-2 bg-white p-2 rounded border border-black text-black">
                <div>
                  <div className="break-words"><span className="text-slate-600">ชื่อลูกค้า: </span><strong className="text-black">{contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</strong></div>
                  <div><span className="text-slate-600">เลขบัตร: </span><span className="font-mono text-black">{formatCitizenId(contract.customerSnapshot.citizenId)}</span></div>
                </div>
                <div className="text-right">
                  <div><span className="text-slate-600">วันที่ไถ่ถอน: </span><strong className="text-black">{formatThaiDateTime(contract.redemption.redeemDate)}</strong></div>
                  <div><span className="text-slate-600">ผู้ดำเนินการ: </span><strong className="text-black">{contract.redemption.recordedBy}</strong></div>
                </div>
              </div>

              {/* Returned Item & Financial Breakdown */}
              <div className="border border-black rounded p-2 text-[10.5px] mb-2 space-y-1 bg-white text-black">
                <div className="font-bold text-black border-b border-black pb-0.5">
                  รายการทรัพย์สินที่ส่งมอบคืน: {contract.item.name}
                </div>
                <div className="text-[10px] text-black break-words">{contract.item.description}</div>
                
                <div className="border-t border-slate-300 pt-1 space-y-0.5 text-[10px] text-black">
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

              {/* Total Banner - INK SAVER */}
              <div className="bg-white border border-black text-black p-2.5 rounded mb-2 flex justify-between items-center text-[10.5px]">
                <div>
                  <div className="text-black text-[9.5px]">ยอดรวมทั้งสิ้นที่ชำระไถ่ถอน:</div>
                  <div className="text-base font-bold font-mono text-black">{formatCurrency(contract.redemption.totalPaid)}</div>
                </div>
                <div className="text-right">
                  <div className="text-black text-[9.5px]">ตัวอักษร:</div>
                  <div className="text-black font-medium">{bahtToText(contract.redemption.totalPaid)}</div>
                </div>
              </div>

              <p className="text-[9.5px] text-black mb-2 bg-white p-1.5 rounded border border-black leading-snug">
                ผู้ขายฝากได้รับมอบทรัพย์สินตามรายการข้างต้นคืนในสภาพเรียบร้อย ถูกต้องตามความประสงค์แล้ว และไม่ติดใจเรียกร้องสิทธิใดๆ ต่อไป
              </p>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-center text-[10px] pt-3 border-t border-black text-black [page-break-inside:avoid] [break-inside:avoid]">
                <div>
                  <div className="h-9 border-b border-dotted border-black mx-6"></div>
                  <div className="mt-1 font-semibold break-words">({contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName})</div>
                  <div className="text-[9px] text-black">ผู้รับมอบทรัพย์สินคืน</div>
                </div>
                <div>
                  <div className="h-9 border-b border-dotted border-black mx-6"></div>
                  <div className="mt-1 font-semibold">{contract.redemption.recordedBy}</div>
                  <div className="text-[9px] text-black">ผู้ส่งมอบทรัพย์สิน / เจ้าหน้าที่</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMAT 4: THERMAL SLIP 80MM */}
          {/* ========================================================================= */}
          {format === 'slip' && (
            <div className="w-[320px] bg-white p-4 shadow-md border border-slate-300 font-mono text-[11px] leading-tight text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full">
              <div className="text-center pb-2 border-b border-dashed border-slate-400 mb-2">
                <img
                  src={effectiveLogo}
                  alt="Logo"
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + '/shop_logo.jpg') {
                      e.currentTarget.src = '/shop_logo.jpg';
                    }
                  }}
                  className="w-12 h-12 mx-auto mb-1 rounded-md object-contain bg-white p-0.5 border border-slate-200"
                />
                <div className="font-bold text-sm tracking-tight">{settings.shopName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}</div>
                <div className="text-[10px] text-slate-600">{settings.branchName}</div>
                <div className="text-[10px]">โทร: {settings.phone}</div>
                {settings.promptPayId && <div className="text-[9px] text-slate-500">พร้อมเพย์: {settings.promptPayId}</div>}
                <div className="font-bold text-xs mt-1.5 bg-slate-100 py-0.5 border border-slate-300">ตั๋วขายฝาก / จำนำไอที</div>
              </div>

              <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>เลขที่สัญญา:</span>
                  <span className="font-bold">{contract.contractNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>วันที่ทำรายการ:</span>
                  <span>{formatThaiDate(contract.startDate)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>วันครบกำหนด:</span>
                  <span>{formatThaiDate(contract.dueDate, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ระยะเวลา:</span>
                  <span>{formatDurationText(contract.durationMonths, contract.durationDays)}</span>
                </div>
              </div>

              <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
                <div className="break-words"><span className="text-slate-500">ผู้ขายฝาก:</span> {contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</div>
                <div><span className="text-slate-500">โทร:</span> {contract.customerSnapshot.phone}</div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-300 space-y-1">
                <div className="font-bold break-words">{contract.item.name}</div>
                <div className="text-[10px] text-slate-600 break-words">{contract.item.description}</div>
                {contract.item.notebook && (
                  <div className="text-[9.5px] text-slate-500">S/N: {contract.item.notebook.serialNumber}</div>
                )}
                {contract.item.printer && (
                  <div className="text-[9.5px] text-slate-500">S/N: {contract.item.printer.serialNumber}</div>
                )}
              </div>

              <div className="py-2 space-y-1 border-b border-dashed border-slate-300 font-bold">
                <div className="flex justify-between text-xs">
                  <span>เงินต้น:</span>
                  <span>{formatCurrency(contract.loanAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 font-normal">
                  <span>ดอกเบี้ย ({contract.monthlyInterestRate}%/เดือน):</span>
                  <span>฿{periodInterest.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <img
                  src={qrImageUrl}
                  alt="QR Code"
                  className="w-20 h-20 mx-auto border border-slate-200 p-1 mb-1"
                />
                <div className="text-[9px] text-slate-500">สแกนเพื่อตรวจสอบสัญญา</div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMAT 5: FULL A4 LEGAL CONTRACT */}
          {/* ========================================================================= */}
          {format === 'full_contract' && (
            <div className="w-full max-w-[800px] bg-white p-8 sm:p-12 rounded-lg shadow-md border border-slate-300 font-contract text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full leading-relaxed text-xs">
              <div className="text-center mb-6 border-b pb-4">
                <img
                  src={effectiveLogo}
                  alt="Logo"
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + '/shop_logo.jpg') {
                      e.currentTarget.src = '/shop_logo.jpg';
                    }
                  }}
                  className="w-14 h-14 mx-auto mb-2 rounded-lg object-contain bg-white p-0.5 border border-slate-300 shadow-xs"
                />
                <h1 className="text-xl font-bold tracking-tight text-slate-900">สัญญาขายฝากทรัพย์สินไอทีและคอมพิวเตอร์</h1>
                <p className="text-xs text-slate-600 mt-0.5">สัญญาเลขที่: <span className="font-mono font-bold">{contract.contractNumber}</span></p>
                <p className="text-xs text-slate-500">ทำขึ้น ณ {settings.shopName} · {settings.address}</p>
              </div>

              <div className="space-y-3 mb-6 text-xs text-justify">
                <p>
                  สัญญานี้ทำขึ้นเมื่อวันที่ <strong>{formatThaiDate(contract.startDate, true)}</strong> ณ {settings.shopName} ระหว่าง:
                </p>
                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <div>
                    <strong>ผู้รับซื้อฝาก:</strong> {settings.shopName} โดย {settings.ownerName} ตั้งอยู่เลขที่ {settings.address} โทร. {settings.phone} ฝ่ายหนึ่ง และ
                  </div>
                  <div>
                    <strong>ผู้ขายฝาก:</strong> {contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName} บัตรประชาชนเลขที่ {formatCitizenId(contract.customerSnapshot.citizenId)} ที่อยู่ {contract.customerSnapshot.address} โทร. {formatPhone(contract.customerSnapshot.phone)} อีกฝ่ายหนึ่ง
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div>
                    <strong>ข้อ ๑.</strong> ผู้ขายฝากได้นำทรัพย์สิน คือ <strong>{contract.item.name}</strong> ({contract.item.description})
                    {contract.item.notebook && ` S/N: ${contract.item.notebook.serialNumber} ซีพียู ${contract.item.notebook.processor} แรม ${contract.item.notebook.ramGb}GB ความจุ ${contract.item.notebook.storage}`}
                    {contract.item.printer && ` S/N: ${contract.item.printer.serialNumber} ปริ้นเตอร์ ${contract.item.printer.brand} ${contract.item.printer.model}`}
                    {' '}มาส่งมอบและขายฝากไว้แก่ผู้รับซื้อฝากในราคาทั้งสิ้น <strong>{formatCurrency(contract.loanAmount)} ({bahtToText(contract.loanAmount)})</strong> และผู้ขายฝากได้รับเงินดังกล่าวไปครบถ้วนถูกต้องแล้วในวันทำสัญญานี้
                  </div>
                  <div>
                    <strong>ข้อ ๒.</strong> คู่สัญญาทั้งสองฝ่ายตกลงกำหนดเวลาไถ่ถอนทรัพย์สินไว้มีกำหนด <strong>{formatDurationText(contract.durationMonths, contract.durationDays)}</strong> นับแต่วันทำสัญญานี้ โดยมีวันครบกำหนดไถ่ถอนในวันที่ <strong>{formatThaiDate(contract.dueDate, true)}</strong> ในอัตราสินน้ำใจหรือดอกเบี้ยร้อยละ <strong>{contract.monthlyInterestRate}% ต่อเดือน</strong>
                  </div>
                  <div>
                    <strong>ข้อ ๓.</strong> หากผู้ขายฝากมิได้มาใช้สิทธิไถ่ถอนทรัพย์สินภายในกำหนดเวลาดังกล่าว และพ้นกำหนดระยะเวลาผ่อนผัน <strong>{settings.gracePeriodDays || 15} วัน</strong> ให้ถือว่ากรรมสิทธิ์ในทรัพย์สินที่ขายฝากตกเป็นของผู้รับซื้อฝากโดยเด็ดขาดทันที ตามประมวลกฎหมายแพ่งและพาณิชย์
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-center text-xs">
                <div>
                  <div className="h-12 border-b border-dotted border-slate-400 mx-6"></div>
                  <div className="mt-1 font-semibold">({contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName})</div>
                  <div className="text-[11px] text-slate-500">ผู้ขายฝาก / จำนำ</div>
                </div>
                <div>
                  <div className="h-12 border-b border-dotted border-slate-400 mx-6"></div>
                  <div className="mt-1 font-semibold">({settings.ownerName || 'ผู้รับซื้อฝาก'})</div>
                  <div className="text-[11px] text-slate-500">ผู้รับซื้อฝาก / จนท.</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
