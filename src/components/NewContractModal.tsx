import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Plus,
  Check,
  Search,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Layers,
  Laptop,
  Monitor,
  Printer,
  Smartphone,
  Cpu,
  HardDrive,
  Package,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import {
  Customer,
  PawnContract,
  PawnItem,
  ItemCategory,
  ShopSettings,
  UserAccount,
  NotebookItemDetails,
  ComputerItemDetails,
  PrinterItemDetails,
  PhoneDetails,
  ItGadgetDetails
} from '../types/pawn';
import {
  formatCurrency,
  formatThaiDate,
  calculateTieredInterestRate,
  addMonthsToDate,
  addMonthsAndDaysToDate,
  calculateDurationFromDates,
  formatDurationText,
  formatCitizenId,
  formatPhone
} from '../utils/thaiFormat';
import { generateNextContractNumber } from '../utils/storage';

interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: PawnContract, newCustomer?: Customer) => void;
  customers: Customer[];
  existingContracts: PawnContract[];
  settings: ShopSettings;
  currentUser: UserAccount;
  initialCustomer?: Customer | null;
}

const COMMON_NOTEBOOK_BRANDS = ['Asus', 'Acer', 'Lenovo', 'Dell', 'HP', 'Apple', 'MSI', 'Huawei'];
const COMMON_PRINTER_BRANDS = ['Epson', 'Canon', 'Brother', 'HP'];
const COMMON_PRINTER_MODELS = [
  'EcoTank L3250 Wi-Fi',
  'EcoTank L4260 Duplex Wi-Fi',
  'EcoTank L3110',
  'EcoTank L121',
  'PIXMA G3010 Wi-Fi',
  'PIXMA G2010',
  'DCP-T420W Wi-Fi',
  'DCP-T520W Duplex',
  'Smart Tank 515 Wi-Fi',
];

