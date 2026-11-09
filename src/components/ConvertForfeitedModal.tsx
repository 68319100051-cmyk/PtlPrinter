import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  Laptop,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  Tag,
  ArrowRight
} from 'lucide-react';
import { PawnContract, UserAccount } from '../types/pawn';
import { SecondhandBuyIn, BuyInStatus, CosmeticGrade, NotebookBrand } from '../types/buyIn';
import { formatCurrency, formatThaiDate } from '../utils/thaiFormat';
import { generateNextBuyInNumber } from '../utils/storage';

interface ConvertForfeitedModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: PawnContract;
  currentUser: UserAccount;
  existingBuyIns: SecondhandBuyIn[];
  onConfirmConvert: (updatedContract: PawnContract, newBuyIn: SecondhandBuyIn) => void;
  onNavigateToSecondhand?: () => void;
}

export const ConvertForfeitedModal: React.FC<ConvertForfeitedModalProps> = ({
  isOpen,
  onClose,
  contract,
  currentUser,
  existingBuyIns,
  onConfirmConvert,
  onNavigateToSecondhand,
}) => {
  if (!isOpen) return null;

  const nextBuyInNumber = generateNextBuyInNumber(existingBuyIns);
  const item = contract.item;

  // Determine category
  const defaultCategory: 'laptop' | 'desktop_pc' | 'electronics' =
    item.category === 'notebook'
      ? 'laptop'
      : item.category === 'computer'
      ? 'desktop_pc'
      : 'electronics';

  // Extract specs from pawn item
  const defaultBrand =
    item.notebook?.brand ||
    item.computer?.brandOrCustom ||
    item.printer?.brand ||
    item.phone?.brand ||
    item.itGadget?.brand ||
    'สินค้าไอที';

  const defaultModel =
    item.notebook?.model ||
    item.computer?.modelOrCase ||
    item.printer?.model ||
    item.phone?.model ||
    item.itGadget?.model ||
    item.name;

  const defaultSerial =
    item.notebook?.serialNumber ||
    item.printer?.serialNumber ||
    item.phone?.imei ||
    item.itGadget?.serialNumber ||
    `SN-${contract.contractNumber}`;

  const defaultProcessor =
    item.notebook?.processor || item.computer?.processor || 'มาตรฐาน';

  const defaultRam =
    item.notebook?.ramGb
      ? Number(item.notebook.ramGb) || 8
      : item.computer?.ramGb
      ? Number(item.computer.ramGb) || 16
      : 8;

  const defaultStorage =
    item.notebook?.storage || item.computer?.storage || 'SSD 512GB';

  const defaultGpu =
    item.notebook?.gpu || item.computer?.gpu || 'Integrated / Onboard';

  // Recommended target sale price: either estimated value or loan amount * 1.35
  const recommendedSalePrice = Math.max(
    Math.round((contract.loanAmount * 1.35) / 100) * 100,
    item.estimatedValue ? Math.round(item.estimatedValue * 0.9) : 0
  );

  const [category, setCategory] = useState<'laptop' | 'desktop_pc' | 'electronics'>(defaultCategory);
  const [brand, setBrand] = useState<string>(defaultBrand);
  const [model, setModel] = useState<string>(defaultModel);
  const [serialNumber, setSerialNumber] = useState<string>(defaultSerial);
  const [processor, setProcessor] = useState<string>(defaultProcessor);
  const [ramGb, setRamGb] = useState<number>(defaultRam);
  const [storage, setStorage] = useState<string>(defaultStorage);
  const [gpu, setGpu] = useState<string>(defaultGpu);
  const [hasCharger, setHasCharger] = useState<boolean>(item.notebook?.hasCharger ?? true);
  const [hasBox, setHasBox] = useState<boolean>(true);
  const [hasBag, setHasBag] = useState<boolean>(item.notebook?.hasBag ?? true);

  // Pricing & Stocking fields
  const [purchasePrice, setPurchasePrice] = useState<number>(contract.loanAmount);
  const [targetSalePrice, setTargetSalePrice] = useState<number>(recommendedSalePrice);
  const [cosmeticGrade, setCosmeticGrade] = useState<CosmeticGrade>('A');
  const [status, setStatus] = useState<BuyInStatus>('ready_to_sell');
  const [notes, setNotes] = useState<string>(
    `ทรัพย์สินหลุดจำนำจากสัญญาเลขที่ ${contract.contractNumber} (วันทำสัญญา: ${formatThaiDate(contract.startDate)} - ครบกำหนด: ${formatThaiDate(contract.dueDate)}) กรรมสิทธิ์ขาดตาม พ.ร.บ. ค้าของเก่า`
  );

  const estimatedProfit = targetSalePrice - purchasePrice;
  const profitMarginPercent = purchasePrice > 0 ? Math.round((estimatedProfit / purchasePrice) * 100) : 0;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    if (targetSalePrice <= 0) {
      alert('กรุณาระบุราคาตั้งขายหน้าร้าน');
      return;
    }

    const nowIso = new Date().toISOString();

    // 1. Build SecondhandBuyIn object
    const newBuyIn: SecondhandBuyIn = {
      id: `buy-${Date.now()}`,
      buyInNumber: nextBuyInNumber,
      date: nowIso,
      category,
      notebookSpecs: {
        brand: brand as NotebookBrand,
        model,
        serialNumber: serialNumber.trim().toUpperCase(),
        processor,
        ramGb,
        storage,
        gpu,
        screenSize: item.notebook?.screenSize || '15.6" FHD 144Hz',
        batteryStatus: 'good',
        cosmeticGrade,
        hasCharger,
        hasBox,
        hasBag,
        isICloudOrPasscodeCleared: true,
        checklist: {
          keyboard: true,
          screen: true,
          touchpad: true,
          wifiBluetooth: true,
          webcamMic: true,
          speakers: true,
          usbPorts: true,
          chargingPort: true,
        },
        defectsNotes: `แปลงมาจากสัญญาขายฝากหลุดจำนำ ${contract.contractNumber}`,
      },
      sellerSnapshot: contract.customerSnapshot,
      purchasePrice,
      targetSalePrice,
      paymentMethod: 'cash',
      status,
      photos: item.photos && item.photos.length > 0 ? item.photos : [
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
      ],
      buyerStaff: currentUser.name,
      notes: notes.trim(),
      legalOwnershipDeclaration: true,
      createdAt: nowIso,
    };

    // 2. Update PawnContract status to forfeited and log the conversion
    const updatedContract: PawnContract = {
      ...contract,
      status: 'forfeited',
      forfeitedDate: contract.forfeitedDate || nowIso,
      convertedToBuyInId: nextBuyInNumber,
      amendmentLogs: [
        ...contract.amendmentLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: nowIso,
          authorizedBy: currentUser.name,
          reason: 'แปลงทรัพย์สินหลุดจำนำเข้าสต็อกสินค้ามือสองหน้าร้าน',
          changesSummary: `อนุมัติแปลงเป็นสินค้ามือสอง รหัส ${nextBuyInNumber} ตั้งขายหน้าร้าน ฿${targetSalePrice.toLocaleString()} บาท`,
        },
      ],
    };

    onConfirmConvert(updatedContract, newBuyIn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-print">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>แปลงทรัพย์สินหลุดจำนำ ➔ สินค้ามือสองพร้อมขาย</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30">
                  หลุดจำนำ
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                โอนข้อมูลทรัพย์สินและผู้จำนำเดิมเข้าสู่ระบบสต็อกมือสองทันที โดยไม่ต้องพิมพ์ข้อมูลใหม่
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs text-slate-800">
          
          {/* Transfer Banner (Contract ➔ Secondhand Stock) */}
          <div className="p-3 bg-linear-to-r from-amber-50 to-indigo-50 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-slate-500 font-medium">สัญญาเดิม:</div>
              <div className="font-mono font-bold text-slate-900 truncate">{contract.contractNumber}</div>
              <div className="text-[11px] text-slate-600 truncate">
                ผู้จำนำ: {contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}
              </div>
              <div className="text-[10px] text-slate-500">
                เงินต้นเดิม: <strong className="font-mono text-indigo-700">{formatCurrency(contract.loanAmount)}</strong>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center shrink-0 px-2 text-amber-600">
              <ArrowRight className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase">ย้ายเข้าคลัง</span>
            </div>

            <div className="flex-1 min-w-0 text-right">
              <div className="text-[10px] text-slate-500 font-medium">รหัสสต็อกมือสองใหม่:</div>
              <div className="font-mono font-bold text-amber-600 text-sm truncate">{nextBuyInNumber}</div>
              <div className="text-[11px] text-emerald-700 font-medium truncate">
                สิทธิ์ขาดตาม พ.ร.บ. ค้าของเก่า
              </div>
              <div className="text-[10px] text-slate-500">
                วันแปลงเข้าคลัง: วันนี้
              </div>
            </div>
          </div>

          {/* Section 1: Pre-filled Hardware Specs */}
          <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2.5">
            <div className="font-bold text-slate-900 flex items-center justify-between border-b pb-1.5">
              <div className="flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-indigo-600" />
                <span>ข้อมูลเครื่องและสเปก (ดึงจากสัญญาจำนำเดิมอัตโนมัติ)</span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal">ตรวจสอบหรือแก้ไขได้</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">หมวดหมู่</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="laptop">โน้ตบุ๊ก (Laptop)</option>
                  <option value="desktop_pc">คอมพิวเตอร์ตั้งโต๊ะ (PC)</option>
                  <option value="electronics">อุปกรณ์ไอที / ปริ้นเตอร์</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">ยี่ห้อ / แบรนด์</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">รุ่น (Model)</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Serial Number / IMEI</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">ซีพียู (Processor)</label>
                <input
                  type="text"
                  value={processor}
                  onChange={(e) => setProcessor(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">แรม (RAM GB)</label>
                <input
                  type="number"
                  value={ramGb}
                  onChange={(e) => setRamGb(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">ความจุ (Storage)</label>
                <input
                  type="text"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 mb-1 font-medium">การ์ดจอ (GPU)</label>
                <input
                  type="text"
                  value={gpu}
                  onChange={(e) => setGpu(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Accessories checkboxes */}
            <div className="flex flex-wrap gap-4 pt-1 text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCharger}
                  onChange={(e) => setHasCharger(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>มีสายชาร์จ / อะแดปเตอร์แท้</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBag}
                  onChange={(e) => setHasBag(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>มีกระเป๋า</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBox}
                  onChange={(e) => setHasBox(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>มีกล่องบรรจุภัณฑ์</span>
              </label>
            </div>
          </div>

          {/* Section 2: Pricing, Cosmetic Grading & Stock Status */}
          <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-3.5 space-y-3">
            <div className="font-bold text-slate-900 flex items-center justify-between border-b border-amber-200 pb-1.5">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>การตั้งราคาขายหน้าร้านและสถานะสต็อก</span>
              </div>
              <span className="text-[11px] text-amber-800 font-semibold">
                กำไรคาดการณ์: +฿{estimatedProfit.toLocaleString()} ({profitMarginPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  ต้นทุนรับซื้อเข้าคลัง (บาท)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-500 font-bold">฿</span>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500">เงินต้นสัญญาเดิมที่ปล่อยกู้ไป</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-emerald-800">
                  ราคาตั้งขายหน้าร้าน (Target Sale Price) *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-emerald-600 font-bold">฿</span>
                  <input
                    type="number"
                    step={100}
                    value={targetSalePrice}
                    onChange={(e) => setTargetSalePrice(Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border-2 border-emerald-400 rounded-lg font-mono font-bold text-emerald-700 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">ราคาป้ายขายหน้าร้าน</span>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  เกรดสภาพความสวยงาม
                </label>
                <select
                  value={cosmeticGrade}
                  onChange={(e) => setCosmeticGrade(e.target.value as CosmeticGrade)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                >
                  <option value="A">เกรด A (สวยกริ๊บ 95%+ ไม่มีรอยหนัก)</option>
                  <option value="B">เกรด B (สภาพดี มีรอยขนแมวตามการใช้งาน)</option>
                  <option value="C">เกรด C (มีรอยบุบ / ถลอกเล็กน้อย)</option>
                  <option value="D">เกรด D (มีตำหนิเฉพาะจุด)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  สถานะสินค้าในสต็อก
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BuyInStatus)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                >
                  <option value="ready_to_sell">พร้อมวางขายหน้าร้านทันที (Ready to Sell) ⭐</option>
                  <option value="in_stock">เก็บเข้าคลังสต็อกก่อน (In Stock)</option>
                  <option value="under_repair">ส่งช่างตรวจเช็ค/ลงโปรแกรมใหม่ (Under Repair)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  บันทึกประวัติที่มาที่ไปของเครื่อง
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Legal Compliance Notice */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>ความถูกต้องตามกฎหมาย:</strong> เมื่อสัญญาจำนำพ้นกำหนดระยะเวลาและระยะผ่อนผัน 15 วัน ทรัพย์สินจะตกเป็นกรรมสิทธิ์ของร้านตามประมวลกฎหมายแพ่งและพาณิชย์ และข้อมูลผู้จำนำเดิมจะถูกบันทึกเป็นหลักฐานผู้ส่งมอบในสมุดทะเบียนรับซื้อของเก่าตาม พ.ร.บ. ค้าของเก่า พ.ศ. ๒๔๗๔
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>ยืนยันแปลงเป็นสินค้ามือสอง (บันทึกเข้าสต็อกทันที)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
