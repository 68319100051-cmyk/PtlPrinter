import React, { useRef } from 'react';
import { Printer, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SecondhandBuyIn } from '../types/buyIn';
import { ShopSettings } from '../types/pawn';
import { formatThaiDate, thaiBahtText } from '../utils/thaiFormat';

interface PrintBuyInAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyIn: SecondhandBuyIn;
  settings: ShopSettings;
}

export const PrintBuyInAgreementModal: React.FC<PrintBuyInAgreementModalProps> = ({
  isOpen,
  onClose,
  buyIn,
  settings,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = formatThaiDate(buyIn.date || buyIn.createdAt);
  const seller = buyIn.sellerSnapshot;
  const nb = buyIn.notebookSpecs;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Controls (Hidden on Print) */}
        <div className="no-print p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                พิมพ์สัญญาซื้อขายโน็ตบุ้คมือสอง & ใบรับซื้อของเก่า
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                เลขที่บันทึก: {buyIn.buyInNumber} · ผู้ขาย: {seller.prefix}{seller.firstName} {seller.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            className="print-area bg-white w-full max-w-[760px] p-6 sm:p-8 rounded-xl shadow-xs border border-slate-200 text-slate-900 text-xs sm:text-[13px] leading-relaxed relative font-sans"
          >
            {/* Header / Brand */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                    {settings.shopName}
                  </h1>
                  <p className="text-xs text-slate-600">
                    {settings.branchName} · เลขประจำตัวผู้เสียภาษี: {settings.taxId}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {settings.address} · โทร: {settings.phone} {settings.lineId ? `· Line: ${settings.lineId}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-sm mb-1 uppercase tracking-wide">
                    ใบรับซื้อของเก่า / สัญญาซื้อขาย
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-800">
                    เลขที่: {buyIn.buyInNumber}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    วันที่: {formattedDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-3">
              <h2 className="text-base font-bold text-slate-900 underline decoration-slate-400 underline-offset-4">
                หนังสือสัญญาซื้อขายสินค้าใช้แล้ว และหลักฐานการรับซื้อของเก่า
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                (ตาม พ.ร.บ. ควบคุมการขายทอดตลาดและค้าของเก่า พ.ศ. ๒๔๗๔)
              </p>
            </div>

            {/* Parties Intro */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 my-3 text-xs leading-relaxed">
              <p>
                สัญญาฉบับนี้ทำขึ้น ณ <strong>{settings.shopName}</strong> เมื่อวันที่ <strong>{formattedDate}</strong> ระหว่าง:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
                <div>
                  <span className="font-bold text-slate-700">ผู้ขาย (เจ้าของเดิม):</span>
                  <p className="font-semibold text-slate-900">{seller.prefix}{seller.firstName} {seller.lastName}</p>
                  <p className="text-slate-600">เลขบัตรประชาชน: <span className="font-mono font-medium">{seller.citizenId}</span></p>
                  <p className="text-slate-600">เบอร์โทรศัพท์: <span className="font-mono">{seller.phone}</span></p>
                  <p className="text-slate-600 text-[11px]">ที่อยู่: {seller.address}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-700">ผู้รับซื้อ (ผู้ประกอบการ):</span>
                  <p className="font-semibold text-slate-900">{settings.shopName}</p>
                  <p className="text-slate-600">โดย: {buyIn.buyerStaff || settings.ownerName || 'ตัวแทนร้าน'}</p>
                  <p className="text-slate-600">โทร: <span className="font-mono">{settings.phone}</span></p>
                  <p className="text-slate-600 text-[11px]">ที่อยู่: {settings.address}</p>
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div className="my-3 border border-slate-300 rounded-lg overflow-hidden">
              <div className="bg-slate-800 text-white font-bold px-3 py-1.5 text-xs flex justify-between items-center">
                <span>รายละเอียดสินค้าที่รับซื้อ (เครื่องคอมพิวเตอร์โน็ตบุ้ค / แล็ปท็อป)</span>
                <span className="text-[11px] font-mono text-amber-300 font-normal">S/N: {nb.serialNumber}</span>
              </div>
              <div className="p-3 bg-white text-xs space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-500 text-[11px]">ยี่ห้อ (Brand):</span>
                    <p className="font-bold text-slate-900">{nb.brand}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">รุ่น (Model):</span>
                    <p className="font-bold text-slate-900">{nb.model}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">หมายเลขประจำเครื่อง (S/N):</span>
                    <p className="font-mono font-bold text-slate-900">{nb.serialNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">เกรดสภาพภายนอก:</span>
                    <p className="font-bold text-slate-900">เกรด {nb.cosmeticGrade}</p>
                  </div>
                </div>

                {/* Specs Box */}
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">ซีพียู (Processor):</span>
                    <p className="font-medium text-slate-800">{nb.processor}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">หน่วยความจำ (RAM):</span>
                    <p className="font-medium text-slate-800">{nb.ramGb} GB</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ความจุ (Storage):</span>
                    <p className="font-medium text-slate-800">{nb.storage}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">การ์ดจอ (Graphics):</span>
                    <p className="font-medium text-slate-800">{nb.gpu}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ขนาดจอภาพ (Screen):</span>
                    <p className="font-medium text-slate-800">{nb.screenSize}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">สถานะแบตเตอรี่:</span>
                    <p className="font-medium text-slate-800">
                      {nb.batteryStatus === 'good' ? 'เก็บไฟดี (>2 ชม.)' :
                       nb.batteryStatus === 'fair' ? 'พอใช้ (1-2 ชม.)' :
                       nb.batteryStatus === 'poor' ? 'แบตเสื่อม (<30 นาที)' : 'ต้องเสียบสายชาร์จตลอด'}
                    </p>
                  </div>
                </div>

                {/* Accessories & Checklist */}
                <div className="text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <span className="font-medium text-slate-700">อุปกรณ์ที่ส่งมอบด้วย:</span>
                    <p className="text-slate-600">
                      {[
                        nb.hasCharger ? 'สายชาร์จ/อะแดปเตอร์แท้' : null,
                        nb.hasBag ? 'กระเป๋าใส่โน็ตบุ้ค' : null,
                        nb.hasBox ? 'กล่องบรรจุภัณฑ์' : null,
                      ].filter(Boolean).join(', ') || 'เฉพาะตัวเครื่อง'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">การปลดล็อคระบบความปลอดภัย:</span>
                    <p className="text-slate-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {nb.isICloudOrPasscodeCleared
                        ? 'ปลดล็อค Apple ID / Microsoft / BIOS Password ครบถ้วนแล้ว'
                        : 'ไม่ได้ลงทะเบียนรหัสล็อค'}
                    </p>
                  </div>
                </div>

                {nb.defectsNotes && (
                  <div className="text-[11px] bg-amber-50/70 p-2 rounded border border-amber-200 text-amber-900">
                    <strong>บันทึกสภาพ/ตำหนิ:</strong> {nb.defectsNotes}
                  </div>
                )}
              </div>
            </div>

            {/* Price & Payment */}
            <div className="my-3 p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-2">
              <div>
                <span className="text-xs text-emerald-800 font-medium">จำนวนเงินที่ตกลงซื้อขายและจ่ายให้ผู้ขาย:</span>
                <p className="text-xs text-emerald-700 font-medium italic">
                  ({thaiBahtText(buyIn.purchasePrice)})
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-700 mr-2">
                  ชำระโดย: {buyIn.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงินเข้าบัญชี'}
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-800">
                  ฿{buyIn.purchasePrice.toLocaleString()}.-
                </span>
              </div>
            </div>

            {/* Legal Warranty Clause */}
            <div className="my-3 p-3 bg-slate-50 border border-slate-300 rounded-lg text-[10.5px] leading-relaxed text-slate-700 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ข้อกำหนดและคำรับรองความถูกต้องของผู้ขาย (Legal Declaration)</span>
              </div>
              <p>
                ๑. ผู้ขายขอรับรองและยืนยันว่า ทรัพย์สินโน็ตบุ้คและอุปกรณ์ตามสัญญานี้ เป็นกรรมสิทธิ์ของผู้ขายโดยชอบด้วยกฎหมายแต่เพียงผู้เดียว มิได้เป็นของที่ได้มาจากการกระทำความผิดทางอาญา ลักทรัพย์ ปล้นทรัพย์ วิ่งราวทรัพย์ ยักยอกทรัพย์ หรือโจรกรรมมาแต่ประการใด
              </p>
              <p>
                ๒. ผู้ขายตกลงส่งมอบกรรมสิทธิ์ในทรัพย์สินดังกล่าวให้แก่ผู้รับซื้อโดยเด็ดขาด นับแต่วันที่ลงนามในสัญญานี้ และผู้ขายได้รับเงินค่าสินค้าครบถ้วนถูกต้องแล้ว
              </p>
              <p>
                ๓. หากปรากฏในภายหลังว่าทรัพย์สินนี้มีเจ้าของที่แท้จริงรายอื่น หรือเกี่ยวข้องกับการกระทำความผิดกฎหมาย ผู้ขายยินยอมรับผิดชอบชดใช้ค่าเสียหาย คืนเงิน และยินยอมรับโทษตามกฎหมายทั้งทางแพ่งและทางอาญาทุกประการ โดยผู้รับซื้อไม่มีส่วนเกี่ยวข้องใดๆ
              </p>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="flex flex-col items-center">
                <div className="w-48 border-b border-slate-700 border-dotted mb-2 h-10"></div>
                <p className="font-semibold text-slate-900">
                  ( {seller.prefix}{seller.firstName} {seller.lastName} )
                </p>
                <p className="text-[11px] text-slate-500">ผู้ขาย / ผู้รับเงิน</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  เลขบัตร ปชช. {seller.citizenId}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-48 border-b border-slate-700 border-dotted mb-2 h-10"></div>
                <p className="font-semibold text-slate-900">
                  ( {buyIn.buyerStaff || settings.ownerName || 'คุณชัยกร'} )
                </p>
                <p className="text-[11px] text-slate-500">ผู้รับซื้อ / ตัวแทนร้านพัทลุงปริ้นเตอร์</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  วันที่ {formattedDate}
                </p>
              </div>
            </div>

            {/* Footer stamp */}
            <div className="mt-6 pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400">
              เอกสารบันทึกบัญชีสำหรับคนค้าของเก่า · พัทลุงปริ้นเตอร์ คอมพิวเตอร์ & รับจำนำขายฝาก
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