export const NewContractModal: React.FC<NewContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customers,
  existingContracts,
  settings,
  currentUser,
  initialCustomer,
}) => {
  // Mode: select existing or new customer
  const [customerMode, setCustomerMode] = useState<'search' | 'new'>('search');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer || null);

  React.useEffect(() => {
    if (isOpen && initialCustomer) {
      setSelectedCustomer(initialCustomer);
      setCustomerMode('search');
    }
  }, [isOpen, initialCustomer]);

  // New Customer fields
  const [newCustCitizenId, setNewCustCitizenId] = useState('');
  const [newCustPrefix, setNewCustPrefix] = useState('นาย');
  const [newCustFirstName, setNewCustFirstName] = useState('');
  const [newCustLastName, setNewCustLastName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustLineId, setNewCustLineId] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('อำเภอเมือง จังหวัดพัทลุง 93000');
  const [newCustIsVip, setNewCustIsVip] = useState(false);

  // Item category (Computer, Laptop, Printer, Phone, IT Gadget)
  const [category, setCategory] = useState<ItemCategory>('notebook');
  const [itemName, setItemName] = useState('Asus ROG Strix G16 (Core i7 / RAM 16GB / RTX 4060)');
  const [itemDescription, setItemDescription] = useState('โน็ตบุ้คเกมมิ่ง สภาพ 98% สายชาร์จแท้ ครบกล่อง ปลดล็อคคลาวด์แล้ว');
  const [estimatedValue, setEstimatedValue] = useState<number>(40000);
  const [storageLocation, setStorageLocation] = useState('ตู้ไอที ชั้น 2 ล็อกเกอร์ B-01 พัทลุง');
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
  ]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Notebook fields
  const [nbBrand, setNbBrand] = useState('Asus');
  const [nbModel, setNbModel] = useState('ROG Strix G16');
  const [nbSerial, setNbSerial] = useState('R90Z8912A004');
  const [nbProcessor, setNbProcessor] = useState('Intel Core i7-13650HX');
  const [nbRam, setNbRam] = useState<number>(16);
  const [nbStorage, setNbStorage] = useState('SSD 1TB M.2 NVMe');
  const [nbGpu, setNbGpu] = useState('NVIDIA GeForce RTX 4060');
  const [nbBattery, setNbBattery] = useState('เก็บไฟดีมาก (> 3 ชม.)');
  const [nbHasCharger, setNbHasCharger] = useState(true);
  const [nbHasBag, setNbHasBag] = useState(true);
  const [nbIcloudStatus, setNbIcloudStatus] = useState<'signed_out' | 'unlocked' | 'locked'>('unlocked');

  // 2. Computer PC fields
  const [pcBrandOrCustom, setPcBrandOrCustom] = useState('ประกอบคัสตอม (Custom Gaming PC)');
  const [pcModelOrCase, setPcModelOrCase] = useState('Case NZXT H5 Flow RGB สีดำ');
  const [pcProcessor, setPcProcessor] = useState('Intel Core i5-13400F');
  const [pcRam, setPcRam] = useState<number>(32);
  const [pcStorage, setPcStorage] = useState('SSD 1TB M.2 NVMe');
  const [pcGpu, setPcGpu] = useState('NVIDIA GeForce RTX 3060 12GB');
  const [pcMonitor, setPcMonitor] = useState('AOC 24G2SP 24" IPS 165Hz');
  const [pcAccessories, setPcAccessories] = useState('จอ 24 นิ้ว, เมาส์, คีย์บอร์ด, สายไฟ AC x2, สาย HDMI');

  // 3. Printer fields
  const [prBrand, setPrBrand] = useState('Epson');
  const [prModel, setPrModel] = useState('EcoTank L3250 Wi-Fi');
  const [prSerial, setPrSerial] = useState('X8TY019942');
  const [prType, setPrType] = useState<'ink_tank' | 'laser' | 'all_in_one' | 'dot_matrix'>('ink_tank');
  const [prInkSystem, setPrInkSystem] = useState<'genuine_tank' | 'cartridge' | 'mod_tank'>('genuine_tank');
  const [prHeadCondition, setPrHeadCondition] = useState<'normal' | 'need_clean'>('normal');
  const [prHasPowerCable, setPrHasPowerCable] = useState(true);
  const [prHasUsbCable, setPrHasUsbCable] = useState(true);

  // 4. Phone fields
  const [phoneBrand, setPhoneBrand] = useState('Apple');
  const [phoneModel, setPhoneModel] = useState('iPhone 16 Pro Max');
  const [phoneStorage, setPhoneStorage] = useState('256GB');
  const [phoneImei, setPhoneImei] = useState('358921098877665');
  const [phoneSerialNumber, setPhoneSerialNumber] = useState('XJ99M7890KL');
  const [phoneIcloudStatus, setPhoneIcloudStatus] = useState<'signed_out' | 'locked' | 'unlocked'>('signed_out');
  const [phoneAccessories, setPhoneAccessories] = useState('กล่องแท้, สายชาร์จแท้');

  // 5. IT Gadget fields
  const [gtType, setGtType] = useState<'tablet' | 'monitor' | 'camera' | 'gpu_part' | 'console' | 'other'>('monitor');
  const [gtBrand, setGtBrand] = useState('AOC');
  const [gtModel, setGtModel] = useState('24G2SP 165Hz IPS');
  const [gtSerial, setGtSerial] = useState('');
  const [gtSpecs, setGtSpecs] = useState('จอมอนิเตอร์เกมมิ่ง 24 นิ้ว 165Hz รองรับ FreeSync พร้อมขาตั้งและหม้อแปลง');

  // Financial fields
  const [loanAmount, setLoanAmount] = useState<number>(20000);
  const [isTieredRate, setIsTieredRate] = useState<boolean>(settings.enableSteppedTiers);
  const [monthlyInterestRate, setMonthlyInterestRate] = useState<number>(
    settings.enableSteppedTiers
      ? calculateTieredInterestRate(20000, settings.tiers, settings.defaultMonthlyRate)
      : settings.defaultMonthlyRate
  );
  const [durationMonths, setDurationMonths] = useState<number>(settings.defaultDurationMonths || 2);
  const [durationDays, setDurationDays] = useState<number>(0);
  const [note, setNote] = useState('');

  // Flexible dates (supports custom startDate, dueDate, months, and days)
  const todayIso = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayIso);
  const [dueDate, setDueDate] = useState<string>(() => addMonthsAndDaysToDate(todayIso, settings.defaultDurationMonths || 2, 0));

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (newStart) {
      setDueDate(addMonthsAndDaysToDate(newStart, durationMonths, durationDays));
    }
  };

  const handleDurationMonthsChange = (newMonths: number) => {
    const m = Math.max(0, newMonths);
    setDurationMonths(m);
    setDueDate(addMonthsAndDaysToDate(startDate, m, durationDays));
  };

  const handleDurationDaysChange = (newDays: number) => {
    const d = Math.max(0, newDays);
    setDurationDays(d);
    setDueDate(addMonthsAndDaysToDate(startDate, durationMonths, d));
  };

  const handleDueDateChange = (newDue: string) => {
    setDueDate(newDue);
    if (newDue && startDate) {
      const { months, days } = calculateDurationFromDates(startDate, newDue);
      setDurationMonths(months);
      setDurationDays(days);
    }
  };

  const handlePresetSelect = (m: number, d: number) => {
    setDurationMonths(m);
    setDurationDays(d);
    setDueDate(addMonthsAndDaysToDate(startDate, m, d));
  };

  // Total period in months for interest calculation (e.g., 1 month + 15 days = 1.5 months; 15 days = 0.5 months)
  const totalDurationMonths = Math.max(0, durationMonths) + Math.max(0, durationDays) / 30;
  const totalInterest = Math.round(loanAmount * (monthlyInterestRate / 100) * totalDurationMonths);
  const monthlyInterest = Math.round(loanAmount * (monthlyInterestRate / 100));
  const dailyInterest = Math.round(monthlyInterest / 30);

  // Recalculate tiered rate whenever loanAmount changes
  const handleLoanAmountChange = (amount: number) => {
    setLoanAmount(amount);
    if (isTieredRate) {
      const calculatedRate = calculateTieredInterestRate(amount, settings.tiers, settings.defaultMonthlyRate);
      setMonthlyInterestRate(calculatedRate);
    }
  };

  // Preset helpers for categories
  const handleSelectCategory = (cat: ItemCategory) => {
    setCategory(cat);
    if (cat === 'notebook') {
      setItemName(`${nbBrand} ${nbModel} (${nbProcessor} / RAM ${nbRam}GB)`);
      setItemDescription(`โน็ตบุ้ค ${nbBrand} แรม ${nbRam}GB ${nbStorage} สภาพดี`);
      setEstimatedValue(32000);
      setLoanAmount(22000);
      setStorageLocation('ตู้ไอที ชั้น 2 ล็อกเกอร์ B-01 พัทลุง');
      setPhotos(['https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80']);
    } else if (cat === 'computer') {
      setItemName(`ชุดคอมพิวเตอร์พีซี ${pcProcessor} / ${pcGpu} / RAM ${pcRam}GB`);
      setItemDescription(`ชุดคอมพิวเตอร์เกมมิ่ง เคส ${pcModelOrCase} พร้อมอุปกรณ์`);
      setEstimatedValue(26000);
      setLoanAmount(18000);
      setStorageLocation('ชั้นวางคอมพิวเตอร์ โซน PC-02 พัทลุง');
      setPhotos(['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80']);
    } else if (cat === 'printer') {
      setItemName(`เครื่องพิมพ์ ${prBrand} ${prModel} (แท็งก์แท้ศูนย์)`);
      setItemDescription(`ปริ้นเตอร์มัลติฟังก์ชันระบบแท็งก์ ${prBrand} หัวพิมพ์สมบูรณ์`);
      setEstimatedValue(5000);
      setLoanAmount(3500);
      setStorageLocation('ชั้นวางสต็อกปริ้นเตอร์ โซน PR-01 พัทลุง');
      setPhotos(['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80']);
    } else if (cat === 'phone') {
      setItemName(`${phoneBrand} ${phoneModel} ${phoneStorage}`);
      setItemDescription(`สมาร์ทโฟน ${phoneBrand} ${phoneModel} ครบกล่อง ปลดล็อคแล้ว`);
      setEstimatedValue(35000);
      setLoanAmount(25000);
      setStorageLocation('ตู้ไอที ชั้น 2 ล็อกเกอร์ 14 พัทลุง');
      setPhotos(['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80']);
    } else if (cat === 'gadget_it') {
      setItemName(`จอภาพ ${gtBrand} ${gtModel}`);
      setItemDescription(gtSpecs);
      setEstimatedValue(6000);
      setLoanAmount(4000);
      setStorageLocation('ชั้นวางอุปกรณ์ไอที โซน G-02 พัทลุง');
      setPhotos(['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80']);
    }
  };

  // Camera handling
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      alert('ไม่สามารถเข้าถึงกล้องได้ กรุณาใช้การอัปโหลดรูปภาพแทน');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhotos(prev => [...prev, dataUrl]);
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Save new contract
  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();

    let targetCustomer: Customer;
    let newlyCreatedCustomer: Customer | undefined;

    if (customerMode === 'search') {
      if (!selectedCustomer) {
        alert('กรุณาเลือกข้อมูลลูกค้า หรือเลือกแท็บ "เพิ่มลูกค้าใหม่"');
        return;
      }
      targetCustomer = selectedCustomer;
    } else {
      if (!newCustFirstName.trim() || !newCustLastName.trim() || !newCustCitizenId.trim()) {
        alert('กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน (ชื่อ, นามสกุล, เลขบัตรประชาชน 13 หลัก)');
        return;
      }
      targetCustomer = {
        id: `cust-${Date.now()}`,
        citizenId: newCustCitizenId.replace(/\D/g, ''),
        prefix: newCustPrefix,
        firstName: newCustFirstName.trim(),
        lastName: newCustLastName.trim(),
        phone: newCustPhone.trim(),
        lineId: newCustLineId.trim(),
        address: newCustAddress.trim(),
        isVip: newCustIsVip,
        createdAt: new Date().toISOString(),
      };
      newlyCreatedCustomer = targetCustomer;
    }

    if (loanAmount <= 0) {
      alert('จำนวนเงินต้นต้องมากกว่า 0 บาท');
      return;
    }

    // Build IT PawnItem object
    const pawnItem: PawnItem = {
      id: `item-${Date.now()}`,
      category,
      name: itemName.trim() || `สินค้าไอที ${category}`,
      description: itemDescription.trim() || itemName,
      estimatedValue: estimatedValue || loanAmount * 1.3,
      photos,
      notebook: category === 'notebook' ? {
        brand: nbBrand,
        model: nbModel,
        serialNumber: nbSerial.trim().toUpperCase(),
        processor: nbProcessor,
        ramGb: nbRam,
        storage: nbStorage,
        gpu: nbGpu,
        batteryHealth: nbBattery,
        hasCharger: nbHasCharger,
        hasBag: nbHasBag,
        icloudStatus: nbIcloudStatus,
      } : undefined,
      computer: category === 'computer' ? {
        brandOrCustom: pcBrandOrCustom,
        modelOrCase: pcModelOrCase,
        processor: pcProcessor,
        ramGb: pcRam,
        storage: pcStorage,
        gpu: pcGpu,
        monitor: pcMonitor,
        accessories: pcAccessories.split(',').map(s => s.trim()).filter(Boolean),
      } : undefined,
      printer: category === 'printer' ? {
        brand: prBrand,
        model: prModel,
        serialNumber: prSerial.trim().toUpperCase(),
        printerType: prType,
        inkSystem: prInkSystem,
        headCondition: prHeadCondition,
        hasPowerCable: prHasPowerCable,
        hasUsbCable: prHasUsbCable,
      } : undefined,
      phone: category === 'phone' ? {
        brand: phoneBrand,
        model: phoneModel,
        storageGb: phoneStorage,
        imei: phoneImei.trim(),
        serialNumber: phoneSerialNumber.trim(),
        accessories: phoneAccessories.split(',').map(s => s.trim()).filter(Boolean),
        icloudStatus: phoneIcloudStatus,
      } : undefined,
      itGadget: category === 'gadget_it' ? {
        gadgetType: gtType,
        brand: gtBrand,
        model: gtModel,
        serialNumber: gtSerial.trim(),
        specsSummary: gtSpecs,
        accessories: [],
      } : undefined,
    };

    if (durationMonths <= 0 && durationDays <= 0) {
      alert('กรุณากำหนดระยะเวลาสัญญาอย่างน้อย 1 วัน หรือ 1 เดือน');
      return;
    }

    const nextContractNumber = generateNextContractNumber(existingContracts);

    const newContract: PawnContract = {
      id: `c-${Date.now()}`,
      contractNumber: nextContractNumber,
      customerId: targetCustomer.id,
      customerSnapshot: targetCustomer,
      item: pawnItem,
      loanAmount,
      monthlyInterestRate,
      isTieredRate,
      startDate,
      durationMonths,
      durationDays,
      dueDate,
      status: 'active',
      isLocked: true,
      storageLocation: storageLocation.trim(),
      interestPayments: [],
      amendmentLogs: [],
      note: note.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    onSave(newContract, newlyCreatedCustomer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Modal Header */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>เปิดสัญญาขายฝาก / จำนำไอทีใหม่</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-normal">
                  คอมพิวเตอร์ & ปริ้นเตอร์
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                พัทลุงปริ้นเตอร์ คอมพิวเตอร์ · บันทึกสัญญาขายฝาก ดอกเบี้ย และจัดเก็บอุปกรณ์ไอที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSaveContract} className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 text-slate-800 text-xs">
          
          {/* SECTION 1: CUSTOMER SELECTION / SMART LOOKUP */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>ข้อมูลผู้ขายฝาก (ลูกค้า)</span>
              </div>
              <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode('search')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    customerMode === 'search' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  ค้นหาลูกค้าเดิม (AG Customer)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    customerMode === 'new' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  + ลงทะเบียนลูกค้าใหม่
                </button>
              </div>
            </div>

            {customerMode === 'search' ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ, นามสกุล, หรือเลขบัตรประชาชน 13 หลัก..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  {customers
                    .filter(c =>
                      c.firstName.includes(customerSearchQuery) ||
                      c.lastName.includes(customerSearchQuery) ||
                      c.citizenId.includes(customerSearchQuery) ||
                      c.phone.includes(customerSearchQuery)
                    )
                    .map(cust => (
                      <div
                        key={cust.id}
                        onClick={() => setSelectedCustomer(cust)}
                        className={`p-2 cursor-pointer flex justify-between items-center text-xs transition-colors ${
                          selectedCustomer?.id === cust.id ? 'bg-amber-50/80 font-bold border-l-4 border-amber-500' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span className="text-slate-900">{cust.prefix}{cust.firstName} {cust.lastName}</span>
                          <span className="text-slate-500 ml-2 font-mono">({cust.phone})</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">{formatCitizenId(cust.citizenId)}</span>
                      </div>
                    ))}
                </div>

                {selectedCustomer && (
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-950 flex justify-between items-center">
                    <div>
                      <span className="font-bold">{selectedCustomer.prefix}{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
                      <span className="text-[11px] text-amber-800 ml-2">บัตร: {formatCitizenId(selectedCustomer.citizenId)} · โทร: {selectedCustomer.phone}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-200 px-2 py-0.5 rounded-full text-amber-900">เลือกแล้ว</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">เลขบัตร ปชช. (13 หลัก) *</label>
                  <input
                    type="text"
                    maxLength={13}
                    value={newCustCitizenId}
                    onChange={(e) => setNewCustCitizenId(e.target.value.replace(/\D/g, ''))}
                    placeholder="1930200876541"
                    className="w-full font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">คำนำหน้า</label>
                  <select
                    value={newCustPrefix}
                    onChange={(e) => setNewCustPrefix(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="อาจารย์">อาจารย์</option>
                    <option value="คุณ">คุณ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์ *</label>
                  <input
                    type="tel"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="0812345678"
                    className="w-full font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ชื่อจริง *</label>
                  <input
                    type="text"
                    value={newCustFirstName}
                    onChange={(e) => setNewCustFirstName(e.target.value)}
                    placeholder="ชื่อลูกค้า"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">นามสกุล *</label>
                  <input
                    type="text"
                    value={newCustLastName}
                    onChange={(e) => setNewCustLastName(e.target.value)}
                    placeholder="นามสกุล"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Line ID</label>
                  <input
                    type="text"
                    value={newCustLineId}
                    onChange={(e) => setNewCustLineId(e.target.value)}
                    placeholder="ไอดีไลน์ (ถ้ามี)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-slate-700 font-semibold mb-1">ที่อยู่ตามบัตรประชาชน</label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    placeholder="ที่อยู่ลูกค้า"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: ITEM & ASSET DETAILS (COMPUTER, LAPTOP, PRINTER, PHONE) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Laptop className="w-4 h-4 text-amber-500" />
                <span>หมวดหมู่สินค้าไอทีที่นำมาขายฝาก</span>
              </div>

              {/* Segmented Category Buttons */}
              <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-xs overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleSelectCategory('notebook')}
                  className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    category === 'notebook' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>โน็ตบุ้ค</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCategory('computer')}
                  className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    category === 'computer' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>คอมพิวเตอร์พีซี</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCategory('printer')}
                  className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    category === 'printer' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>เครื่องพิมพ์</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCategory('phone')}
                  className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    category === 'phone' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>มือถือ/แท็บเล็ต</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCategory('gadget_it')}
                  className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    category === 'gadget_it' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>อุปกรณ์ไอที</span>
                </button>
              </div>
            </div>

            {/* 1. NOTEBOOK CUSTOM FIELDS */}
            {category === 'notebook' && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ยี่ห้อ (Brand)</label>
                    <select
                      value={nbBrand}
                      onChange={(e) => {
                        setNbBrand(e.target.value);
                        setItemName(`${e.target.value} ${nbModel} (${nbProcessor})`);
                      }}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs"
                    >
                      {COMMON_NOTEBOOK_BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">รุ่น / ซีรีส์ (Model)</label>
                    <input
                      type="text"
                      value={nbModel}
                      onChange={(e) => {
                        setNbModel(e.target.value);
                        setItemName(`${nbBrand} ${e.target.value} (${nbProcessor})`);
                      }}
                      placeholder="เช่น ROG Strix G16, Vivobook 15"
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">หมายเลขเครื่อง (S/N)</label>
                    <input
                      type="text"
                      value={nbSerial}
                      onChange={(e) => setNbSerial(e.target.value)}
                      placeholder="เช่น R90Z8912A004"
                      className="w-full font-mono uppercase font-bold bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-amber-950"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">หน่วยความจำ (RAM)</label>
                    <div className="flex gap-1">
                      {[8, 16, 32, 64].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setNbRam(r)}
                          className={`flex-1 py-1 rounded text-xs font-mono font-bold ${
                            nbRam === r ? 'bg-amber-500 text-white' : 'bg-white border border-amber-200 text-slate-700'
                          }`}
                        >
                          {r}G
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ซีพียู (Processor)</label>
                    <input
                      type="text"
                      value={nbProcessor}
                      onChange={(e) => setNbProcessor(e.target.value)}
                      placeholder="Core i7-13650HX"
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ความจุ (SSD/Storage)</label>
                    <input
                      type="text"
                      value={nbStorage}
                      onChange={(e) => setNbStorage(e.target.value)}
                      placeholder="SSD 1TB M.2 NVMe"
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">การ์ดจอ (GPU)</label>
                    <input
                      type="text"
                      value={nbGpu}
                      onChange={(e) => setNbGpu(e.target.value)}
                      placeholder="RTX 4060 8GB"
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">สถานะแบตเตอรี่</label>
                    <select
                      value={nbBattery}
                      onChange={(e) => setNbBattery(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs"
                    >
                      <option value="เก็บไฟดีมาก (> 3 ชม.)">เก็บไฟดีมาก (&gt; 3 ชม.)</option>
                      <option value="เก็บไฟปกติ (1 - 2 ชม.)">เก็บไฟปกติ (1 - 2 ชม.)</option>
                      <option value="แบตเตอรี่เสื่อม/เสียบสายตลอด">แบตเตอรี่เสื่อม/เสียบสาย</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-amber-200">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nbHasCharger}
                      onChange={(e) => setNbHasCharger(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span className="text-slate-800 font-medium">มีสายชาร์จ / อะแดปเตอร์แท้</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nbHasBag}
                      onChange={(e) => setNbHasBag(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span className="text-slate-800 font-medium">มีกระเป๋าโน็ตบุ้ค</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nbIcloudStatus === 'unlocked'}
                      onChange={(e) => setNbIcloudStatus(e.target.checked ? 'unlocked' : 'locked')}
                      className="rounded text-amber-500"
                    />
                    <span className="text-emerald-800 font-bold">ปลดล็อค iCloud / Microsoft / BIOS แล้ว</span>
                  </label>
                </div>
              </div>
            )}

            {/* 2. COMPUTER PC CUSTOM FIELDS */}
            {category === 'computer' && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 space-y-2.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">แบรนด์ / การประกอบ</label>
                    <input
                      type="text"
                      value={pcBrandOrCustom}
                      onChange={(e) => setPcBrandOrCustom(e.target.value)}
                      placeholder="ประกอบ Custom Gaming PC หรือ Dell"
                      className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">เคส / โมเดล (Case Model)</label>
                    <input
                      type="text"
                      value={pcModelOrCase}
                      onChange={(e) => setPcModelOrCase(e.target.value)}
                      placeholder="Case NZXT H5 Flow RGB สีดำ"
                      className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">หน่วยประมวลผล (CPU)</label>
                    <input
                      type="text"
                      value={pcProcessor}
                      onChange={(e) => setPcProcessor(e.target.value)}
                      placeholder="Intel Core i5-13400F หรือ Ryzen 5"
                      className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">RAM (GB)</label>
                    <select
                      value={pcRam}
                      onChange={(e) => setPcRam(Number(e.target.value))}
                      className="w-full bg-white border border-indigo-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                    >
                      <option value={8}>8 GB</option>
                      <option value={16}>16 GB</option>
                      <option value={32}>32 GB (16x2)</option>
                      <option value={64}>64 GB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ความจุฮาร์ดดิสก์ (SSD)</label>
                    <input
                      type="text"
                      value={pcStorage}
                      onChange={(e) => setPcStorage(e.target.value)}
                      placeholder="SSD 1TB M.2 NVMe"
                      className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">การ์ดจอแยก (GPU)</label>
                    <input
                      type="text"
                      value={pcGpu}
                      onChange={(e) => setPcGpu(e.target.value)}
                      placeholder="RTX 3060 12GB หรือ Onboard"
                      className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">จอภาพที่นำมาด้วย (Monitor)</label>
                    <input
                      type="text"
                      value={pcMonitor}
                      onChange={(e) => setPcMonitor(e.target.value)}
                      placeholder="AOC 24&quot; 165Hz (หรือไม่มีจอ)"
                      className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">อุปกรณ์ต่อพ่วงที่ส่งมอบด้วย</label>
                  <input
                    type="text"
                    value={pcAccessories}
                    onChange={(e) => setPcAccessories(e.target.value)}
                    placeholder="เช่น สายไฟ AC, สาย HDMI, คีย์บอร์ดเรืองแสง, เมาส์"
                    className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}

            {/* 3. PRINTER CUSTOM FIELDS */}
            {category === 'printer' && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ยี่ห้อปริ้นเตอร์ (Brand)</label>
                    <select
                      value={prBrand}
                      onChange={(e) => setPrBrand(e.target.value)}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1.5 text-xs"
                    >
                      {COMMON_PRINTER_BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">รุ่นเครื่องพิมพ์ (Model)</label>
                    <input
                      type="text"
                      value={prModel}
                      onChange={(e) => {
                        setPrModel(e.target.value);
                        setItemName(`เครื่องพิมพ์ ${prBrand} ${e.target.value} (แท็งก์แท้ศูนย์)`);
                      }}
                      placeholder="EcoTank L3250 หรือ PIXMA G3010"
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">หมายเลขเครื่อง (S/N)</label>
                    <input
                      type="text"
                      value={prSerial}
                      onChange={(e) => setPrSerial(e.target.value)}
                      placeholder="X8TY019942"
                      className="w-full font-mono uppercase font-bold bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-emerald-950"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ระบบน้ำหมึก (Ink System)</label>
                    <select
                      value={prInkSystem}
                      onChange={(e) => setPrInkSystem(e.target.value as any)}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1.5 text-xs"
                    >
                      <option value="genuine_tank">ระบบแท็งก์แท้ศูนย์ (EcoTank/MegaTank)</option>
                      <option value="cartridge">ตลับหมึกแท้ (Cartridge)</option>
                      <option value="mod_tank">แท็งก์ดัดแปลงภายนอก (Mod Tank)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">สภาพหัวพิมพ์ (Print Head Test)</label>
                    <select
                      value={prHeadCondition}
                      onChange={(e) => setPrHeadCondition(e.target.value as any)}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1.5 text-xs font-semibold"
                    >
                      <option value="normal">หัวพิมพ์ออกครบ 100% สภาพสมบูรณ์</option>
                      <option value="need_clean">มีเส้นบางสี ต้องทำความสะอาดหัวพิมพ์</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4 sm:col-span-2 pt-2 sm:pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prHasPowerCable}
                        onChange={(e) => setPrHasPowerCable(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span className="text-slate-800 font-medium">มีสายไฟ AC Power</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prHasUsbCable}
                        onChange={(e) => setPrHasUsbCable(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span className="text-slate-800 font-medium">มีสายต่อ USB เข้าคอมพิวเตอร์</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PHONE CUSTOM FIELDS */}
            {category === 'phone' && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ยี่ห้อโทรศัพท์ / แท็บเล็ต</label>
                  <input
                    type="text"
                    value={phoneBrand}
                    onChange={(e) => setPhoneBrand(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">รุ่นสินค้า</label>
                  <input
                    type="text"
                    value={phoneModel}
                    onChange={(e) => {
                      setPhoneModel(e.target.value);
                      setItemName(`${phoneBrand} ${e.target.value} ${phoneStorage}`);
                    }}
                    className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ความจุ</label>
                  <select
                    value={phoneStorage}
                    onChange={(e) => setPhoneStorage(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">หมายเลข IMEI (15 หลัก)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={phoneImei}
                    onChange={(e) => setPhoneImei(e.target.value)}
                    placeholder="กด *#06# เพื่อดูเลข IMEI"
                    className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">สถานะ iCloud / บัญชี</label>
                  <select
                    value={phoneIcloudStatus}
                    onChange={(e) => setPhoneIcloudStatus(e.target.value as any)}
                    className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1.5 text-xs font-semibold"
                  >
                    <option value="signed_out">ออกจากระบบเรียบร้อย (Sign out)</option>
                    <option value="unlocked">ปลดล็อคแล้ว</option>
                    <option value="locked">ติดล็อค (ต้องแจ้งรหัส)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">อุปกรณ์ที่นำมาด้วย</label>
                  <input
                    type="text"
                    value={phoneAccessories}
                    onChange={(e) => setPhoneAccessories(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}

            {/* 5. GADGET / IT PARTS */}
            {category === 'gadget_it' && (
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ประเภทอุปกรณ์</label>
                  <select
                    value={gtType}
                    onChange={(e) => setGtType(e.target.value as any)}
                    className="w-full bg-white border border-purple-300 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="monitor">จอคอมพิวเตอร์ / Monitor</option>
                    <option value="gpu_part">การ์ดจอแยก / GPU</option>
                    <option value="tablet">แท็บเล็ตกราฟิก / iPad</option>
                    <option value="console">เครื่องเล่นเกม Console</option>
                    <option value="camera">กล้องดิจิทัล / อุปกรณ์ไลฟ์</option>
                    <option value="other">อุปกรณ์ไอทีอื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ยี่ห้อ / แบรนด์</label>
                  <input
                    type="text"
                    value={gtBrand}
                    onChange={(e) => setGtBrand(e.target.value)}
                    className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">รุ่นสินค้า (Model)</label>
                  <input
                    type="text"
                    value={gtModel}
                    onChange={(e) => {
                      setGtModel(e.target.value);
                      setItemName(`${gtBrand} ${e.target.value}`);
                    }}
                    className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-slate-700 font-semibold mb-1">สรุปรายละเอียดสเปก</label>
                  <input
                    type="text"
                    value={gtSpecs}
                    onChange={(e) => setGtSpecs(e.target.value)}
                    className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}

            {/* General item title & storage location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ชื่อรายการทรัพย์สินไอที *</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="เช่น Asus ROG Strix G16 Core i7-13650HX"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">สถานที่จัดเก็บในร้าน</label>
                <input
                  type="text"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  placeholder="เช่น ตู้ไอที ชั้น 2 ล็อกเกอร์ B-01"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800"
                />
              </div>
            </div>

            {/* Photo upload / Capture */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-700">รูปถ่ายอุปกรณ์ไอที / หมายเลข S/N</span>
                <div className="flex gap-2">
                  <label className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer">
                    <span>+ อัปโหลดรูป</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-1">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg border border-slate-300 overflow-hidden shrink-0 group">
                      <img src={p} alt="item" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 opacity-80 hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: FINANCIAL & LOAN CONTRACT TERMS */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>เงื่อนไขทางการเงินและอัตราดอกเบี้ยขายฝาก</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  เงินต้นรับจำนำ / ขายฝาก (บาท) *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-500 font-bold">฿</span>
                  <input
                    type="number"
                    step={100}
                    value={loanAmount || ''}
                    onChange={(e) => handleLoanAmountChange(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 text-base font-bold font-mono text-indigo-700 bg-white border border-indigo-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  อัตราดอกเบี้ย (% ต่อเดือน)
                </label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="number"
                    step="0.05"
                    value={monthlyInterestRate}
                    onChange={(e) => {
                      setMonthlyInterestRate(parseFloat(e.target.value) || 0);
                      setIsTieredRate(false);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs"
                  />
                  <span className="text-slate-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>ระยะเวลา (เดือน / วัน)</span>
                  <span className="text-[11px] text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                    {formatDurationText(durationMonths, durationDays)}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={36}
                      value={durationMonths}
                      onChange={(e) => handleDurationMonthsChange(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs text-center focus:ring-1 focus:ring-amber-400 focus:outline-none"
                      placeholder="0"
                    />
                    <span className="text-slate-500 text-xs shrink-0">เดือน</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={31}
                      value={durationDays}
                      onChange={(e) => handleDurationDaysChange(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs text-center focus:ring-1 focus:ring-amber-400 focus:outline-none"
                      placeholder="0"
                    />
                    <span className="text-slate-500 text-xs shrink-0">วัน</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Flexible Date Picker Inputs (Start Date & Due Date) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>📅 วันที่เริ่มทำสัญญา</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {formatThaiDate(startDate, false)}
                  </span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>🎯 วันที่ครบกำหนดไถ่ถอน (เลือกจากปฏิทินได้)</span>
                  <span className="text-[11px] text-rose-600 font-bold">
                    {formatThaiDate(dueDate, false)}
                  </span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  min={startDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-bold text-rose-700 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Quick Duration Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-500 font-medium">⚡ กำหนดด่วน:</span>
              {[
                { label: '15 วัน', m: 0, d: 15 },
                { label: '1 เดือน', m: 1, d: 0 },
                { label: '1 เดือน 15 วัน', m: 1, d: 15 },
                { label: '2 เดือน (มาตรฐาน)', m: 2, d: 0 },
                { label: '3 เดือน', m: 3, d: 0 },
                { label: '4 เดือน', m: 4, d: 0 },
                { label: '6 เดือน', m: 6, d: 0 },
              ].map((preset) => {
                const isSelected = durationMonths === preset.m && durationDays === preset.d;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetSelect(preset.m, preset.d)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Interest Calculation Strip */}
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row justify-between items-center gap-1.5 text-xs">
              <div className="text-emerald-900">
                <span>ดอกเบี้ยตลอดสัญญา ({formatDurationText(durationMonths, durationDays)}): </span>
                <strong className="font-mono text-sm text-emerald-800">
                  ฿{totalInterest.toLocaleString()} บาท
                </strong>
                <span className="text-[11px] text-emerald-700 ml-1.5">
                  (เดือนละ ฿{monthlyInterest.toLocaleString()} {durationDays > 0 ? `• เฉลี่ยวันละ ~฿${dailyInterest.toLocaleString()}` : ''})
                </span>
              </div>
              <div className="text-slate-600 font-mono text-[11px]">
                ครบกำหนดไถ่ถอน: <strong className="text-slate-900">{formatThaiDate(dueDate, true)}</strong>
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>บันทึกเปิดสัญญาขายฝากไอที</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
