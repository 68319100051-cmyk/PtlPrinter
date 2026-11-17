import React, { useState, useMemo } from 'react';
import { X, Check, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PawnContract, ContractAmendmentLog, FlaggedSerial, SerialCheckMatch } from '../types/pawn';
import { SecondhandBuyIn } from '../types/buyIn';
import { formatCurrency } from '../utils/thaiFormat';
import { checkSerial, collectSerials } from '../utils/serialCheck';

interface EditContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: PawnContract;
  authorizerName: string;
  auditReason: string;
  onSave: (updatedContract: PawnContract) => void;
  existingContracts?: PawnContract[];
  archivedContracts?: PawnContract[];
  secondhandBuyIns?: SecondhandBuyIn[];
  flaggedSerials?: FlaggedSerial[];
}

export const EditContractModal: React.FC<EditContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  authorizerName,
  auditReason,
  onSave,
  existingContracts = [],
  archivedContracts = [],
  secondhandBuyIns = [],
  flaggedSerials = [],
}) => {
  const [loanAmount, setLoanAmount] = useState<number>(contract.loanAmount);
  const [monthlyInterestRate, setMonthlyInterestRate] = useState<number>(contract.monthlyInterestRate);
  const [storageLocation, setStorageLocation] = useState<string>(contract.storageLocation || '');
  const [note, setNote] = useState<string>(contract.note || '');
  const [itemName, setItemName] = useState<string>(contract.item.name);

  const serialMatches = useMemo<SerialCheckMatch[]>(() => {
    const serials = collectSerials(contract.item);
    if (serials.length === 0) return [];
    const results: SerialCheckMatch[] = [];
    for (const s of serials) {
      results.push(
        ...checkSerial(s, {
          contracts: existingContracts,
          archivedContracts,
          secondhandBuyIns,
          flagged: flaggedSerials,
          excludeContractId: contract.id,
          customerId: contract.customerId,
          customerCitizenId: contract.customerSnapshot?.citizenId,
          isImei: contract.item.category === 'phone',
        })
      );
    }
    return results;
  }, [contract, existingContracts, archivedContracts, secondhandBuyIns, flaggedSerials]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const changesSummary = `แก้ไขโดย ${authorizerName}: เงินต้นเดิม ${formatCurrency(contract.loanAmount)} -> ${formatCurrency(loanAmount)}, ดอกเบี้ย ${contract.monthlyInterestRate}% -> ${monthlyInterestRate}%`;

    const newLog: ContractAmendmentLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      authorizedBy: authorizerName,
      reason: auditReason,
      changesSummary,
    };

    const updatedContract: PawnContract = {
      ...contract,
      loanAmount,
      monthlyInterestRate,
      storageLocation: storageLocation.trim(),
      note: note.trim(),
      item: {
        ...contract.item,
        name: itemName.trim(),
      },
      ...(collectSerials(contract.item).length > 0
        ? {
            serialCheck: {
              checkedAt: new Date().toISOString(),
              results: serialMatches,
              ...(contract.serialCheck?.overriddenBy
                ? {
                    overriddenBy: contract.serialCheck.overriddenBy,
                    overrideReason: contract.serialCheck.overrideReason,
                  }
                : {}),
            },
          }
        : {}),
      amendmentLogs: [...contract.amendmentLogs, newLog],
    };

    onSave(updatedContract);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto no-print">
      <div className="w-full h-full sm:h-auto sm:max-h-[92vh] max-w-lg bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-amber-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-700 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">แก้ไขสาระสัญญา (ได้รับการอนุมัติแล้ว)</h3>
              <p className="text-xs text-amber-100">สัญญาเลขที่: <span className="font-mono font-bold">{contract.contractNumber}</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-amber-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 space-y-1">
            <div>ผู้อนุมัติการแก้ไข: <strong>{authorizerName}</strong></div>
            <div>เหตุผลที่ระบุ: <em>"{auditReason}"</em></div>
          </div>

          {serialMatches.length > 0 && (
            <div className="p-2.5 rounded-xl border border-amber-400 bg-amber-50 text-amber-900 space-y-1 text-[11px]">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ผลตรวจเลขเครื่องซ้ำกับรายการอื่นในระบบ</span>
              </div>
              <ul className="pl-5 list-disc space-y-0.5">
                {serialMatches.map((m, idx) => (
                  <li key={`${m.refId}-${idx}`}>
                    <strong>{m.label}:</strong> {m.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-medium mb-1">ชื่อรายการทรัพย์สิน</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">ยอดเงินต้น (บาท)</label>
              <input
                type="number"
                step="100"
                value={loanAmount}
                onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">อัตราดอกเบี้ย (% ต่อเดือน)</label>
              <input
                type="number"
                step="0.05"
                value={monthlyInterestRate}
                onChange={(e) => setMonthlyInterestRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">สถานที่จัดเก็บ</label>
            <input
              type="text"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder="เช่น ตู้เซฟ A-01"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">บันทึกเพิ่มเติม</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white resize-none"
            />
          </div>

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
              className="px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              บันทึกการแก้ไขและลงประวัติ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
