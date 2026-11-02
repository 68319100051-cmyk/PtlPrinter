import React, { useState } from 'react';
import { X, Check, Award, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PawnContract, ShopSettings, UserAccount } from '../types/pawn';
import { formatCurrency, formatThaiDate, getDaysRemaining, bahtToText, formatCitizenId } from '../utils/thaiFormat';

interface RedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: PawnContract;
  settings: ShopSettings;
  currentUser: UserAccount;
  onRedeemSuccess: (updatedContract: PawnContract) => void;
}

export const RedemptionModal: React.FC<RedemptionModalProps> = ({
  isOpen,
  onClose,
  contract,
  settings,
  currentUser,
  onRedeemSuccess,
}) => {
  const daysDiff = getDaysRemaining(contract.dueDate);
  const isOverdue = daysDiff < 0;
  const overdueDays = isOverdue ? Math.abs(daysDiff) : 0;

  // Accrued interest estimation (1 month if not overdue, or pro-rated / overdue fee)
  const monthlyInterest = (contract.loanAmount * contract.monthlyInterestRate) / 100;
  const [interestPaid, setInterestPaid] = useState<number>(monthlyInterest);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const initialLateFee = isOverdue ? Math.min(overdueDays * (settings.lateFeePerDay || 50), 1000) : 0;
  const [extraFee, setExtraFee] = useState<number>(initialLateFee);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const totalPaid = Math.max(0, contract.loanAmount + interestPaid + extraFee - discountAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const thaiYear = String(now.getFullYear() + 543).slice(-2);
    const receiptSeq = String(Math.floor(1000 + Math.random() * 9000));
    const receiptNumber = `RD-${thaiYear}${receiptSeq}`;

    const updatedContract: PawnContract = {
      ...contract,
      status: 'redeemed',
      redemption: {
        redeemDate: new Date().toISOString(),
        receiptNumber,
        principalPaid: contract.loanAmount,
        interestPaid,
        discountAmount,
        extraFee,
        totalPaid,
        recordedBy: currentUser.name,
        paymentMethod,
      },
    };

    onRedeemSuccess(updatedContract);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-linear-to-r from-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">ไถ่ถอนทรัพย์สิน / สิ้นสุดสัญญา</h3>
              <p className="text-xs text-emerald-200">สัญญาเลขที่: <span className="font-mono font-medium">{contract.contractNumber}</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Item & Customer Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-500">ผู้ไถ่ถอน: </span>
                <strong className="text-slate-900 text-sm">{contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</strong>
                <div className="text-slate-500 font-mono mt-0.5">บัตร ปชช. {formatCitizenId(contract.customerSnapshot.citizenId)}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-500">ที่จัดเก็บ: </span>
                <span className="font-medium text-slate-800">{contract.storageLocation || 'ตู้นิรภัยร้าน'}</span>
              </div>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <div className="font-bold text-slate-900 text-sm">{contract.item.name}</div>
              <div className="text-slate-600 mt-0.5">{contract.item.description}</div>
              {contract.item.gold && (
                <div className="text-amber-800 font-medium mt-1">
                  ทองคำ {contract.item.gold.purity} | น้ำหนัก {contract.item.gold.weightBaht} บาท ({contract.item.gold.weightGram} กรัม)
                </div>
              )}
            </div>
          </div>

          {isOverdue && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>สัญญาเกินกำหนด {overdueDays} วัน</strong> (เลยกำหนดส่งมอบ แต่ยังอยู่ในการพิจารณาไถ่ถอนคืน)
              </div>
            </div>
          )}

          {/* Breakdown */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
              <span>๑. ยอดเงินต้นที่ต้องชำระคืน:</span>
              <span className="font-mono text-base">{formatCurrency(contract.loanAmount)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">๒. ดอกเบี้ยคงค้าง ({contract.monthlyInterestRate}% / เดือน):</span>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={interestPaid}
                  onChange={(e) => setInterestPaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 text-right font-mono rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">๓. ค่าปรับล่าช้า / ค่าธรรมเนียม (ถ้ามี):</span>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={extraFee}
                  onChange={(e) => setExtraFee(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 text-right font-mono rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-emerald-700">
              <span>๔. ส่วนลดพิเศษ (หักลบ):</span>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 text-right font-mono rounded-lg border border-slate-300 bg-white text-emerald-700"
                />
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-slate-300 flex justify-between items-center text-slate-900">
              <div>
                <span className="text-xs text-slate-500 block">ยอดรวมทั้งสิ้นที่ลูกค้าต้องชำระ:</span>
                <span className="text-xs text-slate-400 font-medium">({bahtToText(totalPaid)})</span>
              </div>
              <span className="text-2xl font-mono font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">ช่องทางการรับเงิน:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
                  paymentMethod === 'cash' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                เงินสด (Cash)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
                  paymentMethod === 'transfer' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                โอนเงินเข้าบัญชี (Transfer)
              </button>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              เมื่อกดบันทึกไถ่ถอน สัญญานี้จะถูกปิดรายการ นำทรัพย์สินออกจากระบบ และพิมพ์ใบเสร็จรับเงินไถ่ถอนส่งมอบทรัพย์สินคืนลูกค้า
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              ยืนยันการรับเงินไถ่ถอน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
