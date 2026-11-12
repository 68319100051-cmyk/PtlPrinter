import React, { useState } from 'react';
import { X, Database, Download, Upload, Archive, RefreshCw, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { PawnContract } from '../types/pawn';
import { exportDatabaseBackup, restoreDatabaseBackup, archiveClosedContracts, getArchivedContracts, saveArchivedContracts, saveContracts, getContracts, resetToSampleData } from '../utils/storage';
import { syncContractToCloud, syncCustomerToCloud, syncSettingsToCloud } from '../services/firebaseSync';
import { formatCurrency, formatThaiDate } from '../utils/thaiFormat';

interface BackupArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: PawnContract[];
  onDataChanged: () => void;
}

export const BackupArchiveModal: React.FC<BackupArchiveModalProps> = ({
  isOpen,
  onClose,
  contracts,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'archive' | 'archive_list'>('backup');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [archivedList, setArchivedList] = useState<PawnContract[]>(() => getArchivedContracts());

  if (!isOpen) return null;

  const closedContractsCount = contracts.filter(c => c.status === 'redeemed' || c.status === 'forfeited').length;

  const handleDownloadBackup = () => {
    try {
      const json = exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `anchan-pawn-backup-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage({ text: 'ดาวน์โหลดไฟล์สำรองข้อมูล (.json) สำเร็จแล้ว' });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ text: `เกิดข้อผิดพลาดในการดาวน์โหลด: ${errorMsg}`, isError: true });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result as string;
      const result = restoreDatabaseBackup(content);
      if (result.success) {
        setStatusMessage({ text: 'กู้คืนฐานข้อมูลและกำลังซิงค์ขึ้น Firebase Cloud...' });
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.contracts)) {
            for (const c of parsed.contracts) {
              await syncContractToCloud(c);
            }
          }
          if (Array.isArray(parsed.customers)) {
            for (const cust of parsed.customers) {
              await syncCustomerToCloud(cust);
            }
          }
          if (parsed.settings) {
            await syncSettingsToCloud(parsed.settings);
          }
          setStatusMessage({ text: 'กู้คืนฐานข้อมูลและบันทึกลง Firebase Firestore สำเร็จเรียบร้อย!' });
        } catch (syncErr) {
          console.error('Error syncing restored data to Firebase:', syncErr);
        }
        setArchivedList(getArchivedContracts());
        onDataChanged();
      } else {
        setStatusMessage({ text: result.message, isError: true });
      }
    };
    reader.readAsText(file);
  };

  const handleRunArchive = () => {
    if (closedContractsCount === 0) {
      alert('ไม่มีรายการสัญญาที่ปิดแล้ว (ไถ่ถอนแล้ว/หลุดจำนำ) สำหรับย้ายในขณะนี้');
      return;
    }

    const confirmed = window.confirm(
      `คุณต้องการย้ายสัญญาที่ปิดแล้วจำนวน ${closedContractsCount} รายการ ไปยังคลังเอกสารแยกต่างหากเพื่อเพิ่มความเร็วของระบบใช่หรือไม่?`
    );
    if (!confirmed) return;

    const result = archiveClosedContracts();
    setArchivedList(getArchivedContracts());
    onDataChanged();
    setStatusMessage({
      text: `ย้ายข้อมูลสัญญาที่ปิดแล้วจำนวน ${result.archivedCount} รายการ ไปยังคลังเก็บเรียบร้อย`,
    });
  };

  const handleRestoreFromArchive = (contractId: string) => {
    const target = archivedList.find(c => c.id === contractId);
    if (!target) return;

    // Remove from archive and add to active contracts
    const updatedArchive = archivedList.filter(c => c.id !== contractId);
    const activeContracts = getContracts();
    const updatedActive = [target, ...activeContracts];

    saveArchivedContracts(updatedArchive);
    saveContracts(updatedActive);
    setArchivedList(updatedArchive);
    onDataChanged();
    setStatusMessage({ text: `นำสัญญารหัส ${target.contractNumber} กลับมายังหน้าจอหลักเรียบร้อย` });
  };

  const handleResetSample = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นข้อมูลตัวอย่างเริ่มต้นใช่หรือไม่?')) {
      resetToSampleData();
      setArchivedList(getArchivedContracts());
      onDataChanged();
      setStatusMessage({ text: 'รีเซ็ตข้อมูลตัวอย่างเรียบร้อย' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto no-print">
      <div className="w-full h-full sm:h-auto sm:max-h-[92vh] max-w-2xl bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">ระบบสำรองข้อมูล & คลังเอกสารเก่า</h3>
              <p className="text-xs text-slate-400">ป้องกันข้อมูลสูญหาย และลดขนาดฐานข้อมูลหลักเพื่อความเร็วสูงสุด</p>
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
        <div className="flex border-b border-slate-200 bg-slate-100 px-6 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-t-xl font-medium transition-colors ${
              activeTab === 'backup' ? 'bg-white text-indigo-700 shadow-xs border-t border-x border-slate-200' : 'text-slate-600'
            }`}
          >
            สำรอง & กู้คืนไฟล์ (Backup)
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 rounded-t-xl font-medium transition-colors ${
              activeTab === 'archive' ? 'bg-white text-indigo-700 shadow-xs border-t border-x border-slate-200' : 'text-slate-600'
            }`}
          >
            ย้ายข้อมูลสัญญาปิดแล้ว ({closedContractsCount})
          </button>
          <button
            onClick={() => setActiveTab('archive_list')}
            className={`px-4 py-2 rounded-t-xl font-medium transition-colors ${
              activeTab === 'archive_list' ? 'bg-white text-indigo-700 shadow-xs border-t border-x border-slate-200' : 'text-slate-600'
            }`}
          >
            ดูคลังสัญญาเก่า ({archivedList.length})
          </button>
        </div>

        <div className="p-6 space-y-4">
          {statusMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMessage.isError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              {statusMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">ดาวน์โหลดไฟล์สำรองข้อมูล (Export Backup)</h4>
                  <p className="text-slate-500 mt-0.5">ส่งออกข้อมูลสัญญา ลูกค้า และการตั้งค่าร้านทั้งหมดเป็นไฟล์ JSON</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-xs shrink-0"
                >
                  <Download className="w-4 h-4" />
                  ดาวน์โหลดไฟล์
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">กู้คืนข้อมูลจากไฟล์สำรอง (Restore Backup)</h4>
                  <p className="text-slate-500 mt-0.5">เลือกไฟล์ .json ที่เคยสำรองไว้เพื่อนำข้อมูลกลับมา</p>
                </div>
                <label className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-xs cursor-pointer shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>เลือกไฟล์กู้คืน</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-400">
                <span>ต้องการเริ่มต้นทดสอบใหม่ทั้งหมด?</span>
                <button
                  type="button"
                  onClick={handleResetSample}
                  className="text-xs text-rose-600 hover:text-rose-800 underline"
                >
                  โหลดข้อมูลตัวอย่างเริ่มต้น (Reset Sample Data)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ARCHIVE WIZARD */}
          {activeTab === 'archive' && (
            <div className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-amber-900">
                <h4 className="font-bold text-sm">การแยกเก็บสัญญาที่ปิดแล้ว (Database Archiving)</h4>
                <p>
                  เมื่อเปิดใช้งานโปรแกรมไปเป็นเวลานาน รายการสัญญาที่ไถ่ถอนแล้วหรือหลุดจำนำจะสะสมเพิ่มขึ้น การย้ายข้อมูลเก่าไปแยกเก็บไว้ในคลังจะทำให้ฐานข้อมูลการทำงานหลักมีขนาดเล็ก โหลดเร็วขึ้น ทำงานลื่นไหล ไม่ต้องสลับหน้าจอไปมา
                </p>
                <div className="bg-white p-3 rounded-lg border border-amber-200 font-mono font-semibold text-slate-800">
                  พบสัญญาที่ปิดแล้วในระบบหลัก: <span className="text-rose-600">{closedContractsCount}</span> รายการ
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={closedContractsCount === 0}
                  onClick={handleRunArchive}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                    closedContractsCount > 0
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  ดำเนินการย้ายข้อมูลเก่า ({closedContractsCount} รายการ)
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ARCHIVE LIST & RESTORE */}
          {activeTab === 'archive_list' && (
            <div className="space-y-3 text-xs">
              <div className="text-slate-500">
                รายการสัญญาที่ถูกจัดเก็บในคลังข้อมูลเก่า สามารถคลิก "นำกลับมา" หากต้องการนำสัญญานั้นกลับเข้าสู่ระบบหลัก
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {archivedList.map(c => (
                  <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{c.contractNumber} · {c.customerSnapshot.firstName} {c.customerSnapshot.lastName}</div>
                      <div className="text-slate-500">{c.item.name} · เงินต้น {formatCurrency(c.loanAmount)}</div>
                      <div className="text-[11px] text-slate-400">สถานะ: {c.status === 'redeemed' ? 'ไถ่ถอนแล้ว' : 'หลุดจำนำ'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreFromArchive(c.id)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-indigo-700 font-medium rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      นำกลับมา
                    </button>
                  </div>
                ))}
                {archivedList.length === 0 && (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    ยังไม่มีสัญญาในคลังเอกสารเก่า
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
