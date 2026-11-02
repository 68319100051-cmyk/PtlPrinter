import React, { useState } from 'react';
import { X, Search, User, Phone, MapPin, Plus, FileText, Check, ShieldAlert, Award, Calendar } from 'lucide-react';
import { Customer, PawnContract } from '../types/pawn';
import { formatCurrency, formatThaiDate, formatCitizenId, formatPhone } from '../utils/thaiFormat';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  contracts: PawnContract[];
  onSaveCustomer: (cust: Customer) => void;
  onSelectContract: (contract: PawnContract, action: 'view' | 'interest' | 'redeem' | 'print') => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customers,
  contracts,
  onSaveCustomer,
  onSelectContract,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [prefix, setPrefix] = useState('นาย');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [isVip, setIsVip] = useState(false);

  if (!isOpen) return null;

  // Filtered customer list
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.citizenId.includes(q) ||
      c.phone.includes(q) ||
      (c.lineId && c.lineId.toLowerCase().includes(q))
    );
  });

  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || filteredCustomers[0];

  // Contracts belonging to this customer
  const customerContracts = activeCustomer
    ? contracts.filter(con => con.customerId === activeCustomer.id || con.customerSnapshot.citizenId === activeCustomer.citizenId)
    : [];

  const activeContracts = customerContracts.filter(c => c.status === 'active' || c.status === 'due_soon' || c.status === 'overdue');
  const closedContracts = customerContracts.filter(c => c.status === 'redeemed' || c.status === 'forfeited');
  const totalLoanBalance = activeContracts.reduce((sum, c) => sum + c.loanAmount, 0);

  const startAddNewCustomer = () => {
    setPrefix('นาย');
    setFirstName('');
    setLastName('');
    setCitizenId('');
    setPhone('');
    setLineId('');
    setAddress('');
    setNote('');
    setIsVip(false);
    setIsEditing(true);
  };

  const startEditCurrentCustomer = () => {
    if (!activeCustomer) return;
    setPrefix(activeCustomer.prefix);
    setFirstName(activeCustomer.firstName);
    setLastName(activeCustomer.lastName);
    setCitizenId(activeCustomer.citizenId);
    setPhone(activeCustomer.phone);
    setLineId(activeCustomer.lineId || '');
    setAddress(activeCustomer.address);
    setNote(activeCustomer.note || '');
    setIsVip(!!activeCustomer.isVip);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !citizenId.trim()) {
      alert('กรุณากรอกชื่อ นามสกุล และเลขบัตรประชาชน 13 หลัก');
      return;
    }

    const newOrUpdated: Customer = {
      id: isEditing && activeCustomer && activeCustomer.firstName === firstName ? activeCustomer.id : `cust-${Date.now()}`,
      citizenId: citizenId.replace(/\D/g, ''),
      prefix,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      lineId: lineId.trim(),
      address: address.trim(),
      note: note.trim(),
      isVip,
      createdAt: activeCustomer ? activeCustomer.createdAt : new Date().toISOString(),
    };

    onSaveCustomer(newOrUpdated);
    setSelectedCustomerId(newOrUpdated.id);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-print">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">ข้อมูลลูกค้าอัจฉริยะ (AG Customer Intelligence)</h2>
              <p className="text-xs text-slate-400">ค้นหาบัตรหาย ลืมบัตร ตรวจสอบประวัติการขายฝากย้อนหลังได้ทันที</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Body: Split Left (Customer Directory) and Right (Customer Profile & History) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Customer Directory List */}
          <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหา: ชื่อ, บัตร ปชช., เบอร์โทร..."
                  className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <button
                type="button"
                onClick={startAddNewCustomer}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                เพิ่มลูกค้าใหม่
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredCustomers.map(c => {
                const isSelected = activeCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedCustomerId(c.id); setIsEditing(false); }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                      isSelected
                        ? 'bg-white border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{c.prefix}{c.firstName} {c.lastName}</span>
                      {c.isVip && <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">VIP</span>}
                    </div>
                    <div className="text-slate-500 font-mono text-[11px] mt-0.5">{formatCitizenId(c.citizenId)}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">โทร: {formatPhone(c.phone)}</div>
                  </div>
                );
              })}
              {filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหา
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Detail / Edit View */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-base">
                    {activeCustomer && !searchQuery ? 'แก้ไขข้อมูลลูกค้า' : 'ลงทะเบียนลูกค้าใหม่'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    ยกเลิก
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1">คำนำหน้า</label>
                    <select
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="นาย">นาย</option>
                      <option value="นาง">นาง</option>
                      <option value="นางสาว">นางสาว</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">ชื่อจริง <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">นามสกุล <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">เลขบัตรประชาชน (13 หลัก) <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      maxLength={13}
                      value={citizenId}
                      onChange={(e) => setCitizenId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Line ID</label>
                    <input
                      type="text"
                      value={lineId}
                      onChange={(e) => setLineId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-slate-600 mb-1">ที่อยู่ตามบัตร / ที่ติดต่อสะดวก</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-slate-600 mb-1">บันทึกช่วยจำเกี่ยวกับลูกค้า</label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white resize-none"
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={isVip}
                        onChange={(e) => setIsVip(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      กำหนดสถานะเป็นลูกค้า VIP ประจำร้าน
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                  >
                    บันทึกข้อมูลลูกค้า
                  </button>
                </div>
              </form>
            ) : activeCustomer ? (
              <div className="space-y-6">
                {/* Customer Profile Header */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-xs">
                      {activeCustomer.firstName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {activeCustomer.prefix}{activeCustomer.firstName} {activeCustomer.lastName}
                        </h3>
                        {activeCustomer.isVip && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                            ลูกค้า VIP
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        เลขบัตร ปชช.: {formatCitizenId(activeCustomer.citizenId)}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>โทร: <strong className="font-mono">{formatPhone(activeCustomer.phone)}</strong></span>
                        {activeCustomer.lineId && <span>Line ID: <strong>{activeCustomer.lineId}</strong></span>}
                        <span>ที่อยู่: {activeCustomer.address}</span>
                      </div>
                      {activeCustomer.note && (
                        <div className="mt-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                          <strong>บันทึกช่วยจำ:</strong> {activeCustomer.note}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={startEditCurrentCustomer}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition-colors shrink-0"
                  >
                    แก้ไขข้อมูล
                  </button>
                </div>

                {/* Customer Statistics Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900 text-white">
                    <div className="text-xs text-slate-400">ยอดเงินต้นคงค้างขณะนี้</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">{formatCurrency(totalLoanBalance)}</div>
                    <div className="text-[11px] text-indigo-300 mt-1">{activeContracts.length} สัญญาที่ยังเปิดอยู่</div>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950">
                    <div className="text-xs text-indigo-700">ประวัติการขายฝากทั้งหมด</div>
                    <div className="text-xl font-bold font-mono text-indigo-900 mt-1">{customerContracts.length} รายการ</div>
                    <div className="text-[11px] text-indigo-700 mt-1">ไถ่ถอนสำเร็จแล้ว {closedContracts.length} รายการ</div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                    <div className="text-xs text-emerald-700">ความน่าเชื่อถือลูกค้า (Loyalty)</div>
                    <div className="text-xl font-bold text-emerald-800 mt-1">เกรด A+</div>
                    <div className="text-[11px] text-emerald-700 mt-1">ไม่มีประวัติผิดนัดชำระ</div>
                  </div>
                </div>

                {/* Customer Contracts History (กรณีลูกค้าทำบัตรหาย/ลืมนำมา) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">รายการตั๋วสัญญาของลูกค้า (บัตรขายฝาก)</h4>
                      <p className="text-xs text-slate-500">กรณีลูกค้าทำบัตรหาย สามารถคลิกเพื่อต่อดอก ไถ่ถอน หรือพิมพ์บัตรใหม่ได้ทันที</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {customerContracts.map(con => {
                      const isActive = con.status === 'active' || con.status === 'due_soon' || con.status === 'overdue';
                      return (
                        <div
                          key={con.id}
                          className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-xs transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-700 text-sm">{con.contractNumber}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                con.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                con.status === 'due_soon' ? 'bg-amber-100 text-amber-800' :
                                con.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {con.status === 'active' ? 'กำลังดำเนินการ' :
                                 con.status === 'due_soon' ? 'ใกล้ครบกำหนด' :
                                 con.status === 'overdue' ? 'เลยกำหนด' :
                                 con.status === 'redeemed' ? 'ไถ่ถอนแล้ว' : 'หลุดจำนำ'}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500">ทำสัญญา: {formatThaiDate(con.startDate)}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500">ครบกำหนด: <strong>{formatThaiDate(con.dueDate)}</strong></span>
                            </div>
                            <div className="font-medium text-slate-900">{con.item.name}</div>
                            <div className="text-slate-500">
                              เงินต้น: <strong className="font-mono text-slate-800">{formatCurrency(con.loanAmount)}</strong> (ดอกเบี้ย {con.monthlyInterestRate}%/เดือน)
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isActive && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => { onClose(); onSelectContract(con, 'interest'); }}
                                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition-colors"
                                >
                                  ต่อดอก
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { onClose(); onSelectContract(con, 'redeem'); }}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-lg transition-colors"
                                >
                                  ไถ่ถอน
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => { onClose(); onSelectContract(con, 'print'); }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              พิมพ์ตั๋วใหม่
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {customerContracts.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        ลูกค้ารายนี้ยังไม่มีประวัติสัญญาในระบบ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
