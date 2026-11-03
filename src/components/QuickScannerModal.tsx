import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Barcode,
  Search,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Volume2,
  VolumeX,
  Keyboard,
  User,
  Laptop
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Customer, PawnContract } from '../types/pawn';
import { SecondhandBuyIn } from '../types/buyIn';

interface QuickScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  contracts: PawnContract[];
  buyIns: SecondhandBuyIn[];
  onSelectCustomer: (customer: Customer, contract?: PawnContract, buyIn?: SecondhandBuyIn) => void;
}

export const QuickScannerModal: React.FC<QuickScannerModalProps> = ({
  isOpen,
  onClose,
  customers,
  contracts,
  buyIns,
  onSelectCustomer,
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'gun_manual' | 'file'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanResultFeedback, setScanResultFeedback] = useState<{
    status: 'success' | 'not_found' | 'error';
    message: string;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web Audio API beep
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz (A5)
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);

      // Haptic feedback if supported on mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } catch {
      // AudioContext might be blocked before first user gesture
    }
  };

  // Smart Lookup Engine
  const resolveScannedCode = (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    // 0. Handle Web URL if scanned (e.g., https://...?customer=cust-1234 or ?c=1234)
    if (text.startsWith('http://') || text.startsWith('https://') || text.includes('customer=') || text.includes('c=')) {
      try {
        let extractedCust: string | null = null;
        let extractedContract: string | null = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
          const urlObj = new URL(text);
          extractedCust = urlObj.searchParams.get('customer') || urlObj.searchParams.get('c');
          extractedContract = urlObj.searchParams.get('contract') || urlObj.searchParams.get('contractNo');
        } else if (text.includes('customer=')) {
          extractedCust = text.split('customer=')[1]?.split('&')[0];
        } else if (text.includes('c=')) {
          extractedCust = text.split('c=')[1]?.split('&')[0];
        }

        if (extractedCust) {
          const cleanCust = decodeURIComponent(extractedCust).trim().toLowerCase();
          const matched = customers.find(c =>
            c.id.toLowerCase() === cleanCust ||
            c.citizenId === cleanCust ||
            c.id.toLowerCase().endsWith(cleanCust) ||
            c.citizenId.endsWith(cleanCust)
          );
          if (matched) {
            const matchedContract = extractedContract
              ? contracts.find(con => con.contractNumber.toLowerCase() === extractedContract.toLowerCase() || con.id === extractedContract)
              : undefined;
            handleSuccessMatch(matched, matchedContract);
            return;
          }
        }
      } catch (e) {
        console.warn('URL parsing error in scanner:', e);
      }
    }

    // 1. Direct CUSTOMER: ID or CUST- format
    let targetCustId = '';
    if (text.startsWith('CUSTOMER:')) {
      targetCustId = text.replace('CUSTOMER:', '').trim();
    } else if (text.startsWith('CUST:')) {
      targetCustId = text.replace('CUST:', '').trim();
    } else if (text.startsWith('CUST-')) {
      targetCustId = text.replace('CUST-', '').trim();
    }

    if (targetCustId) {
      const matched = customers.find(c => c.id === targetCustId || c.id.endsWith(targetCustId) || c.citizenId.endsWith(targetCustId));
      if (matched) {
        handleSuccessMatch(matched);
        return;
      }
    }

    // 2. Direct Customer ID match
    const custById = customers.find(c => c.id.toLowerCase() === text.toLowerCase());
    if (custById) {
      handleSuccessMatch(custById);
      return;
    }

    // 3. Citizen ID match (13 digits or unformatted)
    const cleanedDigits = text.replace(/\D/g, '');
    if (cleanedDigits.length >= 7) {
      const custByCitizen = customers.find(c => c.citizenId.includes(cleanedDigits) || cleanedDigits.includes(c.citizenId));
      if (custByCitizen) {
        handleSuccessMatch(custByCitizen);
        return;
      }
    }

    // 4. Phone number match
    if (cleanedDigits.length >= 9) {
      const custByPhone = customers.find(c => c.phone.replace(/\D/g, '').includes(cleanedDigits) || cleanedDigits.includes(c.phone.replace(/\D/g, '')));
      if (custByPhone) {
        handleSuccessMatch(custByPhone);
        return;
      }
    }

    // 5. Contract Number match (e.g. AC-6911001 or barcode on ticket)
    const matchedContract = contracts.find(c => c.contractNumber.toLowerCase() === text.toLowerCase() || c.id === text);
    if (matchedContract) {
      const cust = customers.find(c => c.id === matchedContract.customerId) || matchedContract.customerSnapshot;
      handleSuccessMatch(cust, matchedContract, undefined);
      return;
    }

    // 6. Buy-In Agreement Number match (e.g. BUY-67-001)
    const matchedBuyIn = buyIns.find(b => b.buyInNumber.toLowerCase() === text.toLowerCase() || b.id === text);
    if (matchedBuyIn) {
      const cust = customers.find(c => c.id === matchedBuyIn.sellerSnapshot.id || c.citizenId === matchedBuyIn.sellerSnapshot.citizenId) || matchedBuyIn.sellerSnapshot;
      handleSuccessMatch(cust, undefined, matchedBuyIn);
      return;
    }

    // 7. Serial Number (S/N) match on any active equipment!
    const contractBySn = contracts.find(c => {
      const sn1 = c.item.notebook?.serialNumber?.toLowerCase();
      const sn2 = c.item.printer?.serialNumber?.toLowerCase();
      const sn3 = c.item.phone?.serialNumber?.toLowerCase();
      const imei = c.item.phone?.imei?.toLowerCase();
      const sn4 = c.item.itGadget?.serialNumber?.toLowerCase();
      const q = text.toLowerCase();
      return (sn1 && sn1 === q) || (sn2 && sn2 === q) || (sn3 && sn3 === q) || (imei && imei === q) || (sn4 && sn4 === q);
    });

    if (contractBySn) {
      const cust = customers.find(c => c.id === contractBySn.customerId) || contractBySn.customerSnapshot;
      handleSuccessMatch(cust, contractBySn, undefined);
      return;
    }

    // 8. Match by customer name
    const custByName = customers.find(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(text.toLowerCase()) ||
      text.toLowerCase().includes(`${c.firstName} ${c.lastName}`.toLowerCase())
    );
    if (custByName) {
      handleSuccessMatch(custByName);
      return;
    }

    // Not found
    setScanResultFeedback({
      status: 'not_found',
      message: `ไม่พบข้อมูลลูกค้าที่ตรงกับรหัส "${text}"`,
    });
  };

  const handleSuccessMatch = (cust: Customer, contract?: PawnContract, buyIn?: SecondhandBuyIn) => {
    playBeep();
    setScanResultFeedback({
      status: 'success',
      message: `พบข้อมูล: ${cust.prefix}${cust.firstName} ${cust.lastName}`,
    });

    // Short timeout to let user see the green tick and hear chime
    setTimeout(() => {
      stopCamera();
      onSelectCustomer(cust, contract, buyIn);
    }, 450);
  };

  // Start Camera Scanning
  const startCamera = async () => {
    setCameraError(null);
    setScanResultFeedback(null);

    try {
      if (html5QrCodeRef.current) {
        await stopCamera();
      }

      const scannerElement = document.getElementById('qr-camera-viewport');
      if (!scannerElement) return;

      const html5QrCode = new Html5Qrcode('qr-camera-viewport');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
        ],
      };

      await html5QrCode.start(
        { facingMode: 'environment' }, // Prefer back camera
        config,
        (decodedText) => {
          resolveScannedCode(decodedText);
        },
        () => {
          // ignore scan frame misses
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError('ไม่สามารถเปิดกล้องได้ (เบราว์เซอร์ไม่อนุญาต หรือไม่มีกล้อง) กรุณาใช้โหมดยิงด้วยปืนบาร์โค้ด');
      setIsScanning(false);
      setActiveMode('gun_manual');
    }
  };

  // Stop Camera Scanning
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  // Switch modes effect
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
      if (activeMode === 'gun_manual') {
        setTimeout(() => manualInputRef.current?.focus(), 150);
      }
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode]);

  // Handle image file upload for scanning
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-file-dummy');
      const result = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      resolveScannedCode(result);
    } catch (err) {
      setScanResultFeedback({
        status: 'error',
        message: 'ไม่พบ QR Code ในรูปภาพที่อัปโหลด กรุณาลองใช้รูปที่ชัดเจนขึ้น',
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    resolveScannedCode(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-print">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold shadow-xs">
              <Camera className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">สแกน QR Code ค้นหาลูกค้าด่วน</h2>
              <p className="text-xs text-slate-400">สแกนจากสติกเกอร์ที่ติดอยู่บนเครื่องโน็ตบุ้ค / คอมพิวเตอร์ / ปริ้นเตอร์</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Input Mode Selector */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveMode('camera')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              activeMode === 'camera'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>ใช้กล้องสแกนสด</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('gun_manual')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              activeMode === 'gun_manual'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>ปืนบาร์โค้ด / ป้อนรหัส</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('file')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              activeMode === 'file'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>อัปโหลดรูปภาพ</span>
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden">
          {/* Feedback Overlay */}
          {scanResultFeedback && (
            <div
              className={`absolute top-4 left-4 right-4 z-20 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-150 ${
                scanResultFeedback.status === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                {scanResultFeedback.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{scanResultFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setScanResultFeedback(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* MODE 1: LIVE CAMERA VIEWPORT */}
          {activeMode === 'camera' && (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden border-2 border-amber-400 shadow-2xl bg-black flex items-center justify-center">
                <div id="qr-camera-viewport" className="w-full h-full object-cover" />

                {/* Targeting Frame Box & Animated Laser Line */}
                <div className="absolute inset-8 border-2 border-white/40 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                  </div>
                  {/* Laser scan line animation */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#f59e0b] animate-pulse" />
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center">
                <p className="text-xs text-slate-300 font-medium">นำกล้องไปส่องที่สติกเกอร์ QR ประจำเครื่องของลูกค้า</p>
                <p className="text-[11px] text-slate-500 mt-0.5">ระบบจะตรวจจับอัตโนมัติและแสดงแฟ้มข้อมูลทันที</p>
              </div>
            </div>
          )}

          {/* MODE 2: USB BARCODE SCANNER / MANUAL INPUT */}
          {activeMode === 'gun_manual' && (
            <form onSubmit={handleManualSubmit} className="w-full max-w-md bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 mx-auto flex items-center justify-center">
                <Barcode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">ยิงบาร์โค้ด หรือ พิมพ์รหัสค้นหา</h3>
                <p className="text-xs text-slate-400 mt-1">
                  รองรับ: รหัสลูกค้า (CUST-...), เลขบัตร ปชช., เบอร์โทร, เลขสัญญา (AC-...), หรือ Serial Number (S/N) ของเครื่อง
                </p>
              </div>

              <div className="relative">
                <input
                  ref={manualInputRef}
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="สแกนด้วยปืนบาร์โค้ด หรือกรอกรหัสที่นี่..."
                  className="w-full px-4 py-3 bg-slate-800 border-2 border-amber-400 rounded-xl text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>ค้นหาข้อมูลลูกค้า</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 text-left bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50 space-y-1 font-mono">
                <div>• ตัวอย่าง: CUST-001 หรือ 0834268058</div>
                <div>• หากใช้ปืนบาร์โค้ด USB: สามารถกดยิงได้ทันที</div>
              </div>
            </form>
          )}

          {/* MODE 3: FILE UPLOAD */}
          {activeMode === 'file' && (
            <div className="w-full max-w-md bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 text-indigo-400 mx-auto flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">อัปโหลดรูปภาพสติกเกอร์ QR</h3>
                <p className="text-xs text-slate-400 mt-1">
                  เลือกรูปถ่ายสติกเกอร์จากเครื่องคอมพิวเตอร์หรือโทรศัพท์มือถือ
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-xl text-slate-300 hover:text-white transition-colors flex flex-col items-center justify-center gap-2 bg-slate-800/40 cursor-pointer"
              >
                <Upload className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-semibold">คลิกเพื่อเลือกไฟล์รูปภาพ QR Code</span>
                <span className="text-[10px] text-slate-500">รองรับไฟล์ JPG, PNG, WEBP</span>
              </button>

              <div id="qr-file-dummy" className="hidden" />
            </div>
          )}
        </div>

        {/* Footer Quick Reference */}
        <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 text-slate-400 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            <span>พัทลุงปริ้นเตอร์ คอมพิวเตอร์ · Barcode & QR Auto-Detection</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
