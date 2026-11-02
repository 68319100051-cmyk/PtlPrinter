import React, { useState } from 'react';
import { BarChart3, Calendar, Printer, ArrowDownRight, ArrowUpRight, DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { PawnContract, ShopSettings } from '../types/pawn';
import { formatCurrency, formatThaiDate, getDaysRemaining } from '../utils/thaiFormat';

interface ReportsViewProps {
  contracts: PawnContract[];
  archivedContracts?: PawnContract[];
  settings: ShopSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  contracts,
  archivedContracts = [],
  settings,
}) => {
  // Date range presets
  const todayIso = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [dateFilterMode, setDateFilterMode] = useState<'today' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(todayIso);

  const handleSelectPreset = (mode: 'today' | 'month') => {
    setDateFilterMode(mode);
    if (mode === 'today') {
      setStartDate(todayIso);
      setEndDate(todayIso);
    } else if (mode === 'month') {
      setStartDate(firstDayOfMonth);
      setEndDate(todayIso);
    }
  };

  // Combine active and archived contracts for comprehensive ledger reporting
  const allContracts = [...contracts, ...archivedContracts];

  // 1. New Loans issued in date range (Cash Out)
  const newLoans = allContracts.filter(c => {
    const d = c.startDate;
    return d >= startDate && d <= endDate;
  });
  const totalCashOutNewLoans = newLoans.reduce((sum, c) => sum + c.loanAmount, 0);

  // 2. Interest Payments collected in date range (Cash In)
  const interestCollectedList: {
    contract: PawnContract;
    payment: typeof allContracts[0]['interestPayments'][0];
  }[] = [];

  allContracts.forEach(c => {
    c.interestPayments.forEach(p => {
      const pDate = p.date.split('T')[0];
      if (pDate >= startDate && pDate <= endDate) {
        interestCollectedList.push({ contract: c, payment: p });
      }
    });
  });

  const totalInterestIncome = interestCollectedList.reduce((sum, item) => sum + item.payment.totalPaid, 0);
  const totalLateFeesFromInterest = interestCollectedList.reduce((sum, item) => sum + item.payment.lateFee, 0);

  // 3. Redemptions in date range (Cash In)
  const redemptionsInPeriod = allContracts.filter(c => {
    if (!c.redemption) return false;
    const rDate = c.redemption.redeemDate.split('T')[0];
    return rDate >= startDate && rDate <= endDate;
  });

  const totalPrincipalRedeemed = redemptionsInPeriod.reduce((sum, c) => sum + (c.redemption?.principalPaid || 0), 0);
  const totalInterestFromRedemption = redemptionsInPeriod.reduce((sum, c) => sum + (c.redemption?.interestPaid || 0), 0);
  const totalFeesFromRedemption = redemptionsInPeriod.reduce((sum, c) => sum + (c.redemption?.extraFee || 0), 0);
  const totalCashInRedemptions = redemptionsInPeriod.reduce((sum, c) => sum + (c.redemption?.totalPaid || 0), 0);

  // Financial Balances
  const totalCashIn = totalInterestIncome + totalCashInRedemptions;
  const netCashFlow = totalCashIn - totalCashOutNewLoans;
  const netProfitRevenue = totalInterestIncome + totalInterestFromRedemption + totalLateFeesFromInterest + totalFeesFromRedemption;

  // Contracts Due / Overdue Watchlist
  const contractsDueSoon = contracts.filter(c => {
    if (c.status !== 'active' && c.status !== 'due_soon') return false;
    const days = getDaysRemaining(c.dueDate);
    return days >= 0 && days <= 7;
  });

  const contractsOverdue = contracts.filter(c => {
    if (c.status === 'redeemed' || c.status === 'forfeited') return false;
    return getDaysRemaining(c.dueDate) < 0;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">สรุปบัญชีรายรับ-รายจ่าย ประจำวันและประจำเดือน</h2>
            <p className="text-xs text-slate-500">วิเคราะห์กระแสเงินสด ยอดปล่อยกู้ และดอกเบี้ยรับตามช่วงเวลา</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => handleSelectPreset('today')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                dateFilterMode === 'today' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ประจำวันนี้
            </button>
            <button
              onClick={() => handleSelectPreset('month')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                dateFilterMode === 'month' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ประจำเดือนนี้
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
            <span className="text-slate-500">ตั้งแต่:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setDateFilterMode('custom'); }}
              className="bg-transparent font-mono text-xs text-slate-800 focus:outline-none"
            />
            <span className="text-slate-500">ถึง:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setDateFilterMode('custom'); }}
              className="bg-transparent font-mono text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            พิมพ์รายงาน
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="print-only hidden text-center mb-6 pb-4 border-b-2 border-slate-900">
        <h1 className="text-xl font-bold">{settings.shopName}</h1>
        <p className="text-xs text-slate-700">{settings.branchName} · โทร. {settings.phone}</p>
        <h2 className="text-base font-bold mt-2">รายงานสรุปบัญชีรายรับ-รายจ่ายและการรับขายฝาก</h2>
        <p className="text-xs text-slate-600 font-mono">
          ช่วงระหว่างวันที่: {formatThaiDate(startDate)} ถึง {formatThaiDate(endDate)}
        </p>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash In */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">รายรับรวม (Cash In)</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">
            {formatCurrency(totalCashIn)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
            <div>ต่อดอก: {formatCurrency(totalInterestIncome)}</div>
            <div>ไถ่ถอน: {formatCurrency(totalCashInRedemptions)}</div>
          </div>
        </div>

        {/* Cash Out */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">รายจ่ายเงินทุนปล่อยกู้ (Cash Out)</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-2">
            {formatCurrency(totalCashOutNewLoans)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            เปิดสัญญาใหม่ {newLoans.length} รายการ
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">กระแสเงินสดสุทธิ (Net Flow)</span>
            <div className={`p-2 rounded-xl ${netCashFlow >= 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 ${netCashFlow >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
            {formatCurrency(netCashFlow)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {netCashFlow >= 0 ? 'เงินสดไหลเข้าสุทธิ' : 'เงินทุนหมุนเวียนปล่อยกู้'}
          </div>
        </div>

        {/* Gross Revenue / Yield */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">รายได้ดอกเบี้ย & ค่าธรรมเนียม</span>
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold">
              ฿
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">
            {formatCurrency(netProfitRevenue)}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            ผลตอบแทนสุทธิประจำงวด
          </div>
        </div>
      </div>

      {/* Tabular Lists: 3 Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: สัญญาที่เปิดใหม่ในงวด */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              รายการรับจำนำขายฝากใหม่ ({newLoans.length} รายการ)
            </h3>
            <span className="text-xs font-mono font-bold text-rose-600">{formatCurrency(totalCashOutNewLoans)}</span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-200">
                  <th className="py-2">สัญญา</th>
                  <th className="py-2">ลูกค้า</th>
                  <th className="py-2">ทรัพย์สิน</th>
                  <th className="py-2 text-right">เงินต้นจ่ายออก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {newLoans.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2 font-mono font-medium text-indigo-700">{c.contractNumber}</td>
                    <td className="py-2 text-slate-800">{c.customerSnapshot.firstName} {c.customerSnapshot.lastName}</td>
                    <td className="py-2 text-slate-600 truncate max-w-[140px]">{c.item.name}</td>
                    <td className="py-2 text-right font-mono font-semibold text-rose-600">{formatCurrency(c.loanAmount)}</td>
                  </tr>
                ))}
                {newLoans.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      ไม่มีรายการเปิดสัญญาใหม่ในช่วงวันที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: รายการต่อดอกเบี้ยในงวด */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              รายการต่อดอกเบี้ย ({interestCollectedList.length} รายการ)
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-600">{formatCurrency(totalInterestIncome)}</span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-200">
                  <th className="py-2">ใบเสร็จ</th>
                  <th className="py-2">สัญญา</th>
                  <th className="py-2">จำนวนเดือน</th>
                  <th className="py-2 text-right">ดอกเบี้ยรับ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interestCollectedList.map(item => (
                  <tr key={item.payment.id} className="hover:bg-slate-50">
                    <td className="py-2 font-mono text-slate-800">{item.payment.receiptNumber}</td>
                    <td className="py-2 font-mono font-medium text-indigo-700">{item.contract.contractNumber}</td>
                    <td className="py-2 text-slate-600">{item.payment.monthsPaid} เดือน ({item.payment.paymentMethod === 'cash' ? 'เงินสด' : 'โอน'})</td>
                    <td className="py-2 text-right font-mono font-semibold text-emerald-600">{formatCurrency(item.payment.totalPaid)}</td>
                  </tr>
                ))}
                {interestCollectedList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      ไม่มีรายการต่อดอกเบี้ยในช่วงวันที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Overdue & Due Soon Watchlist Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">สัญญาที่ต้องติดตาม (ใกล้ครบกำหนด & เลยกำหนด)</h3>
            <p className="text-xs text-slate-500">ช่วยป้องกันข้อผิดพลาดและแจ้งเตือนสินค้าก่อนหลุดจำนำ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Due Soon */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                กำลังจะครบกำหนดใน 7 วัน ({contractsDueSoon.length} รายการ)
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {contractsDueSoon.map(c => {
                const days = getDaysRemaining(c.dueDate);
                return (
                  <div key={c.id} className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-900">{c.contractNumber} · {c.customerSnapshot.firstName}</div>
                      <div className="text-[11px] text-slate-500">{c.item.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-700">{days === 0 ? 'ครบกำหนดวันนี้!' : `เหลืออีก ${days} วัน`}</div>
                      <div className="text-[10px] text-slate-500">{formatThaiDate(c.dueDate)}</div>
                    </div>
                  </div>
                );
              })}
              {contractsDueSoon.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-400">ไม่มีสัญญาที่กำลังจะครบกำหนดใน 7 วัน</div>
              )}
            </div>
          </div>

          {/* Overdue */}
          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                เกินกำหนดไถ่ถอน / รอพิจารณายึดหลุด ({contractsOverdue.length} รายการ)
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {contractsOverdue.map(c => {
                const overdue = Math.abs(getDaysRemaining(c.dueDate));
                return (
                  <div key={c.id} className="bg-white p-2.5 rounded-lg border border-rose-200 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-900">{c.contractNumber} · {c.customerSnapshot.firstName}</div>
                      <div className="text-[11px] text-slate-500">โทร: {c.customerSnapshot.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-rose-600">เกิน {overdue} วัน</div>
                      <div className="text-[10px] text-slate-500">เงินต้น: {formatCurrency(c.loanAmount)}</div>
                    </div>
                  </div>
                );
              })}
              {contractsOverdue.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-400">ไม่มีสัญญาที่ค้างเกินกำหนด</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
