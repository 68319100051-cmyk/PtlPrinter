import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Lock,
  Unlock,
  Printer,
  CreditCard,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Eye,
  Plus,
  Laptop,
  Monitor,
  Cpu,
  Smartphone,
  HardDrive,
  Package,
  ShieldAlert,
  FileText,
  UserCheck,
  Camera,
  QrCode as QrIcon
} from 'lucide-react';
import { PawnContract, ContractStatus, ItemCategory, ShopSettings, UserAccount } from '../types/pawn';
import { formatCurrency, formatThaiDate, getDaysRemaining, formatCitizenId, formatPhone, formatDurationText } from '../utils/thaiFormat';

interface WorkstationProps {
  contracts: PawnContract[];
  settings: ShopSettings;
  currentUser: UserAccount;
  onOpenNewContract: () => void;
  onOpenInterestModal: (contract: PawnContract) => void;
  onOpenRedeemModal: (contract: PawnContract) => void;
  onOpenPrintModal: (contract: PawnContract, mode?: any) => void;
  onRequestEditContract: (contract: PawnContract) => void;
  onForfeitContract: (contract: PawnContract) => void;
  onOpenScanner?: () => void;
  onOpenPrintCustomerTag?: (contract: PawnContract) => void;
}

export const Workstation: React.FC<WorkstationProps> = ({
  contracts,
  settings,
  currentUser,
  onOpenNewContract,
  onOpenInterestModal,
  onOpenRedeemModal,
  onOpenPrintModal,
  onRequestEditContract,
  onForfeitContract,
  onOpenScanner,
  onOpenPrintCustomerTag,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedContractId, setSelectedContractId] = useState<string>(contracts[0]?.id || '');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'detail'>('list');

  // Compute live statistics for summary strip
  const activeContracts = contracts.filter(c => c.status === 'active' || c.status === 'due_soon' || c.status === 'overdue');
  const totalActiveLoanAmount = activeContracts.reduce((sum, c) => sum + c.loanAmount, 0);

  const dueSoonCount = contracts.filter(c => {
    if (c.status !== 'active' && c.status !== 'due_soon') return false;
    const days = getDaysRemaining(c.dueDate);
    return days >= 0 && days <= 7;
  }).length;

  const overdueCount = contracts.filter(c => {
    if (c.status === 'redeemed' || c.status === 'forfeited') return false;
    return getDaysRemaining(c.dueDate) < 0;
  }).length;

  // Filtered contracts
  const filteredContracts = contracts.filter(c => {
    // Search query matches: Contract No, Citizen ID, First Name, Last Name, Phone, Item Name, IMEI, Serial No
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchNumber = c.contractNumber.toLowerCase().includes(q);
      const matchCitizen = c.customerSnapshot.citizenId.includes(q);
      const matchName = `${c.customerSnapshot.firstName} ${c.customerSnapshot.lastName}`.toLowerCase().includes(q);
      const matchPhone = c.customerSnapshot.phone.includes(q);
      const matchItem = c.item.name.toLowerCase().includes(q);
      const matchImei = c.item.phone?.imei?.includes(q) || false;
      const matchSn = 
        c.item.notebook?.serialNumber?.toLowerCase().includes(q) ||
        c.item.printer?.serialNumber?.toLowerCase().includes(q) ||
        c.item.phone?.serialNumber?.toLowerCase().includes(q) ||
        c.item.itGadget?.serialNumber?.toLowerCase().includes(q) ||
        false;

      if (!matchNumber && !matchCitizen && !matchName && !matchPhone && !matchItem && !matchImei && !matchSn) {
        return false;
      }
    }

    // Status filter
    if (selectedStatus === 'active') {
      if (c.status !== 'active' && c.status !== 'due_soon') return false;
    } else if (selectedStatus === 'due_soon') {
      const days = getDaysRemaining(c.dueDate);
      if (c.status === 'redeemed' || c.status === 'forfeited' || days < 0 || days > 7) return false;
    } else if (selectedStatus === 'overdue') {
      const days = getDaysRemaining(c.dueDate);
      if (c.status === 'redeemed' || c.status === 'forfeited' || days >= 0) return false;
    } else if (selectedStatus === 'redeemed') {
      if (c.status !== 'redeemed') return false;
    } else if (selectedStatus === 'forfeited') {
      if (c.status !== 'forfeited') return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && c.item.category !== selectedCategory) {
      return false;
    }

    return true;
  });

  const selectedContract = contracts.find(c => c.id === selectedContractId) || filteredContracts[0] || null;

  const getItemCategoryIcon = (cat: ItemCategory) => {
    switch (cat) {
      case 'notebook': return <Laptop className="w-4 h-4 text-amber-500" />;
      case 'computer': return <Cpu className="w-4 h-4 text-indigo-500" />;
      case 'printer': return <Printer className="w-4 h-4 text-emerald-500" />;
      case 'phone': return <Smartphone className="w-4 h-4 text-blue-500" />;
      case 'gadget_it': return <Monitor className="w-4 h-4 text-purple-500" />;
      default: return <Package className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
      {/* 1. Real-time Status Metric Ribbons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        {/* Metric 1 */}
        <div
          onClick={() => setSelectedStatus('active')}
          className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>ยอดเงินต้นคงค้างทั้งหมด</span>
            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{activeContracts.length} ตั๋ว</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {formatCurrency(totalActiveLoanAmount)}
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => setSelectedStatus('due_soon')}
          className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] text-amber-700">
            <span>ใกล้ครบกำหนด (ใน 7 วัน)</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-600 mt-0.5">
            {dueSoonCount} <span className="text-xs font-normal text-slate-500">สัญญา</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => setSelectedStatus('overdue')}
          className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] text-rose-700">
            <span>เกินกำหนด / รอหลุดจำนำ</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-bold font-mono text-rose-600 mt-0.5">
            {overdueCount} <span className="text-xs font-normal text-slate-500">สัญญา</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => setSelectedStatus('redeemed')}
          className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] text-emerald-700">
            <span>ไถ่ถอนสำเร็จแล้ว</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
            {contracts.filter(c => c.status === 'redeemed').length} <span className="text-xs font-normal text-slate-500">สัญญา</span>
          </div>
        </div>
      </div>

      {/* 2. Fast Universal Search & Filter Bar */}
      <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs shrink-0">
        {/* Universal Search Input + Quick Scan Button */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหา: เลขสัญญา, บัตร ปชช., ชื่อลูกค้า, S/N..."
              className="w-full px-3 py-1.5 pl-8 rounded-lg border border-slate-300 bg-white text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ล้าง
              </button>
            )}
          </div>
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shrink-0 transition-all shadow-2xs cursor-pointer active:scale-95"
              title="สแกน QR Code ติดเครื่องของลูกค้า"
            >
              <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">สแกน QR</span>
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-0.5 bg-slate-100 rounded-lg scrollbar-none">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap text-xs transition-colors ${
              selectedStatus === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({contracts.length})
          </button>
          <button
            onClick={() => setSelectedStatus('active')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap text-xs transition-colors ${
              selectedStatus === 'active' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เปิดอยู่ ({activeContracts.length})
          </button>
          <button
            onClick={() => setSelectedStatus('due_soon')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap text-xs transition-colors ${
              selectedStatus === 'due_soon' ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ใกล้ครบ ({dueSoonCount})
          </button>
          <button
            onClick={() => setSelectedStatus('overdue')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap text-xs transition-colors ${
              selectedStatus === 'overdue' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เกินกำหนด ({overdueCount})
          </button>
          <button
            onClick={() => setSelectedStatus('redeemed')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap text-xs transition-colors ${
              selectedStatus === 'redeemed' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ไถ่ถอนแล้ว
          </button>
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-slate-400 text-xs">หมวดไอที:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 sm:flex-initial px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs focus:outline-none"
          >
            <option value="all">ทุกหมวดไอที</option>
            <option value="notebook">โน็ตบุ้ค / แล็ปท็อป</option>
            <option value="computer">คอมพิวเตอร์พีซี / All-in-One</option>
            <option value="printer">เครื่องพิมพ์ / ปริ้นเตอร์</option>
            <option value="phone">สมาร์ทโฟน / แท็บเล็ต</option>
            <option value="gadget_it">จอภาพ / อะไหล่ไอที</option>
            <option value="general">สินค้าไอทีอื่นๆ</option>
          </select>
        </div>
      </div>

      {/* Mobile Master-Detail View Switcher Tab (Visible only on < lg) */}
      <div className="lg:hidden flex items-center bg-slate-200/90 p-1 rounded-xl shrink-0 gap-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileActiveView('list')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileActiveView === 'list'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📋 รายการสัญญา ({filteredContracts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView('detail')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileActiveView === 'detail'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📄 ตรวจสอบ / จัดการ</span>
          {selectedContract && (
            <span className="font-mono text-[10px] text-amber-700 bg-amber-100 px-1 rounded">
              {selectedContract.contractNumber}
            </span>
          )}
        </button>
      </div>

      {/* 3. Main Split Workstation Canvas */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch overflow-hidden">
        {/* Left Side: Dense Contract Grid (8 cols) */}
        <div className={`lg:col-span-7 xl:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs h-full min-h-0 flex-col overflow-hidden ${
          mobileActiveView === 'list' ? 'flex' : 'hidden lg:flex'
        }`}>
          <div className="px-3.5 py-2 border-b border-slate-200 bg-slate-50/75 flex justify-between items-center text-xs shrink-0">
            <span className="font-semibold text-slate-700">
              รายการสัญญาขายฝาก ({filteredContracts.length} รายการ)
            </span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">คลิกที่แถวเพื่อดูรายละเอียดและจัดการสัญญา</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Mobile Card Feed (visible on < sm screens) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filteredContracts.map(c => {
                const isSelected = selectedContract?.id === c.id;
                const days = getDaysRemaining(c.dueDate);
                const isOverdue = days < 0;
                const isDueSoon = days >= 0 && days <= 7;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedContractId(c.id);
                      setMobileActiveView('detail');
                    }}
                    className={`p-3 cursor-pointer transition-colors active:bg-indigo-50/80 ${
                      isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-700">
                        {c.isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                        <span>{c.contractNumber}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        c.status === 'due_soon' ? 'bg-amber-100 text-amber-800' :
                        c.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                        c.status === 'redeemed' ? 'bg-slate-100 text-slate-700' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {c.status === 'active' ? 'ปกติ' :
                         c.status === 'due_soon' ? 'ใกล้ครบ' :
                         c.status === 'overdue' ? 'เกินกำหนด' :
                         c.status === 'redeemed' ? 'ไถ่ถอนแล้ว' : 'ยึดหลุดแล้ว'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="font-semibold text-slate-900 truncate">
                        {c.customerSnapshot.firstName} {c.customerSnapshot.lastName}
                      </div>
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(c.loanAmount)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 truncate max-w-[200px]">
                        {getItemCategoryIcon(c.item.category)}
                        <span className="truncate">{c.item.name}</span>
                      </div>
                      <div className={`${
                        isOverdue ? 'text-rose-600 font-bold' : isDueSoon ? 'text-amber-600 font-semibold' : 'text-slate-500'
                      }`}>
                        {isOverdue ? `เกิน ${Math.abs(days)} วัน` : days === 0 ? 'ครบกำหนดวันนี้' : `เหลือ ${days} วัน`}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredContracts.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  ไม่พบสัญญาขายฝากที่ตรงกับเงื่อนไขการค้นหา
                </div>
              )}
            </div>

            {/* Desktop & Tablet Table (visible on sm and up) */}
            <div className="hidden sm:block">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 shadow-2xs border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th className="py-2 px-3">เลขสัญญา</th>
                    <th className="py-2 px-3">ลูกค้า</th>
                    <th className="py-2 px-3">รายการทรัพย์สิน</th>
                    <th className="py-2 px-3 text-right">เงินต้น</th>
                    <th className="py-2 px-3">ครบกำหนด</th>
                    <th className="py-2 px-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContracts.map(c => {
                    const isSelected = selectedContract?.id === c.id;
                    const days = getDaysRemaining(c.dueDate);
                    const isOverdue = days < 0;
                    const isDueSoon = days >= 0 && days <= 7;

                    return (
                      <tr
                        key={c.id}
                        onClick={() => {
                          setSelectedContractId(c.id);
                          setMobileActiveView('detail');
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/80 font-medium'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {c.isLocked && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                            <span>{c.contractNumber}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{c.customerSnapshot.firstName} {c.customerSnapshot.lastName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{formatCitizenId(c.customerSnapshot.citizenId)}</div>
                        </td>

                        <td className="py-2.5 px-3 max-w-[220px]">
                          <div className="flex items-center gap-1.5 truncate">
                            {getItemCategoryIcon(c.item.category)}
                            <span className="truncate text-slate-800 font-medium">{c.item.name}</span>
                          </div>
                          {c.item.notebook && (
                            <div className="text-[10px] text-amber-700 font-mono truncate">
                              S/N: {c.item.notebook.serialNumber} | RAM {c.item.notebook.ramGb}GB | {c.item.notebook.storage}
                            </div>
                          )}
                          {c.item.computer && (
                            <div className="text-[10px] text-indigo-700 font-mono truncate">
                              {c.item.computer.processor} | RAM {c.item.computer.ramGb}GB | {c.item.computer.storage}
                            </div>
                          )}
                          {c.item.printer && (
                            <div className="text-[10px] text-emerald-700 font-mono truncate">
                              S/N: {c.item.printer.serialNumber} | หัวพิมพ์: {c.item.printer.headCondition === 'normal' ? 'ปกติ' : 'ต้องล้าง'}
                            </div>
                          )}
                          {c.item.phone && (
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              IMEI: {c.item.phone.imei} ({c.item.phone.storageGb})
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(c.loanAmount)}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="text-slate-800">{formatThaiDate(c.dueDate)}</div>
                          {c.status !== 'redeemed' && c.status !== 'forfeited' && (
                            <div className={`text-[10px] font-medium ${
                              isOverdue ? 'text-rose-600 font-bold' : isDueSoon ? 'text-amber-600 font-semibold' : 'text-slate-400'
                            }`}>
                              {isOverdue ? `เกิน ${Math.abs(days)} วัน` : days === 0 ? 'ครบกำหนดวันนี้!' : `เหลือ ${days} วัน`}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            c.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            c.status === 'due_soon' ? 'bg-amber-100 text-amber-800' :
                            c.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                            c.status === 'redeemed' ? 'bg-slate-100 text-slate-700' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {c.status === 'active' ? 'ปกติ' :
                             c.status === 'due_soon' ? 'ใกล้ครบ' :
                             c.status === 'overdue' ? 'เกินกำหนด' :
                             c.status === 'redeemed' ? 'ไถ่ถอนแล้ว' : 'ยึดหลุดแล้ว'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredContracts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        ไม่พบสัญญาขายฝากที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Contract Inspector & Single-Screen Action Center (4 or 5 cols) */}
        <div className={`lg:col-span-5 xl:col-span-4 h-full min-h-0 flex-col overflow-hidden ${
          mobileActiveView === 'detail' ? 'flex' : 'hidden lg:flex'
        }`}>
          {selectedContract ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs h-full min-h-0 flex flex-col overflow-hidden text-xs">
              {/* Mobile Back Button strip */}
              <div className="lg:hidden flex items-center justify-between bg-slate-800 px-3 py-1.5 text-xs text-amber-300 border-b border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileActiveView('list')}
                  className="flex items-center gap-1 font-medium hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>กลับไปรายการสัญญา</span>
                </button>
                <span className="text-[11px] text-slate-400 font-mono">#{selectedContract.contractNumber}</span>
              </div>

              {/* Header of Inspector */}
              <div className="p-3 bg-slate-900 text-white flex justify-between items-start shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-amber-400">
                      {selectedContract.contractNumber}
                    </span>
                    {selectedContract.isLocked && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" />
                        ล็อคสัญญา
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    ทำรายการเมื่อ: {formatThaiDate(selectedContract.startDate)} โดย {selectedContract.createdBy}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400">ยอดเงินต้น</div>
                  <div className="text-base font-bold font-mono text-white">
                    {formatCurrency(selectedContract.loanAmount)}
                  </div>
                </div>
              </div>

              {/* Action Buttons Hub (ต่อดอก, ไถ่ถอน, พิมพ์ตั๋ว, สติกเกอร์ QR) */}
              <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-4 gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={selectedContract.status === 'redeemed' || selectedContract.status === 'forfeited'}
                  onClick={() => onOpenInterestModal(selectedContract)}
                  className={`py-1.5 px-1 rounded-lg font-medium text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-2xs ${
                    selectedContract.status === 'redeemed' || selectedContract.status === 'forfeited'
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 cursor-pointer'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>ต่อดอก</span>
                </button>

                <button
                  type="button"
                  disabled={selectedContract.status === 'redeemed' || selectedContract.status === 'forfeited'}
                  onClick={() => onOpenRedeemModal(selectedContract)}
                  className={`py-1.5 px-1 rounded-lg font-medium text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-2xs ${
                    selectedContract.status === 'redeemed' || selectedContract.status === 'forfeited'
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 cursor-pointer'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>ไถ่ถอน</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenPrintModal(selectedContract)}
                  className="py-1.5 px-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg font-medium text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>พิมพ์ตั๋ว</span>
                </button>

                {onOpenPrintCustomerTag && (
                  <button
                    type="button"
                    onClick={() => onOpenPrintCustomerTag(selectedContract)}
                    className="py-1.5 px-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-2xs active:scale-95 cursor-pointer"
                    title="พิมพ์สติกเกอร์ QR ประจำตัวลูกค้า / ติดเครื่องนี้"
                  >
                    <QrIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>สติกเกอร์ QR</span>
                  </button>
                )}
              </div>

              {/* Inspector Body Details */}
              <div className="flex-1 min-h-0 p-3 space-y-3 overflow-y-auto">
                {/* 1. Customer Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between items-center text-slate-500 font-medium border-b border-slate-200 pb-1">
                    <span>ข้อมูลผู้ขายฝาก (ลูกค้า)</span>
                    {selectedContract.customerSnapshot.isVip && (
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">VIP</span>
                    )}
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {selectedContract.customerSnapshot.prefix}{selectedContract.customerSnapshot.firstName} {selectedContract.customerSnapshot.lastName}
                  </div>
                  <div className="text-slate-600 font-mono">
                    บัตร ปชช.: {formatCitizenId(selectedContract.customerSnapshot.citizenId)}
                  </div>
                  <div className="text-slate-600">
                    โทร: <strong className="font-mono text-slate-800">{formatPhone(selectedContract.customerSnapshot.phone)}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {selectedContract.customerSnapshot.address}
                  </div>
                </div>

                {/* 2. Item & Asset Photos */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center text-slate-500 font-medium border-b border-slate-200 pb-1">
                    <span>ทรัพย์สินค้ำประกัน</span>
                    <span className="font-medium text-slate-700">ที่เก็บ: {selectedContract.storageLocation || 'ตู้นิรภัย'}</span>
                  </div>

                  <div className="font-bold text-slate-900 text-sm">
                    {selectedContract.item.name}
                  </div>
                  <div className="text-slate-600">
                    {selectedContract.item.description}
                  </div>

                  {/* Notebook Specifics */}
                  {selectedContract.item.notebook && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-amber-950 space-y-1.5 text-xs">
                      <div className="font-bold flex items-center justify-between">
                        <span>{selectedContract.item.notebook.brand} {selectedContract.item.notebook.model}</span>
                        <span className="font-mono text-[10px] bg-amber-200/80 px-1.5 py-0.5 rounded">S/N: {selectedContract.item.notebook.serialNumber}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700">
                        <div>ซีพียู: <strong className="text-slate-900">{selectedContract.item.notebook.processor}</strong></div>
                        <div>แรม: <strong className="text-slate-900">{selectedContract.item.notebook.ramGb} GB</strong></div>
                        <div>ความจุ: <strong className="text-slate-900">{selectedContract.item.notebook.storage}</strong></div>
                        <div>การ์ดจอ: <strong className="text-slate-900">{selectedContract.item.notebook.gpu || 'Onboard'}</strong></div>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-1 border-t border-amber-200/60">
                        <span>สถานะแบต: {selectedContract.item.notebook.batteryHealth || 'ปกติ'}</span>
                        <span>·</span>
                        <span>{selectedContract.item.notebook.hasCharger ? '✓ สายชาร์จแท้' : 'ไม่มีสายชาร์จ'}</span>
                      </div>
                    </div>
                  )}

                  {/* Computer PC Specifics */}
                  {selectedContract.item.computer && (
                    <div className="bg-indigo-50/80 border border-indigo-200 rounded-lg p-2.5 text-indigo-950 space-y-1.5 text-xs">
                      <div className="font-bold flex items-center justify-between">
                        <span>{selectedContract.item.computer.brandOrCustom}</span>
                        <span className="text-[10px] text-indigo-700">{selectedContract.item.computer.modelOrCase}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700">
                        <div>ซีพียู: <strong className="text-slate-900">{selectedContract.item.computer.processor}</strong></div>
                        <div>แรม: <strong className="text-slate-900">{selectedContract.item.computer.ramGb} GB</strong></div>
                        <div>ความจุ: <strong className="text-slate-900">{selectedContract.item.computer.storage}</strong></div>
                        <div>การ์ดจอ: <strong className="text-slate-900">{selectedContract.item.computer.gpu || 'Onboard'}</strong></div>
                      </div>
                      {selectedContract.item.computer.monitor && (
                        <div className="text-[11px] text-indigo-900 font-medium">
                          จอภาพ: {selectedContract.item.computer.monitor}
                        </div>
                      )}
                      {selectedContract.item.computer.accessories.length > 0 && (
                        <div className="text-[11px] text-slate-600">
                          อุปกรณ์: {selectedContract.item.computer.accessories.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Printer Specifics */}
                  {selectedContract.item.printer && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-2.5 text-emerald-950 space-y-1.5 text-xs">
                      <div className="font-bold flex items-center justify-between">
                        <span>{selectedContract.item.printer.brand} {selectedContract.item.printer.model}</span>
                        <span className="font-mono text-[10px] bg-emerald-200/80 px-1.5 py-0.5 rounded">S/N: {selectedContract.item.printer.serialNumber}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700">
                        <div>ระบบหมึก: <strong>{selectedContract.item.printer.inkSystem === 'genuine_tank' ? 'แท็งก์แท้ศูนย์' : 'ตลับหมึก'}</strong></div>
                        <div>สภาพหัวพิมพ์: <strong className="text-emerald-800">{selectedContract.item.printer.headCondition === 'normal' ? 'ออกครบ 100%' : 'ต้องล้างทำความสะอาด'}</strong></div>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-1 border-t border-emerald-200/60">
                        <span>{selectedContract.item.printer.hasPowerCable ? '✓ สายไฟ AC' : 'ไม่มีสายไฟ'}</span>
                        <span>·</span>
                        <span>{selectedContract.item.printer.hasUsbCable ? '✓ สายต่อ USB' : 'ไม่มีสาย USB'}</span>
                      </div>
                    </div>
                  )}

                  {/* Phone Specifics */}
                  {selectedContract.item.phone && (
                    <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-2.5 text-blue-950 space-y-1 font-mono text-xs">
                      <div className="font-sans font-bold text-slate-900">{selectedContract.item.phone.brand} {selectedContract.item.phone.model}</div>
                      <div>IMEI: <strong>{selectedContract.item.phone.imei}</strong></div>
                      <div>ความจุ: {selectedContract.item.phone.storageGb} (iCloud: {selectedContract.item.phone.icloudStatus})</div>
                      {selectedContract.item.phone.accessories.length > 0 && (
                        <div className="text-[11px] text-slate-600 font-sans">
                          อุปกรณ์: {selectedContract.item.phone.accessories.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* IT Gadget Specifics */}
                  {selectedContract.item.itGadget && (
                    <div className="bg-purple-50/80 border border-purple-200 rounded-lg p-2.5 text-purple-950 space-y-1 text-xs">
                      <div className="font-bold">{selectedContract.item.itGadget.brand} {selectedContract.item.itGadget.model}</div>
                      <div className="text-[11px] text-slate-700">{selectedContract.item.itGadget.specsSummary}</div>
                      {selectedContract.item.itGadget.serialNumber && (
                        <div className="font-mono text-[10px] text-slate-500">S/N: {selectedContract.item.itGadget.serialNumber}</div>
                      )}
                    </div>
                  )}

                  {/* Photos Grid */}
                  {selectedContract.item.photos.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] text-slate-500 mb-1.5">ภาพถ่ายทรัพย์สิน / เอกสารสแกน:</div>
                      <div className="flex gap-2 overflow-x-auto">
                        {selectedContract.item.photos.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt="asset"
                            onClick={() => setPreviewPhoto(url)}
                            className="w-16 h-16 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Interest & Schedule */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="text-slate-500 font-medium border-b border-slate-200 pb-1">
                    เงื่อนไขและวันครบกำหนด
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ระยะเวลาสัญญา:</span>
                    <strong className="text-slate-900">{formatDurationText(selectedContract.durationMonths, selectedContract.durationDays)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">อัตราดอกเบี้ย:</span>
                    <strong className="font-mono text-slate-900">{selectedContract.monthlyInterestRate}% / เดือน</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ดอกเบี้ยต่อเดือน:</span>
                    <strong className="font-mono text-indigo-700">
                      {formatCurrency((selectedContract.loanAmount * selectedContract.monthlyInterestRate) / 100)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">วันครบกำหนดไถ่ถอน:</span>
                    <strong className="text-rose-600">{formatThaiDate(selectedContract.dueDate, true)}</strong>
                  </div>
                </div>

                {/* 4. Payment History (ประวัติการต่อดอก) */}
                {selectedContract.interestPayments.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="text-slate-500 font-medium border-b border-slate-200 pb-1 flex justify-between">
                      <span>ประวัติการต่อดอกเบี้ย</span>
                      <span>({selectedContract.interestPayments.length} ครั้ง)</span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {selectedContract.interestPayments.map(p => (
                        <div key={p.id} className="p-2 bg-white rounded border border-slate-200 text-[11px] flex justify-between items-center">
                          <div>
                            <div className="font-mono font-bold text-slate-800">{p.receiptNumber}</div>
                            <div className="text-slate-500">{formatThaiDate(p.date)} · ขยายไป {formatThaiDate(p.newDueDate)}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold font-mono text-emerald-600">{formatCurrency(p.totalPaid)}</div>
                            <div className="text-[10px] text-slate-400">โดย {p.recordedBy}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Redemption completed details */}
                {selectedContract.redemption && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1 text-emerald-950">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ไถ่ถอนและส่งมอบทรัพย์สินคืนแล้ว
                    </div>
                    <div className="text-slate-600">
                      ใบเสร็จเลขที่: <span className="font-mono font-bold">{selectedContract.redemption.receiptNumber}</span>
                    </div>
                    <div className="text-slate-600">
                      ยอดรวมที่รับชำระ: <span className="font-mono font-bold text-emerald-700">{formatCurrency(selectedContract.redemption.totalPaid)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ดำเนินการเมื่อ: {formatThaiDate(selectedContract.redemption.redeemDate)}
                    </div>
                  </div>
                )}

                {/* 6. Security & Audit Trail */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onRequestEditContract(selectedContract)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    ขอสิทธิ์แก้ไขสาระสัญญา
                  </button>

                  {selectedContract.status !== 'redeemed' && selectedContract.status !== 'forfeited' && (
                    <button
                      type="button"
                      onClick={() => onForfeitContract(selectedContract)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                    >
                      ยึดหลุดจำนำ
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400 h-full flex items-center justify-center">
              กรุณาเลือกสัญญาจากรายการทางซ้าย
            </div>
          )}
        </div>
      </div>

      {/* Photo Zoom Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-pointer"
        >
          <div className="max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <img src={previewPhoto} alt="Zoom" className="w-full h-full object-contain max-h-[80vh] rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};
