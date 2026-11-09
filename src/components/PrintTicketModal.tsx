import React, { useState } from 'react';
import { X, Printer, FileText, Receipt, Scroll, CheckCircle2, QrCode } from 'lucide-react';
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
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrVerificationUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="w-full h-full sm:h-auto sm:max-h-[96vh] max-w-4xl bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden flex flex-col my-auto">
        
        {/* Dynamic print page styling depending on active format */}
        <style dangerouslySetInnerHTML={{
          __html: format === 'full_contract'
            ? `@media print { @page { size: A4 portrait; margin: 8mm 10mm; } }`
            : format === 'slip'
              ? `@media print { @page { size: 80mm auto; margin: 2mm 3mm; } }`
              : `@media print { @page { size: A5 portrait; margin: 5mm 6mm; } }`
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
        <div className="no-print flex items-center gap-1.5 px-3 sm:px-6 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs shrink-0">
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
        <div className="flex-1 p-2 sm:p-6 overflow-y-auto bg-slate-200 flex justify-center items-start">
          
          {/* ========================================================================= */}
          {/* FORMAT 1: A5 PORTRAIT TICKET (ตั๋วสัญญาขายฝากไอที ขนาด A5 แนวตั้ง 148 x 210mm) */}
          {/* ========================================================================= */}
          {format === 'a5_ticket' && (
            <div className="a5-portrait-sheet w-full max-w-[540px] bg-white p-5 sm:p-6 rounded-lg shadow-md border border-slate-300 font-contract text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full leading-tight text-xs">
              
              {/* Header with Logo & Shop Info */}
              <div className="border-b-2 border-slate-900 pb-2.5 mb-3">
                <div className="flex justify-between items-start gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={effectiveLogo}
                      alt="Logo"
                      onError={(e) => {
                        if (e.currentTarget.src !== window.location.origin + '/shop_logo.jpg') {
                          e.currentTarget.src = '/shop_logo.jpg';
                        }
                      }}
                      className="w-12 h-12 rounded-lg object-contain bg-white p-0.5 border border-slate-300 shadow-xs shrink-0"
                    />
                    <div className="min-w-0">
                      <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">
                        {settings.shopName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}
                      </h1>
                      <p className="text-[11px] text-slate-700 font-medium">
                        {settings.branchName} · โทร. {settings.phone}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-snug truncate">
                        {settings.address}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Line: {settings.lineId} · Facebook: {settings.facebook || 'พัทลุงปริ้นเตอร์'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block bg-slate-900 text-amber-400 font-bold px-2 py-0.5 rounded text-[11px] tracking-wide mb-1">
                      ตั๋วสัญญาขายฝาก / จำนำไอที (A5)
                    </span>
                    <div className="text-[11px] text-slate-500">เลขที่สัญญา:</div>
                    <div className="font-mono font-bold text-sm text-slate-900">{contract.contractNumber}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">วันที่ทำรายการ: {formatThaiDate(contract.startDate)}</div>
                  </div>
                </div>
              </div>

              {/* Customer & Pledged Terms Summary */}
              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1 text-[11px] flex justify-between">
                    <span>ข้อมูลผู้ขายฝาก / จำนำ</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {contract.customerId}</span>
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <div>
                      <span className="text-slate-500">ชื่อ-สกุล: </span>
                      <strong className="text-slate-900">{contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">เลขบัตรประชาชน: </span>
                      <strong className="font-mono">{formatCitizenId(contract.customerSnapshot.citizenId)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">เบอร์โทรศัพท์: </span>
                      <strong className="font-mono">{formatPhone(contract.customerSnapshot.phone)}</strong>
                    </div>
                    <div className="text-[10px] text-slate-600 truncate">
                      <span className="text-slate-500">ที่อยู่: </span>{contract.customerSnapshot.address}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                  <div className="font-bold text-amber-950 border-b border-amber-200 pb-1 mb-1 text-[11px] flex justify-between">
                    <span>เงื่อนไขระยะเวลา & วันครบกำหนด</span>
                    <span className="font-mono text-amber-700 font-bold">{formatDurationText(contract.durationMonths, contract.durationDays)}</span>
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <div>
                      <span className="text-slate-600">ระยะเวลาสัญญา: </span>
                      <strong className="text-slate-900">{formatDurationText(contract.durationMonths, contract.durationDays)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600">วันครบกำหนดไถ่ถอน: </span>
                      <strong className="text-rose-700 font-bold underline">{formatThaiDate(contract.dueDate, true)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600">อัตราดอกเบี้ย: </span>
                      <strong>{contract.monthlyInterestRate}% ต่อเดือน</strong>
                    </div>
                    <div>
                      <span className="text-slate-600">ที่เก็บรักษา: </span>
                      <span className="text-slate-800">{contract.storageLocation || 'ตู้นิรภัยไอที ร้านพัทลุงปริ้นเตอร์'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Details Box */}
              <div className="border border-slate-300 rounded-lg p-2.5 mb-2.5 bg-white">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5 flex justify-between items-center text-[11px]">
                  <span>รายการทรัพย์สินไอทีที่นำมาฝาก / จำนำ</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-medium">
                    หมวด: {contract.item.category === 'notebook' ? 'โน็ตบุ้ค' : contract.item.category === 'printer' ? 'เครื่องพิมพ์' : contract.item.category === 'computer' ? 'คอมพิวเตอร์พีซี' : 'อุปกรณ์ไอที'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-950">{contract.item.name}</div>
                  <div className="text-[11px] text-slate-700 leading-snug">{contract.item.description}</div>
                  
                  {/* Detailed Specs chip rows */}
                  {contract.item.notebook && (
                    <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded border border-slate-200 text-[10.5px] mt-1 font-mono">
                      <div><strong>S/N:</strong> {contract.item.notebook.serialNumber}</div>
                      <div><strong>CPU:</strong> {contract.item.notebook.processor}</div>
                      <div><strong>RAM:</strong> {contract.item.notebook.ramGb}GB / <strong>Storage:</strong> {contract.item.notebook.storage}</div>
                      <div><strong>อุปกรณ์:</strong> {contract.item.notebook.hasCharger ? 'สายชาร์จแท้' : 'ไม่มีชาร์จ'}{contract.item.notebook.hasBag ? ', กระเป๋า' : ''}</div>
                    </div>
                  )}

                  {contract.item.printer && (
                    <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded border border-slate-200 text-[10.5px] mt-1">
                      <div><strong>S/N:</strong> <span className="font-mono">{contract.item.printer.serialNumber}</span></div>
                      <div><strong>ยี่ห้อ/รุ่น:</strong> {contract.item.printer.brand} {contract.item.printer.model}</div>
                      <div><strong>ระบบหมึก:</strong> {contract.item.printer.inkSystem === 'genuine_tank' ? 'แท็งก์แท้ศูนย์' : 'ตลับหมึก'}</div>
                      <div><strong>สภาพหัวพิมพ์:</strong> {contract.item.printer.headCondition === 'normal' ? 'สมบูรณ์ 100%' : 'มีเส้น/ต้องล้าง'}</div>
                    </div>
                  )}

                  {contract.item.computer && (
                    <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded border border-slate-200 text-[10.5px] mt-1 text-slate-800">
                      <div><strong>เคส/แบรนด์:</strong> {contract.item.computer.brandOrCustom}</div>
                      <div><strong>ซีพียู/แรม:</strong> {contract.item.computer.processor} (RAM {contract.item.computer.ramGb}GB)</div>
                      <div><strong>การ์ดจอ:</strong> {contract.item.computer.gpu || '-'}</div>
                      <div><strong>ความจุ:</strong> {contract.item.computer.storage}</div>
                    </div>
                  )}

                  {contract.item.phone && (
                    <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded border border-slate-200 text-[10.5px] mt-1 font-mono">
                      <div><strong>IMEI / S/N:</strong> {contract.item.phone.imei}</div>
                      <div><strong>ความจุ:</strong> {contract.item.phone.storageGb} · <strong>iCloud:</strong> {contract.item.phone.icloudStatus === 'unlocked' ? 'ปลดล็อคแล้ว' : 'ติดรหัส'}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Box */}
              <div className="bg-slate-900 text-white p-2.5 rounded-lg mb-2.5 flex justify-between items-center text-xs">
                <div>
                  <div className="text-slate-300 text-[10px]">จำนวนเงินต้นรับจำนำ / ขายฝาก:</div>
                  <div className="text-base font-bold font-mono tracking-tight text-amber-400">
                    {formatCurrency(contract.loanAmount)}
                  </div>
                  <div className="text-[10px] text-slate-300 font-medium">({bahtToText(contract.loanAmount)})</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300 text-[10px]">ดอกเบี้ยต่องวด ({formatDurationText(contract.durationMonths, contract.durationDays)}):</div>
                  <div className="text-sm font-bold font-mono text-emerald-300">
                    ฿{periodInterest.toLocaleString()} บาท
                  </div>
                  <div className="text-[10px] text-slate-400">
                    (เฉลี่ยเดือนละ {formatCurrency(monthlyInterest)})
                  </div>
                </div>
              </div>

              {/* Shop Payment Transfer Info & Terms */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 mb-2 text-[10px] text-slate-700 leading-snug">
                <div className="font-semibold text-slate-900 mb-0.5">
                  🏦 ช่องทางชำระดอกเบี้ย / โอนเงินต่อสัญญา:
                </div>
                <div>
                  {settings.bankName || 'ธนาคารกสิกรไทย'} เลขที่ <strong className="font-mono text-indigo-800">{settings.bankAccountNumber || '083-4-26805-8'}</strong> ({settings.bankAccountName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}) · พร้อมเพย์: <strong className="font-mono text-indigo-800">{settings.promptPayId || '0834268058'}</strong>
                </div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">
                  * เมื่อโอนชำระเงินแล้วกรุณาส่งหลักฐานสลิปทาง Line: <strong>{settings.lineId || 'poi1800'}</strong> พร้อมแจ้งเลขที่สัญญา <strong>{contract.contractNumber}</strong>
                </div>
              </div>

              {/* Terms Warning */}
              <div className="text-[9.5px] text-slate-500 bg-amber-50/50 p-1.5 rounded border border-amber-200 mb-3 space-y-0.5">
                <div>1. โปรดนำตั๋วสัญญาฉบับนี้พร้อมบัตรประชาชนมาแสดงทุกครั้งที่ติดต่อชำระดอกเบี้ยหรือไถ่ถอนทรัพย์สิน</div>
                <div>2. หากครบกำหนดสัญญาและพ้นระยะเวลาผ่อนผัน <strong>{settings.gracePeriodDays || 15} วัน</strong> ทรัพย์สินจะตกเป็นกรรมสิทธิ์ของผู้รับซื้อฝากโดยเด็ดขาดตามกฎหมาย</div>
              </div>

              {/* Signatures & QR Code */}
              <div className="pt-2 border-t border-slate-300 flex items-end justify-between gap-2 text-[11px]">
                <div className="text-center w-36">
                  <div className="h-10 border-b border-dotted border-slate-400"></div>
                  <div className="mt-1 font-semibold text-slate-900 truncate">({contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName})</div>
                  <div className="text-[10px] text-slate-500">ผู้ขายฝาก / จำนำ</div>
                </div>

                <div className="w-14 h-14 border border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-[9px] text-slate-400 shrink-0">
                  <span>ประทับตรา</span>
                  <span>ร้าน</span>
                </div>

                <div className="text-center w-36">
                  <div className="h-10 border-b border-dotted border-slate-400"></div>
                  <div className="mt-1 font-semibold text-slate-900 truncate">({contract.createdBy || settings.ownerName || 'ผู้รับซื้อฝาก'})</div>
                  <div className="text-[10px] text-slate-500">ผู้รับซื้อฝาก / จนท.</div>
                </div>

                {/* QR Code for quick mobile scanning */}
                <div className="flex flex-col items-center shrink-0">
                  <img
                    src={qrImageUrl}
                    alt="Scan QR"
                    className="w-13 h-13 border border-slate-300 rounded p-0.5 bg-white"
                  />
                  <span className="text-[8px] text-slate-400 mt-0.5 font-mono">สแกนตรวจสอบ</span>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMAT 2: A5 PORTRAIT INTEREST RECEIPT (ใบเสร็จต่อดอกเบี้ย ขนาด A5 แนวตั้ง) */}
          {/* ========================================================================= */}
          {format === 'a5_interest_receipt' && (
            <div className="a5-portrait-sheet w-full max-w-[540px] bg-white p-5 sm:p-6 rounded-lg shadow-md border border-slate-300 font-contract text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full leading-tight text-xs">
              {(() => {
                const receipt = activeReceipt || contract.interestPayments[contract.interestPayments.length - 1];
                if (!receipt) return <div className="text-center py-8 text-slate-500">ยังไม่มีประวัติการต่อดอกเบี้ยในสัญญานี้</div>;
                return (
                  <div>
                    {/* Header with Logo */}
                    <div className="border-b-2 border-indigo-700 pb-2.5 mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={effectiveLogo}
                          alt="Logo"
                          onError={(e) => {
                            if (e.currentTarget.src !== window.location.origin + '/shop_logo.jpg') {
                              e.currentTarget.src = '/shop_logo.jpg';
                            }
                          }}
                          className="w-12 h-12 rounded-lg object-contain bg-white p-0.5 border border-slate-300 shadow-xs shrink-0"
                        />
                        <div>
                          <h2 className="text-base font-bold text-slate-900">{settings.shopName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}</h2>
                          <p className="text-[11px] text-slate-600">{settings.branchName} · โทร. {settings.phone}</p>
                          <p className="text-[10px] text-slate-500 truncate">{settings.address}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded text-[11px]">
                          ใบเสร็จรับเงินชำระดอกเบี้ย (A5)
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">เลขที่ใบเสร็จ: <strong className="font-mono text-slate-900">{receipt.receiptNumber}</strong></div>
                        <div className="text-[10px] text-slate-500">สัญญาอ้างอิง: <strong className="font-mono">{contract.contractNumber}</strong></div>
                      </div>
                    </div>

                    {/* Customer & Payment Meta */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <div><span className="text-slate-500">ชื่อลูกค้า: </span><strong>{contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</strong></div>
                        <div><span className="text-slate-500">เลขบัตร: </span><span className="font-mono">{formatCitizenId(contract.customerSnapshot.citizenId)}</span></div>
                        <div><span className="text-slate-500">เบอร์โทร: </span><span className="font-mono">{formatPhone(contract.customerSnapshot.phone)}</span></div>
                      </div>
                      <div className="text-right">
                        <div><span className="text-slate-500">วันที่ชำระ: </span><strong>{formatThaiDateTime(receipt.date)}</strong></div>
                        <div><span className="text-slate-500">ผู้รับเงิน: </span><strong>{receipt.recordedBy}</strong></div>
                        <div><span className="text-slate-500">ช่องทาง: </span><span className="font-semibold text-indigo-700">{receipt.paymentMethod === 'cash' ? '💵 เงินสด' : '📱 โอนเงินเข้าบัญชี'}</span></div>
                      </div>
                    </div>

                    {/* Interest & Extension Details */}
                    <div className="border border-slate-200 rounded-lg p-3 text-xs mb-3 space-y-1.5 bg-white">
                      <div className="font-bold text-slate-900 flex justify-between border-b pb-1">
                        <span>ทรัพย์สินค้ำประกัน: {contract.item.name}</span>
                        <span className="text-slate-500 font-mono text-[11px]">เงินต้น: {formatCurrency(contract.loanAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between text-slate-700 text-[11px]">
                        <span>จำนวนระยะเวลาที่ต่อสัญญา:</span>
                        <strong className="text-slate-900">{receipt.monthsPaid} เดือน (อัตรา {receipt.ratePercent}% ต่อเดือน)</strong>
                      </div>
                      
                      <div className="bg-indigo-50/70 p-2 rounded border border-indigo-100 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="text-slate-500">วันครบกำหนดเดิม:</div>
                          <strong className="text-slate-700">{formatThaiDate(receipt.previousDueDate)}</strong>
                        </div>
                        <div className="text-indigo-600 font-bold text-base">➔</div>
                        <div className="text-right">
                          <div className="text-indigo-700 font-bold">วันครบกำหนดใหม่:</div>
                          <strong className="text-indigo-900 font-bold text-sm underline">{formatThaiDate(receipt.newDueDate, true)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Total Amount Banner */}
                    <div className="bg-slate-900 text-white p-3 rounded-lg mb-4 flex justify-between items-center text-xs">
                      <div>
                        <div className="text-slate-300 text-[10px]">ยอดเงินดอกเบี้ยที่รับชำระสุทธิ:</div>
                        <div className="text-lg font-bold font-mono text-amber-400">{formatCurrency(receipt.totalPaid)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-300 text-[10px]">ตัวอักษร:</div>
                        <div className="text-amber-300 font-medium">{bahtToText(receipt.totalPaid)}</div>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-200">
                      <div>
                        <div className="h-10 border-b border-dotted border-slate-400 mx-6"></div>
                        <div className="mt-1">ผู้ชำระเงิน</div>
                        <div className="text-[10px] text-slate-500">({contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName})</div>
                      </div>
                      <div>
                        <div className="h-10 border-b border-dotted border-slate-400 mx-6"></div>
                        <div className="mt-1 font-semibold">{receipt.recordedBy}</div>
                        <div className="text-[10px] text-slate-500">ผู้รับเงิน / แคชเชียร์</div>
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
            <div className="a5-portrait-sheet w-full max-w-[540px] bg-white p-5 sm:p-6 rounded-lg shadow-md border border-slate-300 font-contract text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full leading-tight text-xs">
              {/* Header with Logo */}
              <div className="border-b-2 border-emerald-700 pb-2.5 mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={effectiveLogo}
                    alt="Logo"
                    onError={(e) => {
                      if (e.currentTarget.src !== window.location.origin + '/shop_logo.jpg') {
                        e.currentTarget.src = '/shop_logo.jpg';
                      }
                    }}
                    className="w-12 h-12 rounded-lg object-contain bg-white p-0.5 border border-slate-300 shadow-xs shrink-0"
                  />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{settings.shopName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์'}</h2>
                    <p className="text-[11px] text-slate-600">{settings.branchName} · โทร. {settings.phone}</p>
                    <p className="text-[10px] text-slate-500 truncate">{settings.address}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold px-2 py-0.5 rounded text-[11px]">
                    ใบเสร็จรับเงินไถ่ถอน / ส่งมอบคืน (A5)
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1">เลขที่ใบเสร็จ: <strong className="font-mono text-slate-900">{contract.redemption.receiptNumber}</strong></div>
                  <div className="text-[10px] text-slate-500">สัญญาอ้างอิง: <strong className="font-mono">{contract.contractNumber}</strong></div>
                </div>
              </div>

              {/* Customer & Redemption Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>
                  <div><span className="text-slate-500">ชื่อลูกค้า: </span><strong>{contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</strong></div>
                  <div><span className="text-slate-500">เลขบัตร: </span><span className="font-mono">{formatCitizenId(contract.customerSnapshot.citizenId)}</span></div>
                </div>
                <div className="text-right">
                  <div><span className="text-slate-500">วันที่ไถ่ถอน: </span><strong>{formatThaiDateTime(contract.redemption.redeemDate)}</strong></div>
                  <div><span className="text-slate-500">ผู้ดำเนินการ: </span><strong>{contract.redemption.recordedBy}</strong></div>
                </div>
              </div>

              {/* Returned Item & Financial Breakdown */}
              <div className="border border-slate-200 rounded-lg p-2.5 text-xs mb-3 space-y-1.5 bg-white">
                <div className="font-bold text-slate-900 border-b pb-1">
                  รายการทรัพย์สินที่ส่งมอบคืน: {contract.item.name}
                </div>
                <div className="text-[11px] text-slate-600">{contract.item.description}</div>
                
                <div className="border-t border-slate-200 pt-1.5 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>๑. เงินต้นที่ไถ่ถอน:</span>
                    <strong className="font-mono">{formatCurrency(contract.redemption.principalPaid)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>๒. ดอกเบี้ยคงค้าง:</span>
                    <strong className="font-mono">{formatCurrency(contract.redemption.interestPaid)}</strong>
                  </div>
                  {contract.redemption.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>๓. ส่วนลดพิเศษ:</span>
                      <strong className="font-mono">-{formatCurrency(contract.redemption.discountAmount)}</strong>
                    </div>
                  )}
                  {contract.redemption.extraFee > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>๔. ค่าปรับล่าช้า / ธรรมเนียม:</span>
                      <strong className="font-mono">+{formatCurrency(contract.redemption.extraFee)}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Banner */}
              <div className="bg-slate-900 text-white p-3 rounded-lg mb-3 flex justify-between items-center text-xs">
                <div>
                  <div className="text-slate-300 text-[10px]">ยอดรวมทั้งสิ้นที่ชำระไถ่ถอน:</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">{formatCurrency(contract.redemption.totalPaid)}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300 text-[10px]">ตัวอักษร:</div>
                  <div className="text-amber-300 font-medium">{bahtToText(contract.redemption.totalPaid)}</div>
                </div>
              </div>

              <p className="text-[10px] text-slate-600 mb-4 bg-emerald-50/60 p-2 rounded border border-emerald-200 leading-snug">
                ผู้ขายฝากได้รับมอบทรัพย์สินตามรายการข้างต้นคืนในสภาพเรียบร้อย ถูกต้องตามความประสงค์แล้ว และไม่ติดใจเรียกร้องสิทธิใดๆ ต่อไป
              </p>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs pt-3 border-t border-slate-200">
                <div>
                  <div className="h-10 border-b border-dotted border-slate-400 mx-6"></div>
                  <div className="mt-1 font-semibold">({contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName})</div>
                  <div className="text-[10px] text-slate-500">ผู้รับมอบทรัพย์สินคืน</div>
                </div>
                <div>
                  <div className="h-10 border-b border-dotted border-slate-400 mx-6"></div>
                  <div className="mt-1 font-semibold">{contract.redemption.recordedBy}</div>
                  <div className="text-[10px] text-slate-500">ผู้ส่งมอบทรัพย์สิน / เจ้าหน้าที่</div>
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
                <div className="flex justify-between font-bold text-rose-700">
                  <span>วันครบกำหนด:</span>
                  <span>{formatThaiDate(contract.dueDate, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ระยะเวลา:</span>
                  <span>{formatDurationText(contract.durationMonths, contract.durationDays)}</span>
                </div>
              </div>

              <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
                <div><span className="text-slate-500">ผู้ขายฝาก:</span> {contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</div>
                <div><span className="text-slate-500">โทร:</span> {contract.customerSnapshot.phone}</div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-300 space-y-1">
                <div className="font-bold">{contract.item.name}</div>
                <div className="text-[10px] text-slate-600">{contract.item.description}</div>
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
