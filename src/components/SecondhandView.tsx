import React, { useState, useMemo } from 'react';
import {
  Laptop,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  Clock,
  Wrench,
  ShoppingBag,
  Cpu,
  HardDrive,
  Battery,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Tag,
  DollarSign,
  User,
  Eye,
  Check,
  X
} from 'lucide-react';
import { SecondhandBuyIn, BuyInStatus, NotebookBrand } from '../types/buyIn';
import { ShopSettings, UserAccount } from '../types/pawn';
import { formatThaiDate } from '../utils/thaiFormat';

interface SecondhandViewProps {
  buyIns: SecondhandBuyIn[];
  settings: ShopSettings;
  currentUser: UserAccount;
  onOpenNewBuyIn: () => void;
  onPrintBuyIn: (buyIn: SecondhandBuyIn) => void;
  onUpdateBuyIn: (updatedBuyIn: SecondhandBuyIn) => void;
}

export const SecondhandView: React.FC<SecondhandViewProps> = ({
  buyIns,
  settings,
  currentUser,
  onOpenNewBuyIn,
  onPrintBuyIn,
  onUpdateBuyIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BuyInStatus>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<SecondhandBuyIn | null>(null);

  // Quick sale modal state
  const [sellingItem, setSellingItem] = useState<SecondhandBuyIn | null>(null);
  const [soldPriceInput, setSoldPriceInput] = useState<number>(0);
  const [soldCustomerInput, setSoldCustomerInput] = useState<string>('');

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = buyIns.length;
    const inStockItems = buyIns.filter(i => i.status === 'in_stock' || i.status === 'ready_to_sell' || i.status === 'under_repair');
    const inStockCount = inStockItems.length;
    const totalCapitalInvested = inStockItems.reduce((sum, i) => sum + i.purchasePrice, 0);
    const readyToSellCount = buyIns.filter(i => i.status === 'ready_to_sell').length;
    const soldItems = buyIns.filter(i => i.status === 'sold');
    const soldCount = soldItems.length;
    const totalProfitRealized = soldItems.reduce((sum, i) => sum + ((i.soldPrice || i.targetSalePrice) - i.purchasePrice), 0);

    return {
      totalCount,
      inStockCount,
      totalCapitalInvested,
      readyToSellCount,
      soldCount,
      totalProfitRealized,
    };
  }, [buyIns]);

  // Filtering items
  const filteredItems = useMemo(() => {
    return buyIns.filter(item => {
      const nb = item.notebookSpecs;
      const seller = item.sellerSnapshot;
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch = !term ||
        item.buyInNumber.toLowerCase().includes(term) ||
        nb.serialNumber.toLowerCase().includes(term) ||
        nb.brand.toLowerCase().includes(term) ||
        nb.model.toLowerCase().includes(term) ||
        nb.processor.toLowerCase().includes(term) ||
        seller.firstName.toLowerCase().includes(term) ||
        seller.lastName.toLowerCase().includes(term) ||
        seller.citizenId.includes(term) ||
        seller.phone.includes(term);

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesBrand = brandFilter === 'all' || nb.brand.toLowerCase() === brandFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesBrand;
    });
  }, [buyIns, searchTerm, statusFilter, brandFilter]);

  // Handle Mark Sold Submit
  const handleConfirmSold = () => {
    if (!sellingItem) return;
    const updated: SecondhandBuyIn = {
      ...sellingItem,
      status: 'sold',
      soldPrice: soldPriceInput > 0 ? soldPriceInput : sellingItem.targetSalePrice,
      soldDate: new Date().toISOString(),
      soldCustomerName: soldCustomerInput.trim() || 'ลูกค้าหน้าร้านพัทลุง',
    };
    onUpdateBuyIn(updated);
    setSellingItem(null);
  };

  // Quick status toggle
  const handleStatusChange = (item: SecondhandBuyIn, newStatus: BuyInStatus) => {
    if (newStatus === 'sold') {
      setSellingItem(item);
      setSoldPriceInput(item.targetSalePrice);
      setSoldCustomerInput('');
    } else {
      onUpdateBuyIn({
        ...item,
        status: newStatus,
      });
    }
  };

  const brands = useMemo(() => {
    const set = new Set<string>();
    buyIns.forEach(i => set.add(i.notebookSpecs.brand));
    return Array.from(set);
  }, [buyIns]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
      
      {/* 1. Header Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 shrink-0">
        {/* Total In Stock */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">โน็ตบุ้คในสต็อก</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-bold font-mono text-slate-900">{stats.inStockCount}</span>
              <span className="text-[11px] text-slate-500">เครื่อง</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
        </div>

        {/* Capital Invested */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">ทุนรับซื้อหมุนเวียน</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-bold font-mono text-slate-900">
                ฿{stats.totalCapitalInvested.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Ready to Sell */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">พร้อมขายหน้าร้าน</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-bold font-mono text-emerald-600">
                {stats.readyToSellCount}
              </span>
              <span className="text-[11px] text-slate-500">เครื่อง</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        {/* Sold & Realized Profit */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">ขายแล้ว & กำไรสะสม</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-bold font-mono text-indigo-600">
                +฿{stats.totalProfitRealized.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">({stats.soldCount} เครื่อง)</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Toolbar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-2 items-stretch md:items-center justify-between shrink-0">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาตาม S/N, ยี่ห้อ, รุ่น, ซีพียู, ชื่อผู้ขาย หรือเบอร์โทร..."
            className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'in_stock', label: 'ในสต็อก' },
            { id: 'ready_to_sell', label: 'พร้อมขาย' },
            { id: 'under_repair', label: 'รอตรวจซ่อม' },
            { id: 'sold', label: 'ขายแล้ว' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Brand Filter & Action Button */}
        <div className="flex items-center gap-2">
          {brands.length > 0 && (
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">ทุกยี่ห้อ (All Brands)</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}

          <button
            onClick={onOpenNewBuyIn}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 whitespace-nowrap cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ รับซื้อโน็ตบุ้ค</span>
          </button>
        </div>
      </div>

      {/* 3. Items Grid List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl border border-slate-200">
            <Laptop className="w-10 h-10 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">ไม่พบรายการรับซื้อโน็ตบุ้ค</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              ไม่พบรายการที่ตรงกับคำค้นหา หรือยังไม่มีการบันทึกรับซื้อโน็ตบุ้คในหมวดหมู่นี้
            </p>
            <button
              onClick={onOpenNewBuyIn}
              className="mt-3 px-3.5 py-1.5 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>บันทึกรับซื้อโน็ตบุ้คใหม่</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-3">
            {filteredItems.map(item => {
              const nb = item.notebookSpecs;
              const seller = item.sellerSnapshot;
              const margin = (item.soldPrice || item.targetSalePrice) - item.purchasePrice;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col overflow-hidden text-xs"
                >
                  {/* Card Header */}
                  <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                          {item.buyInNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatThaiDate(item.date)}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm truncate" title={`${nb.brand} ${nb.model}`}>
                        {nb.brand} {nb.model}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 truncate">
                        S/N: <strong className="text-slate-800">{nb.serialNumber}</strong>
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 text-right">
                      {item.status === 'ready_to_sell' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>พร้อมขาย</span>
                        </span>
                      )}
                      {item.status === 'in_stock' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>ในสต็อก</span>
                        </span>
                      )}
                      {item.status === 'under_repair' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          <Wrench className="w-3 h-3" />
                          <span>รอตรวจซ่อม</span>
                        </span>
                      )}
                      {item.status === 'sold' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          <ShoppingBag className="w-3 h-3" />
                          <span>ขายแล้ว</span>
                        </span>
                      )}
                      <div className="mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-amber-400">
                          เกรด {nb.cosmeticGrade}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body Specs */}
                  <div className="p-3 space-y-2.5 flex-1">
                    {/* Specs Badges */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-700 truncate">
                        <Cpu className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate font-medium">{nb.processor}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 truncate">
                        <HardDrive className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>RAM {nb.ramGb}GB · {nb.storage}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60 text-[10px]">
                        <span className="truncate">{nb.gpu}</span>
                        <span className="font-mono">{nb.screenSize}</span>
                      </div>
                    </div>

                    {/* Accessories & Battery */}
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded border ${
                        nb.batteryStatus === 'good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        nb.batteryStatus === 'fair' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        🔋 {nb.batteryStatus === 'good' ? 'แบตดี >2 ชม.' : nb.batteryStatus === 'fair' ? 'แบตพอใช้' : 'แบตเสื่อม'}
                      </span>
                      {nb.hasCharger && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          🔌 อะแดปเตอร์แท้
                        </span>
                      )}
                      {nb.hasBag && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          💼 กระเป๋า
                        </span>
                      )}
                      {nb.isICloudOrPasscodeCleared && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          ✓ ปลดล็อคคลาวด์แล้ว
                        </span>
                      )}
                    </div>

                    {/* Pricing Information */}
                    <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-200 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">ราคารับซื้อเข้า:</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ฿{item.purchasePrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">
                          {item.status === 'sold' ? 'ราคาขายจริง:' : 'ราคาตั้งขายหน้าร้าน:'}
                        </span>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="font-mono font-bold text-emerald-700 text-sm">
                            ฿{(item.soldPrice || item.targetSalePrice).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                            (+฿{margin.toLocaleString()})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Seller Snapshot Info */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
                      <div className="flex items-center gap-1 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{seller.prefix}{seller.firstName} {seller.lastName}</span>
                      </div>
                      <span className="font-mono text-[10px] shrink-0 text-slate-400">
                        {seller.phone}
                      </span>
                    </div>

                    {item.status === 'sold' && item.soldCustomerName && (
                      <div className="text-[10px] bg-purple-50 p-1.5 rounded text-purple-900 font-medium">
                        ขายให้: {item.soldCustomerName} เมื่อ {item.soldDate ? formatThaiDate(item.soldDate) : ''}
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => onPrintBuyIn(item)}
                      className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="พิมพ์สัญญาซื้อขายโน็ตบุ้คมือสอง / ใบรับซื้อของเก่า"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>พิมพ์สัญญา</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Status quick select */}
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item, e.target.value as BuyInStatus)}
                        className="bg-white border border-slate-300 text-slate-800 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-medium"
                      >
                        <option value="in_stock">ในสต็อก</option>
                        <option value="ready_to_sell">พร้อมขาย</option>
                        <option value="under_repair">รอตรวจซ่อม</option>
                        <option value="sold">ขายแล้ว</option>
                      </select>

                      <button
                        onClick={() => setSelectedItemForDetails(item)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="ดูรายละเอียดการตรวจเช็คทั้งหมด"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: QUICK MARK AS SOLD DIALOG */}
      {sellingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-5 text-xs text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">บันทึกการขายโน็ตบุ้ค</h3>
                  <p className="text-[11px] text-slate-500">
                    {sellingItem.notebookSpecs.brand} {sellingItem.notebookSpecs.model}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSellingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between text-xs">
                <span>ราคารับซื้อเข้า (ต้นทุน):</span>
                <span className="font-mono font-bold">฿{sellingItem.purchasePrice.toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ราคาขายจริงหน้าร้าน (บาท) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step={100}
                  value={soldPriceInput || ''}
                  onChange={(e) => setSoldPriceInput(Number(e.target.value))}
                  placeholder="เช่น 14500"
                  className="w-full font-mono text-base font-bold text-emerald-800 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex justify-between text-xs font-semibold text-emerald-900">
                <span>กำไรสุทธิจากการขาย:</span>
                <span className="font-mono text-sm">
                  +฿{Math.max(0, soldPriceInput - sellingItem.purchasePrice).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อผู้ซื้อ / ลูกค้าที่มารับเครื่อง
                </label>
                <input
                  type="text"
                  value={soldCustomerInput}
                  onChange={(e) => setSoldCustomerInput(e.target.value)}
                  placeholder="เช่น คุณภานุวัฒน์ หรือ ลูกค้าหน้าร้านพัทลุง"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSellingItem(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmSold}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ยืนยันขายออก</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FULL SPECIFICATIONS & CHECKLIST DETAILS INSPECTOR */}
      {selectedItemForDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-4 sm:p-5 text-xs text-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {selectedItemForDetails.notebookSpecs.brand} {selectedItemForDetails.notebookSpecs.model}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    เลขที่: {selectedItemForDetails.buyInNumber} · S/N: {selectedItemForDetails.notebookSpecs.serialNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemForDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Hardware test results */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">ผลการทดสอบการทำงานฮาร์ดแวร์</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {Object.entries({
                    keyboard: 'คีย์บอร์ดทุกปุ่ม',
                    screen: 'หน้าจอภาพปกติ',
                    touchpad: 'ทัชแพดคลิกรูด',
                    wifiBluetooth: 'Wi-Fi / บลูทูธ',
                    webcamMic: 'กล้องและไมค์',
                    speakers: 'ลำโพงซ้าย-ขวา',
                    usbPorts: 'พอร์ตเชื่อมต่อ USB',
                    chargingPort: 'ช่องชาร์จไฟแน่น',
                  }).map(([key, label]) => {
                    const pass = selectedItemForDetails.notebookSpecs.checklist[key as keyof typeof selectedItemForDetails.notebookSpecs.checklist];
                    return (
                      <div
                        key={key}
                        className={`p-2 rounded-lg border flex items-center justify-between ${
                          pass ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-rose-50/70 border-rose-200 text-rose-800'
                        }`}
                      >
                        <span>{label}</span>
                        <span className="font-bold">{pass ? '✓ ปกติ' : '✗ ไม่ผ่าน'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Defects if any */}
              {selectedItemForDetails.notebookSpecs.defectsNotes && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                  <strong className="block mb-0.5">บันทึกตำหนิ:</strong>
                  <p>{selectedItemForDetails.notebookSpecs.defectsNotes}</p>
                </div>
              )}

              {/* Seller details */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <strong className="block text-slate-800 mb-1">ข้อมูลผู้ขายตามสัญญา:</strong>
                <p>
                  ชื่อ-สกุล: <span className="font-semibold">{selectedItemForDetails.sellerSnapshot.prefix}{selectedItemForDetails.sellerSnapshot.firstName} {selectedItemForDetails.sellerSnapshot.lastName}</span>
                </p>
                <p>
                  เลขประจำตัวประชาชน: <span className="font-mono font-medium">{selectedItemForDetails.sellerSnapshot.citizenId}</span>
                </p>
                <p>
                  เบอร์โทร: <span className="font-mono">{selectedItemForDetails.sellerSnapshot.phone}</span>
                </p>
                <p className="text-[11px] text-slate-600">
                  ที่อยู่: {selectedItemForDetails.sellerSnapshot.address}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  onPrintBuyIn(selectedItemForDetails);
                  setSelectedItemForDetails(null);
                }}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์สัญญาซื้อขาย</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedItemForDetails(null)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
