import React, { useState } from 'react';
import { X, Check, Calendar, ArrowRight, Printer, AlertTriangle } from 'lucide-react';
import { PawnContract, InterestPayment, ShopSettings, UserAccount } from '../types/pawn';
import { formatCurrency, formatThaiDate, getDaysRemaining, addMonthsToDate, formatCitizenId } from '../utils/thaiFormat';

interface InterestPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: PawnContract;
  settings: ShopSettings;
  currentUser: UserAccount;
  onPaymentSuccess: (updatedContract: PawnContract, newPayment: InterestPayment) => void;
}

export const InterestPaymentModal: React.FC<InterestPaymentModalProps> = ({
  isOpen,
  onClose,
  contract,
  settings,
  currentUser,
  onPaymentSuccess,
}) => {
  const [monthsPaid, setMonthsPaid] = useState<number>(1);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const daysDiff = getDaysRemaining(contract.dueDate);
  const isOverdue = daysDiff < 0;
  const overdueDays = isOverdue ? Math.abs(daysDiff) : 0;

  // Auto calculate suggested late fee if overdue
  const initialLateFee = isOverdue ? Math.min(overdueDays * (settings.lateFeePerDay || 50), 1000) : 0;
  const [lateFee, setLateFee] = useState<number>(initialLateFee);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const monthlyInterest = (contract.loanAmount * contract.monthlyInterestRate) / 100;
  const baseInterest = monthlyInterest * monthsPaid;
  const totalPaid = Math.max(0, baseInterest + lateFee - discountAmount);

  // Calculate new due date by adding months to current due date
  const newDueDate = addMonthsToDate(contract.dueDate, monthsPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const thaiYear = String(now.getFullYear() + 543).slice(-2);
    const receiptSeq = String(Math.floor(1000 + Math.random() * 9000));
    const receiptNumber = `RC-${thaiYear}${receiptSeq}`;

    const newPayment: InterestPayment = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      date: new Date().toISOString(),
      monthsPaid,
      ratePercent: contract.monthlyInterestRate,
      interestAmount: baseInterest,
      discountAmount,
      lateFee,
      totalPaid,
      previousDueDate: contract.dueDate,
      newDueDate,
      recordedBy: currentUser.name,
      paymentMethod,
      note: note.trim() || undefined,
    };

    // Calculate new status
    const remainingDaysNew = getDaysRemaining(newDueDate);
    let newStatus = contract.status;
    if (remainingDaysNew > 7) {
      newStatus = 'active';
    } else if (remainingDaysNew >= 0) {
      newStatus = 'due_soon';
    } else {
      newStatus = 'overdue';
    }

    const updatedContract: PawnContract = {
      ...contract,
      dueDate: newDueDate,
      status: newStatus,
      interestPayments: [...contract.interestPayments, newPayment],
    };

    onPaymentSuccess(updatedContract, newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-linear-to-r from-indigo-800 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500 text-white shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">ต่อดอกเบี้ย / ขยายระยะเวลาสัญญา</h3>
              <p className="text-xs text-indigo-200">สัญญาเลขที่: <span className="font-mono font-medium">{contract.contractNumber}</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer & Item Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-500">ลูกค้า: </span>
                <strong className="text-slate-900">{contract.customerSnapshot.prefix}{contract.customerSnapshot.firstName} {contract.customerSnapshot.lastName}</strong>
                <span className="text-slate-500 font-mono ml-2">({formatCitizenId(contract.customerSnapshot.citizenId)})</span>
              </div>
              <div className="font-mono text-slate-700 font-semibold">
                ยอดเงินต้น: {formatCurrency(contract.loanAmount)}
              </div>
            </div>
            <div className="text-slate-700">
              <span className="text-slate-500">ทรัพย์สิน: </span>
              <strong>{contract.item.name}</strong>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500">อัตราดอกเบี้ย: {contract.monthlyInterestRate}% / เดือน (เดือนละ {formatCurrency(monthlyInterest)})</span>
              <span className="text-slate-600">
                วันครบกำหนดเดิม: <strong className="text-rose-600">{formatThaiDate(contract.dueDate)}</strong>
              </span>
            </div>
          </div>

          {/* Overdue Warning */}
          {isOverdue && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>สัญญาเกินกำหนด {overdueDays} วัน</strong> (ระบบคำนวณค่าปรับล่าช้าอัตโนมัติ สามารถปรับลดได้ตามนโยบายร้าน)
              </div>
            </div>
          )}

          {/* Months selector & new due date preview */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1.5">
                เลือกจำนวนเดือนที่ต้องการต่อดอก
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonthsPaid(m)}
                    className={`py-2 rounded-lg font-medium text-xs transition-colors ${
                      monthsPaid === m
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {m} เดือน
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1.5">
                วันครบกำหนดสัญญาใหม่
              </label>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                <div className="text-[11px] text-indigo-700">ขยายเวลาต่อไปจนถึง</div>
                <div className="text-base font-bold text-indigo-950 font-mono mt-0.5">
                  {formatThaiDate(newDueDate, true)}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing calculations */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">ค่าดอกเบี้ย ({monthsPaid} เดือน @ {contract.monthlyInterestRate}%):</span>
              <span className="font-mono font-medium">{formatCurrency(baseInterest)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">ค่าปรับล่าช้า (ถ้ามี):</span>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={lateFee}
                  onChange={(e) => setLateFee(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 text-right font-mono rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-emerald-700">
              <span>ส่วนลดดอกเบี้ยพิเศษ:</span>
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

            <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>ยอดเงินรับชำระสุทธิ:</span>
              <span className="text-xl font-mono text-indigo-600">{formatCurrency(totalPaid)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">ช่องทางการชำระเงิน:</span>
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
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              บันทึกรับเงินต่อดอก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
