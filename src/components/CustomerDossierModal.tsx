import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Laptop,
  Cpu,
  Printer as PrinterIcon,
  Smartphone,
  Package,
  QrCode as QrIcon,
  Plus,
  FileText,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Customer, PawnContract, ShopSettings, UserAccount, ItemCategory } from '../types/pawn';
import { SecondhandBuyIn } from '../types/buyIn';
import { formatCurrency, formatThaiDate, formatCitizenId, formatPhone, getDaysRemaining } from '../utils/thaiFormat';

interface CustomerDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  contracts: PawnContract[];
  buyIns: SecondhandBuyIn[];
  settings: ShopSettings;
  currentUser: UserAccount;
  onOpenInterestModal: (contract: PawnContract) => void;
  onOpenRedeemModal: (contract: PawnContract) => void;
  onOpenPrintContractModal: (contract: PawnContract) => void;
  onOpenPrintCustomerTag: (customer: Customer, contract?: PawnContract, buyIn?: SecondhandBuyIn) => void;
  onOpenNewContractForCustomer: (customer: Customer) => void;
  onOpenNewBuyInForCustomer: (customer: Customer) => void;
  onOpenEditCustomer: (customer: Customer) => void;
}

export const CustomerDossierModal: React.FC<CustomerDossierModalProps> = ({
  isOpen,
  onClose,
  customer,
  contracts,
  buyIns,
  settings,
  currentUser,
  onOpenInterestModal,
  onOpenRedeemModal,
  onOpenPrintContractModal,
  onOpenPrintCustomerTag,
  onOpenNewContractForCustomer,
  onOpenNewBuyInForCustomer,
  onOpenEditCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<'active_items' | 'buy_in_history' | 'closed_history'>('active_items');

  if (!isOpen || !customer) return null;

  // Find all contracts belonging to this customer
  const customerContracts = contracts.filter(
    c => c.customerId === customer.id || c.customerSnapshot.citizenId === customer.citizenId
  );

  const activeContracts = customerContracts.filter(
    c => c.status === 'active' || c.status === 'due_soon' || c.status === 'overdue'
  );

  const closedContracts = customerContracts.filter(
    c => c.status === 'redeemed' || c.status === 'forfeited'
  );

  // Find all secondhand buy-ins from this seller
  const customerBuyIns = buyIns.filter(
    b => b.sellerSnapshot.id === customer.id || b.sellerSnapshot.citizenId === customer.citizenId
  );

  const totalActivePrincipal = activeContracts.reduce((sum, c) => sum + c.loanAmount, 0);
  const totalSecondhandSold = customerBuyIns.reduce((sum, b) => sum + b.purchasePrice, 0);

  const getItemCategoryIcon = (cat: ItemCategory) => {
    switch (cat) {
      case 'notebook': return <Laptop className="w-4 h-4 text-amber-500" />;
      case 'computer': return <Cpu className="w-4 h-4 text-indigo-500" />;
      case 'printer': return <PrinterIcon className="w-4 h-4 text-emerald-500" />;
      case 'phone': return <Smartphone className="w-4 h-4 text-blue-500" />;
      default: return <Package className="w-4 h-4 text-purple-500" />;
    }
  };

  const customerCode = `CUST-${customer.citizenId ? customer.citizenId.slice(-6) : customer.id.slice(-6)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-print">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs">
              <QrIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-bold">
                  ผลการสแกน QR ติดเครื่องสำเร็จ
                </span>
                <span className="text-xs text-slate-400 font-mono">[{customerCode}]</span>
              </div>
              <h2 className="font-bold text-base sm:text-lg text-white mt-0.5">
                แฟ้มประวัติลูกค้า & อุปกรณ์ไอที (Customer Dossier 360°)
              </h2>
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

        {/* Top Section: Customer Profile & Quick Stats */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            {/* Customer Avatar & Bio */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-sm shrink-0">
                {customer.firstName.slice(0, 1)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {customer.prefix}{customer.firstName} {customer.lastName}
                  </h3>
                  {customer.isVip && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      ★ ลูกค้า VIP
                    </span>
                  )}
                  <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {customerCode}
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>เลขบัตร ปชช: <strong className="font-mono text-slate-900">{formatCitizenId(customer.citizenId)}</strong></span>
                  <span>เบอร์โทร: <strong className="font-mono text-slate-900">{formatPhone(customer.phone)}</strong></span>
                  {customer.lineId && <span>LINE: <strong className="text-emerald-700">{customer.lineId}</strong></span>}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{customer.address || 'ไม่ระบุที่อยู่'}</span>
                </div>
                {customer.note && (
                  <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg mt-1 inline-block">
                    <strong>หมายเหตุร้าน:</strong> {customer.note}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons for this Customer */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrintCustomerTag(customer);
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
              >
                <QrIcon className="w-4 h-4 text-amber-600" />
                <span>พิมพ์สติกเกอร์ QR ติดเครื่อง</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewContractForCustomer(customer);
                }}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>เปิดสัญญาจำนำใหม่</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewBuyInForCustomer(customer);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>รับซื้อเครื่องใหม่</span>
              </button>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] text-slate-500">ยอดเงินต้นฝากอยู่ขณะนี้</div>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-0.5">
                {formatCurrency(totalActivePrincipal)}
              </div>
              <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                {activeContracts.length} รายการที่ยังไม่ไถ่ถอน
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] text-slate-500">ประวัติขายเครื่องให้ร้าน</div>
              <div className="text-base sm:text-lg font-bold font-mono text-indigo-700 mt-0.5">
                {formatCurrency(totalSecondhandSold)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {customerBuyIns.length} รายการรับซื้อของเก่า
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] text-slate-500">ไถ่ถอนสำเร็จแล้ว</div>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 mt-0.5">
                {closedContracts.filter(c => c.status === 'redeemed').length} สัญญา
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">
                ประวัติการชำระดีมาก
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] text-slate-500">ระดับความน่าเชื่อถือ</div>
              <div className="text-base sm:text-lg font-bold text-amber-600 mt-0.5">
                เกรด {customer.isVip ? 'A+ (VIP)' : 'A มาตรฐาน'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {activeContracts.some(c => c.status === 'overdue') ? '⚠️ มีสัญญาเกินกำหนด' : '✓ ไม่มีหนี้ค้างเกินกำหนด'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1 px-4 sm:px-6 py-2 border-b border-slate-200 bg-white shrink-0 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('active_items')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'active_items'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>เครื่องที่ฝากอยู่ขณะนี้ ({activeContracts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('buy_in_history')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'buy_in_history'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ประวัติขายให้ร้าน ({customerBuyIns.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('closed_history')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'closed_history'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติไถ่ถอน/ปิดสัญญา ({closedContracts.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 space-y-3">
          {/* TAB 1: ACTIVE ITEMS */}
          {activeTab === 'active_items' && (
            <div className="space-y-3">
              {activeContracts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">ลูกค้ารายนี้ไม่มีเครื่องที่กำลังจำนำอยู่ขณะนี้</p>
                  <p className="text-xs text-slate-400 mt-1">สามารถคลิก "เปิดสัญญาจำนำใหม่" ด้านบนเพื่อรับฝากเครื่อง</p>
                </div>
              ) : (
                activeContracts.map((c) => {
                  const daysRemaining = getDaysRemaining(c.dueDate);
                  const isOverdue = daysRemaining < 0;
                  const isDueSoon = daysRemaining >= 0 && daysRemaining <= 7;

                  const itSpecs = c.item.notebook
                    ? `${c.item.notebook.processor} · RAM ${c.item.notebook.ramGb}GB · ${c.item.notebook.storage}`
                    : c.item.computer
                    ? `${c.item.computer.processor} · RAM ${c.item.computer.ramGb}GB · ${c.item.computer.storage}`
                    : c.item.printer
                    ? `รุ่น ${c.item.printer.model} · ระบบ ${c.item.printer.printerType}`
                    : c.item.phone
                    ? `ความจุ ${c.item.phone.storageGb} · IMEI: ${c.item.phone.imei}`
                    : c.item.itGadget
                    ? c.item.itGadget.specsSummary
                    : c.item.description;

                  const sn = c.item.notebook?.serialNumber ||
                    c.item.printer?.serialNumber ||
                    c.item.phone?.serialNumber ||
                    c.item.phone?.imei ||
                    c.item.itGadget?.serialNumber ||
                    'ไม่มี S/N';

                  return (
                    <div
                      key={c.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                            {getItemCategoryIcon(c.item.category)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-700 text-sm">{c.contractNumber}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isOverdue ? 'bg-rose-100 text-rose-800' :
                                isDueSoon ? 'bg-amber-100 text-amber-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isOverdue ? `เลยกำหนด ${Math.abs(daysRemaining)} วัน` :
                                 isDueSoon ? `ใกล้ครบกำหนด (อีก ${daysRemaining} วัน)` : 'ปกติ'}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mt-0.5">{c.item.name}</h4>
                          </div>
                        </div>

                        <div className="text-right self-end sm:self-center">
                          <div className="text-xs text-slate-400">ยอดเงินต้น</div>
                          <div className="text-base font-bold font-mono text-slate-900">
                            {formatCurrency(c.loanAmount)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            ดอกเบี้ย {c.monthlyInterestRate}% / เดือน
                          </div>
                        </div>
                      </div>

                      {/* Specs & SN Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-400 text-[10px]">สเปกฮาร์ดแวร์:</span>
                          <div className="font-medium text-slate-800 truncate" title={itSpecs}>
                            {itSpecs || 'ไม่มีระบุ'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Serial Number (S/N):</span>
                          <div className="font-mono text-slate-800 truncate">{sn}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">กำหนดครบชำระ:</span>
                          <div className="font-semibold text-slate-900">{formatThaiDate(c.dueDate)}</div>
                        </div>
                      </div>

                      {/* Actions for this contract */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="text-[11px] text-slate-500">
                          {c.storageLocation && <span>ที่จัดเก็บ: <strong>{c.storageLocation}</strong></span>}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenPrintCustomerTag(customer, c);
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="พิมพ์สติกเกอร์ QR ระบุเครื่องนี้"
                          >
                            <QrIcon className="w-3.5 h-3.5" />
                            <span>สติกเกอร์เครื่องนี้</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenPrintContractModal(c);
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>พิมพ์ตั๋ว</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenInterestModal(c);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                          >
                            ต่อดอกเบี้ย
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenRedeemModal(c);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                          >
                            ไถ่ถอนเครื่อง
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: SECONDHAND BUY-IN HISTORY */}
          {activeTab === 'buy_in_history' && (
            <div className="space-y-3">
              {customerBuyIns.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">ไม่มีประวัติการขายเครื่องของเก่าให้ร้าน</p>
                </div>
              ) : (
                customerBuyIns.map((buy) => (
                  <div
                    key={buy.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-700 text-sm">{buy.buyInNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            buy.status === 'sold' ? 'bg-emerald-100 text-emerald-800' :
                            buy.status === 'ready_to_sell' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {buy.status === 'sold' ? 'ขายออกแล้ว' :
                             buy.status === 'ready_to_sell' ? 'วางขายหน้าร้าน' :
                             buy.status === 'in_stock' ? 'ในสต็อก' : 'กำลังซ่อมปรับปรุง'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                          {buy.notebookSpecs.brand} {buy.notebookSpecs.model}
                        </h4>
                      </div>

                      <div className="text-right">
                        <div className="text-slate-400 text-[10px]">ราคารับซื้อ</div>
                        <div className="text-base font-bold font-mono text-slate-900">
                          {formatCurrency(buy.purchasePrice)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          วันที่: {formatThaiDate(buy.date)}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
                      <span>CPU: <strong>{buy.notebookSpecs.processor}</strong></span>
                      <span>RAM: <strong>{buy.notebookSpecs.ramGb}GB</strong></span>
                      <span>SSD: <strong>{buy.notebookSpecs.storage}</strong></span>
                      <span>S/N: <strong className="font-mono">{buy.notebookSpecs.serialNumber}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: CLOSED CONTRACTS HISTORY */}
          {activeTab === 'closed_history' && (
            <div className="space-y-3">
              {closedContracts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                  <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">ไม่มีประวัติสัญญาที่ปิดแล้ว</p>
                </div>
              ) : (
                closedContracts.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all space-y-2 text-xs opacity-90"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700">{c.contractNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'redeemed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {c.status === 'redeemed' ? 'ไถ่ถอนสำเร็จแล้ว' : 'หลุดจำนำ'}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 mt-0.5">{c.item.name}</h4>
                      </div>

                      <div className="text-right">
                        <div className="text-slate-400 text-[10px]">เงินต้น</div>
                        <div className="font-mono font-bold text-slate-800">
                          {formatCurrency(c.loanAmount)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {c.redemption ? `ไถ่ถอนเมื่อ: ${formatThaiDate(c.redemption.redeemDate)}` : `ทำสัญญา: ${formatThaiDate(c.startDate)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-500">
            พัทลุงปริ้นเตอร์ คอมพิวเตอร์ · ระบบสแกนค้นหาด่วน Quick QR Customer
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
