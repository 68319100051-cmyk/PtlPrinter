import React, { useState } from 'react';
import { X, Printer, FileText, Receipt, Scroll, CheckCircle2 } from 'lucide-react';
import { PawnContract, ShopSettings, InterestPayment } from '../types/pawn';
import { formatCurrency, formatThaiDate, formatThaiDateTime, bahtToText, formatCitizenId, formatPhone } from '../utils/thaiFormat';

interface PrintTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: PawnContract;
  settings: ShopSettings;
  defaultMode?: 'slip' | 'half_a4' | 'full_contract' | 'interest_receipt' | 'redeem_receipt';
  activeReceipt?: InterestPayment;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  isOpen,
  onClose,
  contract,
  settings,
  defaultMode = 'half_a4',
  activeReceipt,
}) => {
  const [format, setFormat] = useState<'slip' | 'half_a4' | 'full_contract' | 'interest_receipt' | 'redeem_receipt'>(defaultMode);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const monthlyInterest = (contract.loanAmount * contract.monthlyInterestRate) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="w-full h-full sm:h-auto sm:max-h-[94vh] max-w-4xl bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Header - Controls (Hidden during print) */}
        <div className="no-print flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">ศูนย์พิมพ์เอกสารและตั๋วสัญญา</h3>
              <p className="text-xs text-slate-500">สัญญาเลขที่: <span className="font-mono font-medium text-slate-800">{contract.contractNumber}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              สั่งพิมพ์เอกสาร (Print)
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Format Selector Bar (Hidden during print) */}
        <div className="no-print flex items-center gap-1.5 px-6 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs shrink-0">
          <span className="text-slate-500 font-medium whitespace-nowrap mr-2">รูปแบบเอกสาร:</span>
          <button
            onClick={() => setFormat('half_a4')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              format === 'half_a4' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            ตั๋วสัญญาแบบใหญ่ (A4 ครึ่งใบ)
          </button>
          <button
            onClick={() => setFormat('slip')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              format === 'slip' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            ตั๋วขายฝากแบบสลิป (80mm)
          </button>
          <button
            onClick={() => setFormat('full_contract')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              format === 'full_contract' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scroll className="w-3.5 h-3.5" />
            สัญญาขายฝากเต็มรูปแบบ (A4 เต็มใบ)
          </button>
          {contract.interestPayments.length > 0 && (
            <button
              onClick={() => setFormat('interest_receipt')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                format === 'interest_receipt' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              ใบเสร็จต่อดอกเบี้ย
            </button>
          )}
          {contract.redemption && (
            <button
              onClick={() => setFormat('redeem_receipt')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                format === 'redeem_receipt' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              ใบเสร็จรับเงินไถ่ถอน
            </button>
          )}
        </div>

        {/* Printable Viewport */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-200 flex justify-center">
          {/* FORMAT 1: HALF A4 TICKET */}
          {format === 'half_a4' && (
            <div className="w-full max-w-[800px] bg-white p-6 sm:p-8 rounded-lg shadow-md border border-slate-300 font-contract text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full">
              {/* Top Title & Header */}
              <div className="border-b-2 border-slate-900 pb-3 mb-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    {settings.logoUrl && (
                      <img src={settings.logoUrl} alt="Shop Logo" className="w-14 h-14 rounded-lg object-contain border border-slate-300 bg-white p-0.5 shrink-0" />
                    )}
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-slate-900">{settings.shopName}</h1>
                      <p className="text-xs text-slate-700">{settings.branchName} · โทร. {settings.phone} {settings.email ? `· อีเมล: ${settings.email}` : ''}</p>
                      <p className="text-xs text-slate-600">{settings.address}</p>
                      {settings.bankName && (
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          บัญชีร้าน: {settings.bankName} เลขที่ {settings.bankAccountNumber} ({settings.bankAccountName}) · พร้อมเพย์: {settings.promptPayId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="inline-block border border-slate-900 px-3 py-1 rounded bg-slate-50 font-bold text-sm">
                      ตั๋วรับจำนำ / ขายฝาก
                    </div>
                    <div className="text-xs font-mono mt-1 font-semibold">เลขที่: {contract.contractNumber}</div>
                    <div className="text-xs text-slate-600">วันที่ทำรายการ: {formatThaiDate(contract.startDate)}</div>
                  </div>
                </div>
              </div>

              {/* Grid 2 Parts: Customer Section & Details */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">ข้อมูลผู้ขายฝาก / จำนำ</div>
                  <div className="space-y-1">
                    <div><span className="text-slate-500">ชื่อ-สกุล:</span> <span className="font-semibold">{contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</span></div>
                    <div><span className="text-slate-500">บัตรประชาชน:</span> <span className="font-mono font-medium">{formatCitizenId(contract.customerSnapshot.citizenId)}</span></div>
                    <div><span className="text-slate-500">เบอร์โทรศัพท์:</span> <span className="font-mono">{formatPhone(contract.customerSnapshot.phone)}</span></div>
                    <div><span className="text-slate-500">ที่อยู่:</span> {contract.customerSnapshot.address}</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">เงื่อนไขสัญญา & กำหนดเวลา</div>
                  <div className="space-y-1">
                    <div><span className="text-slate-500">กำหนดระยะเวลา:</span> <span className="font-semibold">{contract.durationMonths} เดือน</span></div>
                    <div><span className="text-slate-500">วันครบกำหนดไถ่ถอน:</span> <span className="font-bold text-rose-700 underline">{formatThaiDate(contract.dueDate, true)}</span></div>
                    <div><span className="text-slate-500">อัตราดอกเบี้ย:</span> <span className="font-bold">{contract.monthlyInterestRate}% ต่อเดือน</span> (เดือนละ {formatCurrency(monthlyInterest)})</div>
                    <div><span className="text-slate-500">สถานที่เก็บรักษา:</span> {contract.storageLocation || 'ตู้นิรภัยร้าน'}</div>
                  </div>
                </div>
              </div>

              {/* Item Details */}
              <div className="border border-slate-300 rounded mb-4 overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs border-b border-slate-300">
                  รายการทรัพย์สินที่นำมาฝาก / จำนำ
                </div>
                <div className="p-3 text-xs space-y-1.5">
                  <div className="font-semibold text-sm text-slate-900">{contract.item.name}</div>
                  <div className="text-slate-700">{contract.item.description}</div>
                  {contract.item.notebook && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-indigo-50 p-2.5 rounded border border-indigo-200 font-medium text-indigo-950 mt-2 text-[11px]">
                      <div><strong>S/N:</strong> {contract.item.notebook.serialNumber}</div>
                      <div><strong>CPU:</strong> {contract.item.notebook.processor}</div>
                      <div><strong>RAM/SSD:</strong> {contract.item.notebook.ramGb}GB / {contract.item.notebook.storage}</div>
                      <div><strong>อุปกรณ์:</strong> {contract.item.notebook.hasCharger ? 'มีสายชาร์จแท้' : 'ไม่มีสายชาร์จ'} {contract.item.notebook.hasBag ? '+ กระเป๋า' : ''}</div>
                    </div>
                  )}
                  {contract.item.computer && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-cyan-50 p-2.5 rounded border border-cyan-200 font-medium text-cyan-950 mt-2 text-[11px]">
                      <div><strong>รุ่น/เคส:</strong> {contract.item.computer.brandOrCustom} {contract.item.computer.modelOrCase}</div>
                      <div><strong>CPU:</strong> {contract.item.computer.processor}</div>
                      <div><strong>RAM/SSD:</strong> {contract.item.computer.ramGb}GB / {contract.item.computer.storage}</div>
                      <div><strong>การ์ดจอ:</strong> {contract.item.computer.gpu || 'ออนบอร์ด'}</div>
                    </div>
                  )}
                  {contract.item.printer && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-emerald-50 p-2.5 rounded border border-emerald-200 font-medium text-emerald-950 mt-2 text-[11px]">
                      <div><strong>S/N:</strong> {contract.item.printer.serialNumber}</div>
                      <div><strong>ยี่ห้อ/รุ่น:</strong> {contract.item.printer.brand} {contract.item.printer.model}</div>
                      <div><strong>ระบบหมึก:</strong> {contract.item.printer.inkSystem === 'genuine_tank' ? 'แท็งก์แท้โรงงาน' : contract.item.printer.inkSystem === 'mod_tank' ? 'แท็งก์ดัดแปลง' : 'ตลับหมึก'}</div>
                      <div><strong>หัวพิมพ์:</strong> {contract.item.printer.headCondition === 'normal' ? 'ออกครบ 100%' : 'มีเส้น/ต้องล้าง'}</div>
                    </div>
                  )}
                  {contract.item.phone && (
                    <div className="grid grid-cols-3 gap-2 bg-blue-50 p-2.5 rounded border border-blue-200 text-blue-950 mt-2 text-[11px]">
                      <div><strong>IMEI / S/N:</strong> {contract.item.phone.imei}</div>
                      <div><strong>ความจุ:</strong> {contract.item.phone.storageGb}</div>
                      <div><strong>สถานะ iCloud/บัญชี:</strong> {contract.item.phone.icloudStatus === 'unlocked' || contract.item.phone.icloudStatus === 'signed_out' ? 'ปลดล็อคเรียบร้อย' : 'ติดรหัส'}</div>
                    </div>
                  )}
                  {contract.item.itGadget && (
                    <div className="grid grid-cols-3 gap-2 bg-purple-50 p-2.5 rounded border border-purple-200 text-purple-950 mt-2 text-[11px]">
                      <div><strong>S/N:</strong> {contract.item.itGadget.serialNumber}</div>
                      <div><strong>ยี่ห้อ/รุ่น:</strong> {contract.item.itGadget.brand} {contract.item.itGadget.model}</div>
                      <div><strong>อุปกรณ์เสริม:</strong> {contract.item.itGadget.accessories || 'ตัวเครื่อง'}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Box */}
              <div className="bg-slate-900 text-white p-3 rounded mb-4 flex justify-between items-center text-xs">
                <div>
                  <div className="text-slate-300">จำนวนเงินต้นรับจำนำ / ขายฝาก:</div>
                  <div className="text-lg font-bold font-mono tracking-tight">{formatCurrency(contract.loanAmount)}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300">ตัวอักษร:</div>
                  <div className="font-medium text-amber-300">{bahtToText(contract.loanAmount)}</div>
                </div>
              </div>

              {/* Terms Warning */}
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 mb-6 space-y-1">
                <div>* กรุณานำตั๋วสัญญาฉบับนี้พร้อมบัตรประจำตัวประชาชนมาแสดงทุกครั้งที่ชำระดอกเบี้ยหรือไถ่ถอน</div>
                <div>* หากเกินกำหนดเวลาและระยะผ่อนผัน 15 วัน ทรัพย์สินจะตกเป็นสิทธิของผู้รับซื้อฝากโดยสมบูรณ์</div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-dashed border-slate-300">
                <div>
                  <div className="h-12 border-b border-dotted border-slate-400 mx-8"></div>
                  <div className="mt-1 font-semibold">({contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName})</div>
                  <div className="text-[11px] text-slate-500">ผู้ขายฝาก / ผู้จำนำ</div>
                </div>
                <div>
                  <div className="h-12 border-b border-dotted border-slate-400 mx-8"></div>
                  <div className="mt-1 font-semibold">({contract.createdBy})</div>
                  <div className="text-[11px] text-slate-500">ผู้รับซื้อฝาก / เจ้าหน้าที่แคชเชียร์</div>
                </div>
              </div>
            </div>
          )}

          {/* FORMAT 2: THERMAL SLIP 80MM */}
          {format === 'slip' && (
            <div className="w-[320px] bg-white p-4 shadow-md border border-slate-300 font-mono text-[11px] leading-tight text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full">
              <div className="text-center pb-2 border-b border-dashed border-slate-400 mb-2">
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 mx-auto mb-1 rounded-md object-contain" />
                )}
                <div className="font-bold text-sm tracking-tight">{settings.shopName}</div>
                <div className="text-[10px] text-slate-600">{settings.branchName}</div>
                <div className="text-[10px]">โทร: {settings.phone}</div>
                {settings.promptPayId && <div className="text-[9px] text-slate-500">พร้อมเพย์: {settings.promptPayId}</div>}
                <div className="font-bold text-xs mt-1.5 bg-slate-100 py-0.5 border border-slate-300">ตั๋วขายฝาก / จำนำ</div>
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
                <div className="flex justify-between">
                  <span>วันครบกำหนด:</span>
                  <span className="font-bold text-red-600">{formatThaiDate(contract.dueDate)}</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-300 space-y-1">
                <div><span className="text-slate-500">ลูกค้า:</span> {contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</div>
                <div><span className="text-slate-500">บัตร ปชช.:</span> {formatCitizenId(contract.customerSnapshot.citizenId)}</div>
                <div><span className="text-slate-500">เบอร์โทร:</span> {formatPhone(contract.customerSnapshot.phone)}</div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-300">
                <div className="font-bold mb-1">รายการทรัพย์สิน:</div>
                <div className="font-sans font-medium text-xs">{contract.item.name}</div>
                {contract.item.notebook && (
                  <div className="text-[10px] text-slate-700">
                    S/N: {contract.item.notebook.serialNumber} | CPU: {contract.item.notebook.processor} | RAM {contract.item.notebook.ramGb}GB | {contract.item.notebook.storage}
                  </div>
                )}
                {contract.item.computer && (
                  <div className="text-[10px] text-slate-700">
                    {contract.item.computer.brandOrCustom} | CPU: {contract.item.computer.processor} | RAM {contract.item.computer.ramGb}GB | {contract.item.computer.storage}
                  </div>
                )}
                {contract.item.printer && (
                  <div className="text-[10px] text-slate-700">
                    S/N: {contract.item.printer.serialNumber} | {contract.item.printer.brand} {contract.item.printer.model} | หัวพิมพ์: {contract.item.printer.headCondition === 'normal' ? '100%' : 'มีเส้น'}
                  </div>
                )}
                {contract.item.phone && (
                  <div className="text-[10px] text-slate-700">IMEI: {contract.item.phone.imei} | {contract.item.phone.storageGb}</div>
                )}
                {contract.item.itGadget && (
                  <div className="text-[10px] text-slate-700">S/N: {contract.item.itGadget.serialNumber} | {contract.item.itGadget.brand} {contract.item.itGadget.model}</div>
                )}
              </div>

              <div className="py-2 border-b border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between font-bold text-xs">
                  <span>ยอดเงินต้น:</span>
                  <span>{formatCurrency(contract.loanAmount)}</span>
                </div>
                <div className="text-[10px] text-right text-slate-600">({bahtToText(contract.loanAmount)})</div>
                <div className="flex justify-between text-[10px]">
                  <span>อัตราดอกเบี้ย:</span>
                  <span>{contract.monthlyInterestRate}% / เดือน</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>ดอกเบี้ยต่อเดือน:</span>
                  <span>{formatCurrency(monthlyInterest)}</span>
                </div>
              </div>

              {/* Barcode visual placeholder */}
              <div className="text-center py-3 border-b border-dashed border-slate-300">
                <div className="inline-block tracking-widest font-mono text-xs font-bold border-y border-slate-800 py-1 px-4">
                  * {contract.contractNumber} *
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">บาร์โค้ดสแกนเพื่อตรวจสอบ</div>
              </div>

              <div className="text-[9px] text-slate-500 text-center py-2 space-y-0.5">
                <div>โปรดเก็บรักษาสลิปนี้เพื่อใช้ต่อดอกหรือไถ่ถอน</div>
                <div>เกินกำหนดสัญญา 15 วัน ทรัพย์สินหลุดจำนำ</div>
              </div>

              <div className="pt-4 text-center">
                <div className="border-b border-slate-300 mx-4 h-6"></div>
                <div className="text-[10px] mt-1">ลายมือชื่อลูกค้า</div>
              </div>
            </div>
          )}

          {/* FORMAT 3: FULL LEGAL CONTRACT A4 */}
          {format === 'full_contract' && (
            <div className="w-full max-w-[850px] bg-white p-8 sm:p-12 rounded-lg shadow-md border border-slate-300 font-contract text-slate-900 leading-relaxed text-sm print:shadow-none print:border-none print:p-0 print:m-0 print:w-full">
              <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
                <h1 className="text-2xl font-bold tracking-tight">หนังสือสัญญาขายฝาก / จำนำทรัพย์สิน</h1>
                <p className="text-xs text-slate-600 mt-1">ทำขึ้น ณ {settings.shopName} {settings.branchName}</p>
                <div className="flex justify-between text-xs text-slate-700 mt-3 pt-2 border-t border-slate-200">
                  <span>สัญญาเลขที่: <strong className="font-mono">{contract.contractNumber}</strong></span>
                  <span>วันที่ทำสัญญา: <strong>{formatThaiDate(contract.startDate, true)}</strong></span>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-justify">
                <p>
                  สัญญานี้ทำขึ้นระหว่าง <strong>{contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</strong> บัตรประจำตัวประชาชนเลขที่ <strong>{formatCitizenId(contract.customerSnapshot.citizenId)}</strong> ที่อยู่เลขที่ {contract.customerSnapshot.address} โทรศัพท์ {formatPhone(contract.customerSnapshot.phone)} ซึ่งต่อไปในสัญญานี้จะเรียกว่า <strong>"ผู้ขายฝาก"</strong> ฝ่ายหนึ่ง กับ
                </p>
                <p>
                  <strong>{settings.shopName}</strong> โดย <strong>{contract.createdBy}</strong> สำนักงานตั้งอยู่เลขที่ {settings.address} โทรศัพท์ {settings.phone} ซึ่งต่อไปในสัญญานี้จะเรียกว่า <strong>"ผู้รับซื้อฝาก"</strong> อีกฝ่ายหนึ่ง
                </p>
                <p>
                  ทั้งสองฝ่ายตกลงทำสัญญากันโดยมีข้อความและเงื่อนไขดังต่อไปนี้:
                </p>

                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2 text-xs">
                  <div>
                    <strong>ข้อ ๑.</strong> ผู้ขายฝากได้นำทรัพย์สิน คือ <strong>{contract.item.name}</strong> ({contract.item.description})
                    {contract.item.notebook && ` S/N: ${contract.item.notebook.serialNumber} ซีพียู ${contract.item.notebook.processor} แรม ${contract.item.notebook.ramGb}GB ความจุ ${contract.item.notebook.storage} พร้อม${contract.item.notebook.hasCharger ? 'สายชาร์จ' : 'ไม่มีสายชาร์จ'}`}
                    {contract.item.computer && ` สเปก ${contract.item.computer.brandOrCustom} ซีพียู ${contract.item.computer.processor} แรม ${contract.item.computer.ramGb}GB ความจุ ${contract.item.computer.storage} การ์ดจอ ${contract.item.computer.gpu || '-'}`}
                    {contract.item.printer && ` S/N: ${contract.item.printer.serialNumber} ปริ้นเตอร์ ${contract.item.printer.brand} ${contract.item.printer.model} หัวพิมพ์สภาพ ${contract.item.printer.headCondition === 'normal' ? 'สมบูรณ์' : 'ต้องล้าง'}`}
                    {contract.item.phone && ` เลข IMEI / S/N: ${contract.item.phone.imei} ความจุ ${contract.item.phone.storageGb} ปลดล็อคระบบเรียบร้อย`}
                    {contract.item.itGadget && ` S/N: ${contract.item.itGadget.serialNumber} ${contract.item.itGadget.brand} ${contract.item.itGadget.model}`}
                    {' '}มาส่งมอบและขายฝากไว้แก่ผู้รับซื้อฝากในราคาทั้งสิ้น <strong>{formatCurrency(contract.loanAmount)} ({bahtToText(contract.loanAmount)})</strong> และผู้ขายฝากได้รับเงินดังกล่าวไปครบถ้วนถูกต้องแล้วในวันทำสัญญานี้
                  </div>
                  <div>
                    <strong>ข้อ ๒.</strong> คู่สัญญาทั้งสองฝ่ายตกลงกำหนดเวลาไถ่ถอนทรัพย์สินไว้มีกำหนด <strong>{contract.durationMonths} เดือน</strong> นับแต่วันทำสัญญานี้ โดยมีวันครบกำหนดไถ่ถอนในวันที่ <strong>{formatThaiDate(contract.dueDate, true)}</strong> ในอัตราสินน้ำใจหรือดอกเบี้ยร้อยละ <strong>{contract.monthlyInterestRate}% ต่อเดือน</strong>
                  </div>
                  <div>
                    <strong>ข้อ ๓.</strong> หากผู้ขายฝากมิได้มาใช้สิทธิไถ่ถอนทรัพย์สินภายในกำหนดเวลาดังกล่าว และพ้นกำหนดระยะเวลาผ่อนผัน <strong>{settings.gracePeriodDays} วัน</strong> ให้ถือว่ากรรมสิทธิ์ในทรัพย์สินที่ขายฝากตกเป็นของผู้รับซื้อฝากโดยเด็ดขาดทันที ตามประมวลกฎหมายแพ่งและพาณิชย์
                  </div>
                  <div>
                    <strong>ข้อ ๔.</strong> ผู้ขายฝากรับรองว่าเป็นเจ้าของกรรมสิทธิ์ในทรัพย์สินดังกล่าวอย่างแท้จริง มิใช่ทรัพย์สินที่ได้มาโดยมิชอบด้วยกฎหมาย
                  </div>
                </div>

                <p className="text-xs">
                  สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความโดยตลอดแล้ว จึงได้ลงลายมือชื่อและพิมพ์ลายนิ้วมือไว้เป็นสำคัญต่อหน้าพยาน
                </p>
              </div>

              {/* Signatures & Fingerprint */}
              <div className="grid grid-cols-3 gap-4 pt-8 mt-6 border-t border-slate-300 text-center text-xs">
                <div>
                  <div className="h-16 border-b border-dotted border-slate-400 mx-4"></div>
                  <div className="mt-2 font-semibold">({contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName})</div>
                  <div className="text-[11px] text-slate-500">ผู้ขายฝาก / ผู้จำนำ</div>
                  {/* Thumbprint square */}
                  <div className="w-16 h-20 border-2 border-slate-400 rounded mx-auto mt-2 flex items-center justify-center text-[10px] text-slate-400">
                    พิมพ์ลายนิ้วมือ<br/>แม่มือขวา
                  </div>
                </div>

                <div>
                  <div className="h-16 border-b border-dotted border-slate-400 mx-4"></div>
                  <div className="mt-2 font-semibold">({contract.createdBy})</div>
                  <div className="text-[11px] text-slate-500">ผู้รับซื้อฝาก / เจ้าหน้าที่ผู้รับมอบอำนาจ</div>
                  <div className="w-16 h-20 border-2 border-dashed border-slate-300 rounded mx-auto mt-2 flex items-center justify-center text-[10px] text-slate-400">
                    ตราประทับร้าน
                  </div>
                </div>

                <div>
                  <div className="h-16 border-b border-dotted border-slate-400 mx-4"></div>
                  <div className="mt-2 font-semibold">(...................................................)</div>
                  <div className="text-[11px] text-slate-500">พยาน</div>
                  <div className="h-16 border-b border-dotted border-slate-400 mx-4 mt-6"></div>
                  <div className="mt-2 font-semibold">(...................................................)</div>
                  <div className="text-[11px] text-slate-500">พยาน</div>
                </div>
              </div>
            </div>
          )}

          {/* FORMAT 4: INTEREST RECEIPT */}
          {format === 'interest_receipt' && (
            <div className="w-full max-w-[650px] bg-white p-6 sm:p-8 rounded-lg shadow-md border border-slate-300 font-contract text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full">
              {(() => {
                const receipt = activeReceipt || contract.interestPayments[contract.interestPayments.length - 1];
                if (!receipt) return <div className="text-center py-8 text-slate-500">ยังไม่มีประวัติการต่อดอกเบี้ยในสัญญานี้</div>;
                return (
                  <div>
                    <div className="text-center border-b pb-3 mb-4">
                      <h2 className="text-lg font-bold">{settings.shopName}</h2>
                      <p className="text-xs text-slate-600">{settings.branchName} · โทร. {settings.phone}</p>
                      <div className="inline-block bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold px-3 py-1 rounded text-sm mt-2">
                        ใบเสร็จรับเงินชำระดอกเบี้ย / ต่ออายุสัญญา
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                      <div>
                        <div>เลขที่ใบเสร็จ: <strong className="font-mono">{receipt.receiptNumber}</strong></div>
                        <div>อ้างอิงสัญญาเลขที่: <strong className="font-mono">{contract.contractNumber}</strong></div>
                        <div>ชื่อลูกค้า: {contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</div>
                      </div>
                      <div className="text-right">
                        <div>วันที่ชำระ: {formatThaiDateTime(receipt.date)}</div>
                        <div>ผู้รับเงิน: {receipt.recordedBy}</div>
                        <div>ช่องทาง: {receipt.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน'}</div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded p-3 text-xs mb-4 space-y-1 bg-slate-50">
                      <div className="font-semibold">ทรัพย์สินค้ำประกัน: {contract.item.name}</div>
                      <div>เงินต้นคงค้าง: <strong className="font-mono">{formatCurrency(contract.loanAmount)}</strong></div>
                      <div>จำนวนเดือนที่ต่อ: <strong>{receipt.monthsPaid} เดือน</strong> (อัตรา {receipt.ratePercent}%/เดือน)</div>
                      <div className="pt-1 text-slate-600 border-t border-slate-200">
                        วันครบกำหนดเดิม: {formatThaiDate(receipt.previousDueDate)} ➔ <span className="font-bold text-indigo-700">ขยายเป็นวันครบกำหนดใหม่: {formatThaiDate(receipt.newDueDate, true)}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-white p-3 rounded mb-6 flex justify-between items-center text-xs">
                      <div>
                        <div className="text-slate-300">ยอดเงินดอกเบี้ยที่รับชำระสุทธิ:</div>
                        <div className="text-lg font-bold font-mono">{formatCurrency(receipt.totalPaid)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-300">ตัวอักษร:</div>
                        <div className="text-amber-300 font-medium">{bahtToText(receipt.totalPaid)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-200">
                      <div>
                        <div className="h-10 border-b border-dotted border-slate-400 mx-8"></div>
                        <div className="mt-1">ผู้ชำระเงิน</div>
                      </div>
                      <div>
                        <div className="h-10 border-b border-dotted border-slate-400 mx-8"></div>
                        <div className="mt-1 font-semibold">{receipt.recordedBy}</div>
                        <div className="text-[11px] text-slate-500">ผู้รับเงิน / แคชเชียร์</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* FORMAT 5: REDEMPTION RECEIPT */}
          {format === 'redeem_receipt' && contract.redemption && (
            <div className="w-full max-w-[650px] bg-white p-6 sm:p-8 rounded-lg shadow-md border border-slate-300 font-contract text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full">
              <div className="text-center border-b pb-3 mb-4">
                <h2 className="text-lg font-bold">{settings.shopName}</h2>
                <p className="text-xs text-slate-600">{settings.branchName} · โทร. {settings.phone}</p>
                <div className="inline-block bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold px-3 py-1 rounded text-sm mt-2">
                  ใบเสร็จรับเงินไถ่ถอน / ส่งมอบทรัพย์สินคืน
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                <div>
                  <div>เลขที่ใบเสร็จ: <strong className="font-mono">{contract.redemption.receiptNumber}</strong></div>
                  <div>อ้างอิงสัญญาเลขที่: <strong className="font-mono">{contract.contractNumber}</strong></div>
                  <div>ชื่อลูกค้า: {contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</div>
                </div>
                <div className="text-right">
                  <div>วันที่ไถ่ถอน: {formatThaiDateTime(contract.redemption.redeemDate)}</div>
                  <div>ผู้ดำเนินการ: {contract.redemption.recordedBy}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded p-3 text-xs mb-4 space-y-1.5 bg-slate-50">
                <div className="font-semibold text-sm">ทรัพย์สินที่ไถ่ถอน: {contract.item.name}</div>
                <div className="text-slate-600">{contract.item.description}</div>
                <div className="border-t border-slate-200 pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>๑. เงินต้นที่ไถ่ถอน:</span>
                    <span className="font-mono font-medium">{formatCurrency(contract.redemption.principalPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>๒. ดอกเบี้ยคงค้าง:</span>
                    <span className="font-mono">{formatCurrency(contract.redemption.interestPaid)}</span>
                  </div>
                  {contract.redemption.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>๓. ส่วนลดพิเศษ:</span>
                      <span className="font-mono">-{formatCurrency(contract.redemption.discountAmount)}</span>
                    </div>
                  )}
                  {contract.redemption.extraFee > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>๔. ค่าปรับล่าช้า / ค่าธรรมเนียม:</span>
                      <span className="font-mono">+{formatCurrency(contract.redemption.extraFee)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 text-white p-3 rounded mb-4 flex justify-between items-center text-xs">
                <div>
                  <div className="text-slate-300">ยอดรวมทั้งสิ้นที่ชำระ:</div>
                  <div className="text-lg font-bold font-mono">{formatCurrency(contract.redemption.totalPaid)}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300">ตัวอักษร:</div>
                  <div className="text-amber-300 font-medium">{bahtToText(contract.redemption.totalPaid)}</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-6 bg-emerald-50/50 p-2.5 rounded border border-emerald-100">
                ผู้ขายฝากได้รับมอบทรัพย์สินตามรายการข้างต้นคืนในสภาพเรียบร้อยครบถ้วน ถูกต้องตามความประสงค์แล้ว และไม่ติดใจเรียกร้องสิ่งใดอีกต่อไป
              </p>

              <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-200">
                <div>
                  <div className="h-10 border-b border-dotted border-slate-400 mx-8"></div>
                  <div className="mt-1 font-semibold">({contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName})</div>
                  <div className="text-[11px] text-slate-500">ผู้รับทรัพย์สินคืน</div>
                </div>
                <div>
                  <div className="h-10 border-b border-dotted border-slate-400 mx-8"></div>
                  <div className="mt-1 font-semibold">{contract.redemption.recordedBy}</div>
                  <div className="text-[11px] text-slate-500">ผู้ส่งมอบทรัพย์สิน / เจ้าหน้าที่</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
