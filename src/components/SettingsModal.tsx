import React, { useState } from 'react';
import { X, Settings, Plus, Trash2, Shield, Store, Check, Layers, UserCheck } from 'lucide-react';
import { ShopSettings, UserAccount, InterestTier } from '../types/pawn';
import { formatCurrency } from '../utils/thaiFormat';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  users: UserAccount[];
  onSaveSettings: (settings: ShopSettings) => void;
  onSaveUsers: (users: UserAccount[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  users,
  onSaveSettings,
  onSaveUsers,
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'interest' | 'users'>('shop');

  // Shop & Owner details
  const [shopName, setShopName] = useState(settings.shopName);
  const [branchName, setBranchName] = useState(settings.branchName);
  const [ownerName, setOwnerName] = useState(settings.ownerName || 'คุณชัยกร (Chaiyakorn)');
  const [taxId, setTaxId] = useState(settings.taxId);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email || 'poi1800@gmail.com');
  const [address, setAddress] = useState(settings.address);
  const [lineId, setLineId] = useState(settings.lineId);
  const [facebook, setFacebook] = useState(settings.facebook || 'facebook.com/phatthalungprinter');
  const [promptPayId, setPromptPayId] = useState(settings.promptPayId || '0834268058');
  const [bankName, setBankName] = useState(settings.bankName || 'ธนาคารกสิกรไทย สาขาพัทลุง');
  const [bankAccountNumber, setBankAccountNumber] = useState(settings.bankAccountNumber || '083-4-26805-8');
  const [bankAccountName, setBankAccountName] = useState(settings.bankAccountName || 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์');
  const [defaultDurationMonths, setDefaultDurationMonths] = useState(settings.defaultDurationMonths);
  const [gracePeriodDays, setGracePeriodDays] = useState(settings.gracePeriodDays);
  const [lateFeePerDay, setLateFeePerDay] = useState(settings.lateFeePerDay);
  const [termsAndConditions, setTermsAndConditions] = useState(settings.termsAndConditions);

  // Interest & Tiers
  const [enableSteppedTiers, setEnableSteppedTiers] = useState(settings.enableSteppedTiers);
  const [defaultMonthlyRate, setDefaultMonthlyRate] = useState(settings.defaultMonthlyRate);
  const [tiers, setTiers] = useState<InterestTier[]>(settings.tiers);

  // Users & PINs
  const [userList, setUserList] = useState<UserAccount[]>(users);

  if (!isOpen) return null;

  // Add tier row
  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? lastTier.maxAmount + 1 : 1;
    const newTier: InterestTier = {
      minAmount: newMin,
      maxAmount: newMin + 50000,
      monthlyRatePercent: 1.5,
    };
    setTiers([...tiers, newTier]);
  };

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, idx) => idx !== index));
  };

  const handleUpdateTier = (index: number, field: keyof InterestTier, value: number) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  const handleUpdateUserPin = (userId: string, newPin: string) => {
    setUserList(prev => prev.map(u => u.id === userId ? { ...u, pin: newPin } : u));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSettings: ShopSettings = {
      ...settings,
      shopName: shopName.trim(),
      branchName: branchName.trim(),
      ownerName: ownerName.trim(),
      taxId: taxId.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      lineId: lineId.trim(),
      facebook: facebook.trim(),
      promptPayId: promptPayId.trim(),
      bankName: bankName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankAccountName: bankAccountName.trim(),
      defaultDurationMonths,
      gracePeriodDays,
      lateFeePerDay,
      termsAndConditions: termsAndConditions.trim(),
      enableSteppedTiers,
      defaultMonthlyRate,
      tiers,
    };

    onSaveSettings(updatedSettings);
    onSaveUsers(userList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto no-print">
      <div className="w-full h-full sm:h-auto sm:max-h-[94vh] max-w-3xl bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-900 shadow-xs font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">ตั้งค่าระบบ (System Configuration)</h3>
              <p className="text-xs text-slate-400">อัตราดอกเบี้ยขั้นบันได ข้อมูลร้านค้า และรหัสผ่านผู้ใช้งาน</p>
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-6 pt-2 gap-2 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 rounded-t-xl font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'shop' ? 'bg-white text-indigo-700 shadow-xs border-t border-x border-slate-200' : 'text-slate-600'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            ข้อมูลร้าน & ข้อมูลเจ้าของ
          </button>
          <button
            onClick={() => setActiveTab('interest')}
            className={`px-4 py-2 rounded-t-xl font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'interest' ? 'bg-white text-indigo-700 shadow-xs border-t border-x border-slate-200' : 'text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            อัตราดอกเบี้ยขั้นบันได & ค่าปรับ
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-t-xl font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-white text-indigo-700 shadow-xs border-t border-x border-slate-200' : 'text-slate-600'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            ผู้ใช้งาน & รหัส PIN สิทธิ์
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: SHOP & OWNER INFO */}
          {activeTab === 'shop' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">ชื่อร้าน / นิติบุคคล</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">สาขา</label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">ชื่อเจ้าของกิจการ / ผู้ดูแลระบบ</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">อีเมลติดต่อ</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">LINE ID</label>
                  <input
                    type="text"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Facebook เพจ</label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">เบอร์พร้อมเพย์ (PromptPay)</label>
                  <input
                    type="text"
                    value={promptPayId}
                    onChange={(e) => setPromptPayId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">ธนาคาร & เลขที่บัญชี</label>
                  <input
                    type="text"
                    value={`${bankName} ${bankAccountNumber}`}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">ที่ตั้งร้านค้า (พิมพ์บนตั๋วและสลิป)</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">ระยะเวลาสัญญาเริ่มต้น (เดือน)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={defaultDurationMonths}
                    onChange={(e) => setDefaultDurationMonths(parseInt(e.target.value, 10) || 2)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">ระยะเวลาผ่อนผันก่อนยึดหลุด (วัน)</label>
                  <input
                    type="number"
                    min="0"
                    value={gracePeriodDays}
                    onChange={(e) => setGracePeriodDays(parseInt(e.target.value, 10) || 15)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">ข้อกำหนดและเงื่อนไขท้ายสัญญา</label>
                  <textarea
                    rows={3}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTEREST & TIERS */}
          {activeTab === 'interest' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">การคำนวณอัตราดอกเบี้ยขั้นบันได (Stepped Tier Rates)</h4>
                  <p className="text-slate-500 mt-0.5">ระบบจะคิดอัตราดอกเบี้ยอัตโนมัติตามช่วงวงเงินรับจำนำ</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={enableSteppedTiers}
                    onChange={(e) => setEnableSteppedTiers(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  เปิดใช้ดอกเบี้ยขั้นบันได
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-800">ตารางขั้นบันไดอัตราดอกเบี้ย:</span>
                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มขั้นใหม่
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-2.5">วงเงินเริ่มต้น (บาท)</th>
                        <th className="p-2.5">วงเงินสูงสุด (บาท)</th>
                        <th className="p-2.5">อัตราดอกเบี้ย (%/เดือน)</th>
                        <th className="p-2.5 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {tiers.map((t, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <input
                              type="number"
                              value={t.minAmount}
                              onChange={(e) => handleUpdateTier(idx, 'minAmount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={t.maxAmount}
                              onChange={(e) => handleUpdateTier(idx, 'maxAmount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.05"
                                value={t.monthlyRatePercent}
                                onChange={(e) => handleUpdateTier(idx, 'monthlyRatePercent', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 rounded border border-slate-300 font-mono font-bold text-indigo-700"
                              />
                              <span>%</span>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveTier(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">อัตราดอกเบี้ยปกติ (กรณีไม่ใช้ขั้นบันได)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.05"
                      value={defaultMonthlyRate}
                      onChange={(e) => setDefaultMonthlyRate(parseFloat(e.target.value) || 1.75)}
                      className="w-32 px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold"
                    />
                    <span>% ต่อเดือน</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">ค่าปรับล่าช้าสัญญาเกินกำหนด (บาท/วัน)</label>
                  <input
                    type="number"
                    value={lateFeePerDay}
                    onChange={(e) => setLateFeePerDay(parseFloat(e.target.value) || 50)}
                    className="w-32 px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USERS & PIN */}
          {activeTab === 'users' && (
            <div className="space-y-4 text-xs">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-indigo-950">
                <div className="font-bold">ระบบกำหนดสิทธิ์หลายระดับ (Multi-Role Permission):</div>
                <div className="text-[11px] text-indigo-800 mt-1">
                  • <strong>Admin (เจ้าของร้าน):</strong> สิทธิ์สูงสุด เข้าถึงรายงาน สรุปบัญชี แก้ไขการตั้งค่าร้าน และอนุมัติแก้ไขสัญญา<br/>
                  • <strong>Manager (ผู้จัดการ):</strong> อนุมัติการแก้ไขสาระสำคัญของสัญญาที่ล็อคไว้ ให้ส่วนลดดอกเบี้ยพิเศษ<br/>
                  • <strong>Staff (แคชเชียร์):</strong> บันทึกรับจำนำ ต่อดอกเบี้ย ไถ่ถอน ค้นหาลูกค้า และพิมพ์ตั๋ว (ไม่สามารถแก้ไขเงินต้นสัญญาที่บันทึกแล้วได้)
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {userList.map(u => (
                  <div key={u.id} className="p-3 bg-white flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        ตำแหน่ง: {u.role === 'admin' ? 'เจ้าของร้าน (Admin)' : u.role === 'manager' ? 'ผู้จัดการ (Manager)' : 'พนักงานแคชเชียร์ (Staff)'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">รหัส PIN:</span>
                      <input
                        type="password"
                        maxLength={6}
                        value={u.pin}
                        onChange={(e) => handleUpdateUserPin(u.id, e.target.value)}
                        className="w-24 px-2.5 py-1.5 rounded border border-slate-300 font-mono text-center tracking-widest bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
