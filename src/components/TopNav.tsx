import { Plus, User, ShieldCheck, Clock, Cloud } from 'lucide-react';
import { UserAccount } from '../types/pawn';
import { formatThaiDate } from '../utils/thaiFormat';

interface TopNavProps {
  currentTab: 'workstation' | 'customers' | 'reports' | 'backup' | 'settings';
  onSelectTab: (tab: 'workstation' | 'customers' | 'reports' | 'backup' | 'settings') => void;
  onOpenNewContract: () => void;
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
  currentUser,
  allUsers,
  onChangeUser,
  shopName,
  logoUrl,
  syncStatus = 'connected',
}) => {
  const todayStr = formatThaiDate(new Date().toISOString());

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white shrink-0 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-slate-700 shadow-xs" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-amber-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-xs">
              พ
            </div>
          )}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onSelectTab('workstation'); }}
            className="text-base font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap"
          >
            {shopName || 'พัทลุงปริ้นเตอร์ & รับจำนำขายฝาก'}
          </a>
        </div>

        {/* Zone 2: Clean single-line nav links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button
            onClick={() => onSelectTab('workstation')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              currentTab === 'workstation' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : 'hover:text-white'
            }`}
          >
            หน้าจอขายฝาก (Workstation)
          </button>
          <button
            onClick={() => onSelectTab('customers')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              currentTab === 'customers' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : 'hover:text-white'
            }`}
          >
            ข้อมูลลูกค้าอัจฉริยะ (AG Customer)
          </button>
          <button
            onClick={() => onSelectTab('reports')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              currentTab === 'reports' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : 'hover:text-white'
            }`}
          >
            สรุปรายรับ-รายจ่าย (Reports)
          </button>
          <button
            onClick={() => onSelectTab('backup')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              currentTab === 'backup' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : 'hover:text-white'
            }`}
          >
            สำรอง & คลังข้อมูล
          </button>
          <button
            onClick={() => onSelectTab('settings')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              currentTab === 'settings' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : 'hover:text-white'
            }`}
          >
            ตั้งค่าระบบ
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick User Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Firebase Cloud Sync Status */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border font-mono bg-slate-800/80 border-slate-700 text-slate-300">
            <Cloud className={`w-3.5 h-3.5 ${
              syncStatus === 'connected' ? 'text-emerald-400' :
              syncStatus === 'syncing' ? 'text-amber-400 animate-pulse' :
              syncStatus === 'connecting' ? 'text-blue-400' : 'text-slate-400'
            }`} />
            <span className="text-[10px]">
              {syncStatus === 'connected' ? 'Firebase คลาวด์' :
               syncStatus === 'syncing' ? 'กำลังซิงค์...' :
               syncStatus === 'connecting' ? 'กำลังเชื่อมต่อ...' : 'แคชในเครื่อง'}
            </span>
          </div>

          {/* Date Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{todayStr}</span>
          </div>

          {/* User Role Switcher Dropdown */}
          <div className="relative">
            <select
              value={currentUser.id}
              onChange={(e) => {
                const u = allUsers.find(user => user.id === e.target.value);
                if (u) onChangeUser(u);
              }}
              className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Primary CTA */}
          <button
            onClick={onOpenNewContract}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>เปิดสัญญาใหม่</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav strip */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-2 border-t border-slate-800 bg-slate-950/60 overflow-x-auto text-xs">
        <button
          onClick={() => onSelectTab('workstation')}
          className={`whitespace-nowrap ${currentTab === 'workstation' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          หน้าจอขายฝาก
        </button>
        <span className="text-slate-700">·</span>
        <button
          onClick={() => onSelectTab('customers')}
          className={`whitespace-nowrap ${currentTab === 'customers' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          ลูกค้าอัจฉริยะ
        </button>
        <span className="text-slate-700">·</span>
        <button
          onClick={() => onSelectTab('reports')}
          className={`whitespace-nowrap ${currentTab === 'reports' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          สรุปบัญชี
        </button>
        <span className="text-slate-700">·</span>
        <button
          onClick={() => onSelectTab('backup')}
          className={`whitespace-nowrap ${currentTab === 'backup' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          สำรองข้อมูล
        </button>
        <span className="text-slate-700">·</span>
        <button
          onClick={() => onSelectTab('settings')}
          className={`whitespace-nowrap ${currentTab === 'settings' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          ตั้งค่า
        </button>
      </div>
    </header>
  );
};
