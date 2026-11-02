import React, { useState } from 'react';
import { ShieldAlert, X, KeyRound, Check } from 'lucide-react';
import { UserAccount, UserRole } from '../types/pawn';

interface SecurityAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: (authorizerName: string, reason: string) => void;
  requiredRole?: UserRole; // 'manager' or 'admin'
  actionTitle: string;
  actionDescription: string;
  users: UserAccount[];
}

export const SecurityAuthModal: React.FC<SecurityAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
  requiredRole = 'manager',
  actionTitle,
  actionDescription,
  users,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  // Filter users who have required permission
  const eligibleUsers = users.filter(u => {
    if (requiredRole === 'admin') return u.role === 'admin';
    return u.role === 'admin' || u.role === 'manager';
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId) {
      setError('กรุณาเลือกผู้มีอำนาจอนุมัติ');
      return;
    }

    if (!pin) {
      setError('กรุณากรอกรหัส PIN อนุมัติ');
      return;
    }

    if (!reason.trim()) {
      setError('กรุณาระบุเหตุผลในการแก้ไข/ดำเนินการ เพื่อบันทึกประวัติการตรวจสอบ');
      return;
    }

    const targetUser = users.find(u => u.id === selectedUserId);
    if (!targetUser) {
      setError('ไม่พบผู้ใช้งานนี้ในระบบ');
      return;
    }

    if (targetUser.pin !== pin) {
      setError('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      return;
    }

    // Success
    onAuthorized(targetUser.name, reason.trim());
    setPin('');
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">ระบบรักษาความปลอดภัย</h3>
              <p className="text-xs text-amber-700">ต้องใช้รหัสผ่านผู้จัดการหรือเจ้าของร้าน</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleVerify} className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">รายการที่ขอดำเนินการ</div>
            <div className="font-medium text-slate-900 text-sm">{actionTitle}</div>
            <div className="text-xs text-slate-600 mt-0.5">{actionDescription}</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              เลือกผู้มีอำนาจอนุมัติ (Manager / Admin)
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">-- กรุณาเลือกผู้อนุมัติ --</option>
              {eligibleUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === 'admin' ? 'เจ้าของร้าน/Admin' : 'ผู้จัดการ/Manager'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              รหัส PIN อนุมัติ (4-6 หลัก)
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="กรอกรหัส PIN"
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-300 bg-white text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">ค่าเริ่มต้นทดสอบ: Admin = 1234, Manager = 8888</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              เหตุผลในการขอแก้ไข/ดำเนินการ <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เช่น ลูกค้านำหลักฐานมาเปลี่ยนน้ำหนักทอง, แก้ไขข้อมูลเลขบัตรประชาชนที่พิมพ์ผิด"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
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
              อนุมัติการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
