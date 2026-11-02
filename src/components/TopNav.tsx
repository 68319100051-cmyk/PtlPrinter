import { Plus, User, ShieldCheck, Clock, Cloud } from 'lucide-react';
import { UserAccount } from '../types/pawn';
import { formatThaiDate } from '../utils/thaiFormat';

interface TopNavProps {
  currentTab: 'workstation' | 'secondhand' | 'customers' | 'reports' | 'backup' | 'settings';
  onSelectTab: (tab: 'workstation' | 'secondhand' | 'customers' | 'reports' | 'backup' | 'settings') => void;
  onOpenNewContract: () => void;
  onOpenNewBuyIn?: () => void;
  secondhandCount?: number;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onChangeUser: (user: UserAccount) => void;
  shopName?: string;
  logoUrl?: string;
  syncStatus?: 'connecting' | 'connected' | 'offline' | 'syncing' | 'error';
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewContract,
  onOpenNewBuyIn,
  secondhandCount = 0,
  currentUser,
  allUsers,
  onChangeUser,
  shopName,
  logoUrl,
  syncStatus = 'connected',
}) => {
  const todayStr = formatThaiDate(new Date().toISOString());

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white shrink-0 sticky top-0 z-40 w-full max-w-full">
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2 w-full max-w-full min-w-0">
        {/* Zone 1: Brand Wordmark (Responsive truncate) */}
        <div className="flex items-center gap-2 min-w-0 shrink">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain bg-white p-0.5 border border-slate-700 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-linear-to-tr from-amber-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-xs shrink-0 text-sm">
              พ
            </div>
          )}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onSelectTab('workstation'); }}
            className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-white hover:text-amber-400 transition-colors truncate max-w-[130px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-xs xl:max-w-none"
            title={shopName || 'พัทลุงปริ้นเตอร์ & รับจำนำขายฝาก'}
          >
            {shopName || 'พัทลุงปริ้นเตอร์ & รับจำนำขายฝาก'}
          </a>
        </div>

        {/* Zone 2: Segmented Pill Nav links on Desktop */}
        <nav className="hidden xl:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-medium text-slate-300 shrink-0 border border-slate-700/60">
          <button
            onClick={() => onSelectTab('workstation')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'workstation'
                ? 'bg-amber-400 text-slate-900 font-bold shadow-xs'
                : 'hover:text-white hover:bg-slate-700/50'
            }`}
          >
            หน้าจอขายฝาก
          </button>
          <button
            onClick={() => onSelectTab('secondhand')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'secondhand'
                ? 'bg-amber-400 text-slate-900 font-bold shadow-xs'
                : 'hover:text-white hover:bg-slate-700/50 text-amber-300'
            }`}
          >
            <span>รับซื้อของเก่า (โน็ตบุ้ค)</span>
            {secondhandCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                currentTab === 'secondhand' ? 'bg-slate-950 text-amber-400' : 'bg-amber-400 text-slate-950'
              }`}>
                {secondhandCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onSelectTab('customers')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'customers'
                ? 'bg-amber-400 text-slate-900 font-bold shadow-xs'
                : 'hover:text-white hover:bg-slate-700/50'
            }`}
          >
            ลูกค้า AG
          </button>
          <button
            onClick={() => onSelectTab('reports')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'reports'
                ? 'bg-amber-400 text-slate-900 font-bold shadow-xs'
                : 'hover:text-white hover:bg-slate-700/50'
            }`}
          >
            สรุปบัญชี
          </button>
          <button
            onClick={() => onSelectTab('backup')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'backup'
                ? 'bg-amber-400 text-slate-900 font-bold shadow-xs'
                : 'hover:text-white hover:bg-slate-700/50'
            }`}
          >
            สำรองข้อมูล
          </button>
          <button
            onClick={() => onSelectTab('settings')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-amber-400 text-slate-900 font-bold shadow-xs'
                : 'hover:text-white hover:bg-slate-700/50'
            }`}
          >
            ตั้งค่าระบบ
          </button>
        </nav>

        {/* Zone 3: Primary Action & User Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          {/* Firebase Cloud Sync Status */}
          <div
            title={
              syncStatus === 'connected' ? 'เชื่อมต่อ Firebase คลาวด์เรียบร้อย' :
              syncStatus === 'syncing' ? 'กำลังซิงค์ข้อมูลกับคลาวด์' :
              syncStatus === 'connecting' ? 'กำลังเชื่อมต่อคลาวด์' : 'ออฟไลน์ (แคชในเครื่อง)'
            }
            className="flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-lg border font-mono bg-slate-800/80 border-slate-700 text-slate-300"
          >
            <Cloud className={`w-3.5 h-3.5 ${
              syncStatus === 'connected' ? 'text-emerald-400' :
              syncStatus === 'syncing' ? 'text-amber-400 animate-pulse' :
              syncStatus === 'connecting' ? 'text-blue-400' : 'text-slate-400'
            }`} />
            <span className="hidden md:inline text-[10px]">
              {syncStatus === 'connected' ? 'คลาวด์' :
               syncStatus === 'syncing' ? 'ซิงค์...' :
               syncStatus === 'connecting' ? 'เชื่อมต่อ...' : 'แคช'}
            </span>
          </div>

          {/* User Role Switcher Dropdown */}
          <div className="relative">
            <select
              value={currentUser.id}
              onChange={(e) => {
                const u = allUsers.find(user => user.id === e.target.value);
                if (u) onChangeUser(u);
              }}
              className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs rounded-xl px-2 py-1.5 pr-6 max-w-[85px] sm:max-w-[125px] md:max-w-[145px] truncate appearance-none focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 absolute right-1.5 top-2.5 pointer-events-none" />
          </div>

          {/* Contextual Action Button */}
          {currentTab === 'secondhand' && onOpenNewBuyIn ? (
            <button
              onClick={onOpenNewBuyIn}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">รับซื้อโน็ตบุ้ค</span>
              <span className="sm:hidden">+ รับซื้อ</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewContract}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">เปิดสัญญาใหม่</span>
              <span className="sm:hidden">สัญญาใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Nav strip on screens smaller than XL */}
      <div className="xl:hidden flex items-center gap-1 px-3 py-1 border-t border-slate-800 bg-slate-950/90 overflow-x-auto text-xs scrollbar-none shrink-0 w-full">
        <button
          onClick={() => onSelectTab('workstation')}
          className={`px-2.5 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'workstation'
              ? 'bg-amber-400 text-slate-900 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          หน้าจอขายฝาก
        </button>
        <span className="text-slate-700 text-[10px]">·</span>
        <button
          onClick={() => onSelectTab('secondhand')}
          className={`px-2.5 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
            currentTab === 'secondhand'
              ? 'bg-amber-400 text-slate-900 font-bold'
              : 'text-amber-300 hover:text-white'
          }`}
        >
          <span>รับซื้อของเก่า</span>
          {secondhandCount > 0 && (
            <span className="px-1 py-0.2 rounded-full text-[9px] font-mono bg-amber-400 text-slate-950 font-bold">
              {secondhandCount}
            </span>
          )}
        </button>
        <span className="text-slate-700 text-[10px]">·</span>
        <button
          onClick={() => onSelectTab('customers')}
          className={`px-2.5 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'customers'
              ? 'bg-amber-400 text-slate-900 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ลูกค้า AG
        </button>
        <span className="text-slate-700 text-[10px]">·</span>
        <button
          onClick={() => onSelectTab('reports')}
          className={`px-2.5 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'reports'
              ? 'bg-amber-400 text-slate-900 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          สรุปบัญชี
        </button>
        <span className="text-slate-700 text-[10px]">·</span>
        <button
          onClick={() => onSelectTab('backup')}
          className={`px-2.5 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'backup'
              ? 'bg-amber-400 text-slate-900 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          สำรองข้อมูล
        </button>
        <span className="text-slate-700 text-[10px]">·</span>
        <button
          onClick={() => onSelectTab('settings')}
          className={`px-2.5 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'settings'
              ? 'bg-amber-400 text-slate-900 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ตั้งค่าระบบ
        </button>
      </div>
    </header>
  );
};

