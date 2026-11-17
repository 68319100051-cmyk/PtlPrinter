import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Laptop,
  CheckSquare,
  Square,
  ShieldCheck,
  Camera,
  Search,
  UserPlus,
  DollarSign,
  AlertTriangle,
  Sparkles,
  FileText,
  Cpu,
  HardDrive,
  Layers,
  Battery,
  CheckCircle2
} from 'lucide-react';
import {
  SecondhandBuyIn,
  NotebookBrand,
  BatteryCondition,
  CosmeticGrade,
  NotebookSpecs
} from '../types/buyIn';
import { Customer, ShopSettings, UserAccount } from '../types/pawn';
import { generateNextBuyInNumber } from '../utils/storage';
import { RamPicker } from './RamPicker';

interface BuyInLaptopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (buyIn: SecondhandBuyIn, newCustomer?: Customer) => void;
  customers: Customer[];
  existingBuyIns: SecondhandBuyIn[];
  settings: ShopSettings;
  currentUser: UserAccount;
  initialCustomer?: Customer | null;
}

const COMMON_BRANDS: NotebookBrand[] = [
  'Asus',
  'Acer',
  'Lenovo',
  'Dell',
  'HP',
  'Apple',
  'MSI',
  'Huawei',
  'Other',
];

const CPU_PRESETS = [
  'Intel Core i5-12450H',
  'Intel Core i5-1135G7',
  'Intel Core i7-12700H',
  'Intel Core i3-1215U',
  'AMD Ryzen 5 5600H',
  'AMD Ryzen 7 5800H',
  'AMD Ryzen 5 7530U',
  'Apple M1 (8-Core)',
  'Apple M2 (8-Core)',
  'Apple M3 (8-Core)',
];

const GPU_PRESETS = [
  'Intel Iris Xe Graphics (Onboard)',
  'AMD Radeon Graphics (Onboard)',
  'NVIDIA GeForce RTX 3050 (4GB)',
  'NVIDIA GeForce RTX 4050 (6GB)',
  'NVIDIA GeForce RTX 4060 (8GB)',
  'NVIDIA GeForce GTX 1650 (4GB)',
  'Apple M Integrated GPU',
];

const STORAGE_PRESETS = ['SSD 256GB NVMe', 'SSD 512GB NVMe', 'SSD 1TB NVMe', 'SSD 128GB + HDD 1TB'];

const SAMPLE_LAPTOP_PHOTOS = [
  'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1544731612-de7f96afe55f?auto=format&fit=crop&w=600&q=80',
];

export const BuyInLaptopModal: React.FC<BuyInLaptopModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customers,
  existingBuyIns,
  settings,
  currentUser,
  initialCustomer,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  // Step navigation (mobile friendly tab)
  const [activeTab, setActiveTab] = useState<'seller' | 'specs' | 'pricing'>('seller');

  // Seller selection / creation
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [isNewCustomer, setIsNewCustomer] = useState<boolean>(false);
  const [citizenId, setCitizenId] = useState<string>('');
  const [prefix, setPrefix] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  // Notebook specs
  const [brand, setBrand] = useState<NotebookBrand | string>('');
  const [model, setModel] = useState<string>('');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [processor, setProcessor] = useState<string>('');
  const [ramGb, setRamGb] = useState<number | null>(null);
  const [storage, setStorage] = useState<string>('');
  const [gpu, setGpu] = useState<string>('');
  const [screenSize, setScreenSize] = useState<string>('');
  const [batteryStatus, setBatteryStatus] = useState<BatteryCondition | ''>('');
  const [cosmeticGrade, setCosmeticGrade] = useState<CosmeticGrade | ''>('');
  const [hasCharger, setHasCharger] = useState<boolean>(false);
  const [hasBox, setHasBox] = useState<boolean>(false);
  const [hasBag, setHasBag] = useState<boolean>(false);
  const [isICloudCleared, setIsICloudCleared] = useState<boolean>(false);
  const [defectsNotes, setDefectsNotes] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Hardware checklist (all unchecked by default)
  const [checklist, setChecklist] = useState({
    keyboard: false,
    screen: false,
    touchpad: false,
    wifiBluetooth: false,
    webcamMic: false,
    speakers: false,
    usbPorts: false,
    chargingPort: false,
  });

  // Pricing & Legal
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [targetSalePrice, setTargetSalePrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('transfer');
  const [legalDeclaration, setLegalDeclaration] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  /**
   * ฟังก์ชันรีเซ็ตฟอร์มกลางสำหรับโมดัลรับซื้อโน็ตบุ้คมือสอง
   * ป้องกันค่าเดิมหรือค่าตัวอย่างค้างข้ามรายการเมื่อเปิดโมดัลใหม่
   */
  const resetBuyInForm = useCallback(() => {
    setActiveTab('seller');

    // Seller fields
    setSelectedCustomerId(initialCustomer ? initialCustomer.id : '');
    setCustomerSearch('');
    setIsNewCustomer(false);
    setCitizenId(initialCustomer ? initialCustomer.citizenId : '');
    setPrefix(initialCustomer ? initialCustomer.prefix : '');
    setFirstName(initialCustomer ? initialCustomer.firstName : '');
    setLastName(initialCustomer ? initialCustomer.lastName : '');
    setPhone(initialCustomer ? initialCustomer.phone : '');
    setAddress(initialCustomer ? initialCustomer.address : '');

    // Notebook specs (strictly blank)
    setBrand('');
    setModel('');
    setSerialNumber('');
    setProcessor('');
    setRamGb(null);
    setStorage('');
    setGpu('');
    setScreenSize('');
    setBatteryStatus('');
    setCosmeticGrade('');
    setHasCharger(false);
    setHasBox(false);
    setHasBag(false);
    setIsICloudCleared(false);
    setDefectsNotes('');
    setPhotoUrl('');

    // Hardware checklist (all unchecked)
    setChecklist({
      keyboard: false,
      screen: false,
      touchpad: false,
      wifiBluetooth: false,
      webcamMic: false,
      speakers: false,
      usbPorts: false,
      chargingPort: false,
    });

    // Pricing & Legal
    setPurchasePrice(0);
    setTargetSalePrice(0);
    setPaymentMethod('transfer');
    setLegalDeclaration(false);
    setFormError('');

    if (formRef.current) {
      formRef.current.reset();
    }
  }, [initialCustomer]);

  useEffect(() => {
    if (isOpen) {
      resetBuyInForm();
    }
  }, [isOpen, resetBuyInForm]);

  const handleClose = () => {
    resetBuyInForm();
    onClose();
  };

  // Auto-generate S/N sample helper
  const handleGenerateSampleSN = () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randomSeq = Array.from({ length: 10 }, () => letters[Math.floor(Math.random() * letters.length)] + Math.floor(Math.random() * 10)).join('').slice(0, 12);
    setSerialNumber(`${(brand || 'NB').slice(0, 2).toUpperCase()}${randomSeq}`);
  };

  // Pre-fill when choosing existing customer
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setCitizenId(cust.citizenId);
    setPrefix(cust.prefix);
    setFirstName(cust.firstName);
    setLastName(cust.lastName);
    setPhone(cust.phone);
    setAddress(cust.address);
    setIsNewCustomer(false);
  };

  const filteredCustomers = customers.filter(c =>
    c.firstName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.lastName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.citizenId.includes(customerSearch) ||
    c.phone.includes(customerSearch)
  );

  const estimatedProfit = Math.max(0, targetSalePrice - purchasePrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!citizenId.trim() || citizenId.replace(/\D/g, '').length !== 13) {
      setFormError('กรุณาระบุเลขประจำตัวประชาชน 13 หลักของผู้ขายให้ถูกต้อง');
      setActiveTab('seller');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('กรุณาระบุชื่อและนามสกุลของผู้ขาย');
      setActiveTab('seller');
      return;
    }
    if (!brand.trim()) {
      setFormError('กรุณาเลือกยี่ห้อโน็ตบุ้ค');
      setActiveTab('specs');
      return;
    }
    if (!model.trim()) {
      setFormError('กรุณาระบุรุ่น / ซีรีส์ของโน็ตบุ้ค');
      setActiveTab('specs');
      return;
    }
    if (!serialNumber.trim()) {
      setFormError('กรุณาระบุหมายเลขประจำเครื่อง (S/N)');
      setActiveTab('specs');
      return;
    }
    if (ramGb === null) {
      setFormError('กรุณาเลือกขนาดหน่วยความจำ (RAM)');
      setActiveTab('specs');
      return;
    }
    if (!batteryStatus) {
      setFormError('กรุณาเลือกสถานะแบตเตอรี่');
      setActiveTab('specs');
      return;
    }
    if (!cosmeticGrade) {
      setFormError('กรุณาเลือกเกรดสภาพภายนอก');
      setActiveTab('specs');
      return;
    }
    if (purchasePrice <= 0) {
      setFormError('กรุณาระบุราคารับซื้อเข้าที่ถูกต้อง');
      setActiveTab('pricing');
      return;
    }
    if (!legalDeclaration) {
      setFormError('ผู้ขายต้องยอมรับคำรับรองกรรมสิทธิ์ตามกฎหมาย');
      setActiveTab('pricing');
      return;
    }

    let customerObj: Customer;
    let newCustToSave: Customer | undefined = undefined;
    const finalPrefix = prefix || 'คุณ';

    if (selectedCustomerId && !isNewCustomer) {
      const found = customers.find(c => c.id === selectedCustomerId);
      if (found) {
        customerObj = {
          ...found,
          phone,
          address,
        };
      } else {
        customerObj = {
          id: `cust-${Date.now()}`,
          citizenId,
          prefix: finalPrefix,
          firstName,
          lastName,
          phone,
          address,
          createdAt: new Date().toISOString(),
        };
        newCustToSave = customerObj;
      }
    } else {
      customerObj = {
        id: `cust-${Date.now()}`,
        citizenId,
        prefix: finalPrefix,
        firstName,
        lastName,
        phone,
        address,
        createdAt: new Date().toISOString(),
      };
      newCustToSave = customerObj;
    }

    const buyInSpecs: NotebookSpecs = {
      brand,
      model,
      serialNumber: serialNumber.trim().toUpperCase(),
      processor,
      ramGb: Number(ramGb),
      storage,
      gpu,
      screenSize,
      batteryStatus: batteryStatus as BatteryCondition,
      cosmeticGrade: cosmeticGrade as CosmeticGrade,
      hasCharger,
      hasBox,
      hasBag,
      isICloudOrPasscodeCleared: isICloudCleared,
      checklist,
      defectsNotes: defectsNotes.trim() || '',
    };

    const nextBuyInNo = generateNextBuyInNumber(existingBuyIns);

    const newBuyIn: SecondhandBuyIn = {
      id: `nb-${Date.now()}`,
      buyInNumber: nextBuyInNo,
      date: new Date().toISOString(),
      category: 'laptop',
      notebookSpecs: buyInSpecs,
      sellerSnapshot: customerObj,
      purchasePrice: Number(purchasePrice),
      targetSalePrice: Number(targetSalePrice) || Math.round(purchasePrice * 1.3),
      paymentMethod,
      status: 'in_stock',
      photos: photoUrl ? [photoUrl] : [],
      buyerStaff: currentUser.name,
      notes: `รับซื้อโน็ตบุ้ค ${brand} ${model} S/N: ${serialNumber}`,
      legalOwnershipDeclaration: true,
      createdAt: new Date().toISOString(),
    };

    onSave(newBuyIn, newCustToSave);
    resetBuyInForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>บันทึกรับซื้อโน็ตบุ้คมือสอง (รับซื้อของเก่า)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-normal">
                  พ.ร.บ. ค้าของเก่า
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                พัทลุงปริ้นเตอร์ คอมพิวเตอร์ · บันทึกรับซื้อ ตรวจเช็คสเปก และออกสัญญาซื้อขาย
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Mobile friendly pill bar) */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-2 sm:px-4 py-1.5 shrink-0 gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('seller')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'seller'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>๑. ข้อมูลผู้ขาย (บัตร ปชช.)</span>
            {citizenId.replace(/\D/g, '').length === 13 && firstName && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'specs'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>๒. สเปกโน็ตบุ้ค & ตรวจเช็ค</span>
            {serialNumber && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>๓. ราคารับซื้อ & สัญญา</span>
            {purchasePrice > 0 && legalDeclaration && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <form ref={formRef} autoComplete="off" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-5 text-slate-800 text-xs">
          {formError && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* TAB 1: SELLER DETAILS */}
          {activeTab === 'seller' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5 text-amber-900">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <p className="font-bold">ข้อกำหนดทางกฎหมายการรับซื้อของเก่า</p>
                  <p>
                    ต้องบันทึกเลขประจำตัวประชาชน 13 หลัก ชื่อ-นามสกุล ที่อยู่ และเบอร์โทรศัพท์ของผู้ขายไว้เป็นหลักฐานทุกครั้ง เพื่อความปลอดภัยและป้องกันการรับซื้อของโจร
                  </p>
                </div>
              </div>

              {/* Quick Customer Search / AG Intelligence */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                    <span>ค้นหาจากฐานข้อมูลลูกค้าเดิม (AG Customer)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewCustomer(true);
                      setSelectedCustomerId('');
                      setCitizenId('');
                      setFirstName('');
                      setLastName('');
                      setPhone('');
                      setAddress('');
                    }}
                    className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>กรอกลูกค้าใหม่</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="พิมพ์ชื่อ สกุล หรือเบอร์โทร เพื่อค้นหา..."
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {customerSearch && (
                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg shadow-xs">
                    {filteredCustomers.length === 0 ? (
                      <p className="p-2 text-center text-slate-400 text-[11px]">ไม่พบข้อมูลลูกค้า</p>
                    ) : (
                      filteredCustomers.map(cust => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => {
                            handleSelectCustomer(cust);
                            setCustomerSearch('');
                          }}
                          className="w-full text-left p-2 hover:bg-amber-50/60 transition-colors flex justify-between items-center text-xs cursor-pointer"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{cust.prefix}{cust.firstName} {cust.lastName}</span>
                            <span className="text-[11px] text-slate-500 ml-2 font-mono">({cust.phone})</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{cust.citizenId}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Seller Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">
                    เลขบัตรประชาชน (13 หลัก) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value.replace(/\D/g, ''))}
                    placeholder="1930200876541"
                    className="w-full font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">
                    คำนำหน้า
                  </label>
                  <select
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">-- เลือกคำนำหน้า --</option>
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="อาจารย์">อาจารย์</option>
                    <option value="คุณ">คุณ</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">
                    เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081-234-5678"
                    className="w-full font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">
                    ชื่อจริง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ชื่อผู้ขาย"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="นามสกุล"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-700 font-semibold mb-1">
                    ที่อยู่ตามบัตรประชาชน / ที่อยู่ปัจจุบัน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>ขั้นตอนถัดไป: สเปกโน็ตบุ้ค</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LAPTOP SPECS & HARDWARE CHECK */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              {/* Brand Select & Quick Pills */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  ยี่ห้อโน็ตบุ้ค (Brand) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full mb-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                >
                  <option value="">-- เลือกยี่ห้อ --</option>
                  {COMMON_BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_BRANDS.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrand(b)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        brand === b
                          ? 'bg-slate-900 text-amber-400 ring-2 ring-amber-400 shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model & Serial Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    รุ่น / ซีรีส์ (Model / Series) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="เช่น TUF Gaming A15, Vivobook 15, MacBook Air M2"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">
                      หมายเลขเครื่อง (Serial Number / S/N) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSampleSN}
                      className="text-[10px] text-amber-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>สุ่มรหัสตัวอย่าง</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="เช่น M9NRCX01A892147"
                    className="w-full font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase font-bold"
                    required
                  />
                </div>
              </div>

              {/* Core Specs: CPU, RAM, Storage, GPU */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-amber-600" />
                  <span>สเปกตัวเครื่อง (Core Specifications)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      หน่วยประมวลผล (Processor / CPU)
                    </label>
                    <input
                      type="text"
                      value={processor}
                      onChange={(e) => setProcessor(e.target.value)}
                      placeholder="เช่น Intel Core i5-12450H หรือ AMD Ryzen 5"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {CPU_PRESETS.slice(0, 5).map(cpu => (
                        <button
                          key={cpu}
                          type="button"
                          onClick={() => setProcessor(cpu)}
                          className="text-[10px] bg-slate-200/70 hover:bg-slate-300 text-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          {cpu.split(' ')[0]} {cpu.split(' ')[2] || cpu.split(' ')[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      หน่วยความจำ (RAM)
                    </label>
                    <RamPicker
                      value={ramGb}
                      onChange={setRamGb}
                      accent="slate"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      ความจุฮาร์ดดิสก์ (Storage / SSD)
                    </label>
                    <input
                      type="text"
                      value={storage}
                      onChange={(e) => setStorage(e.target.value)}
                      placeholder="เช่น SSD 512GB M.2 NVMe"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {STORAGE_PRESETS.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStorage(s)}
                          className="text-[10px] bg-slate-200/70 hover:bg-slate-300 text-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          {s.split(' ')[1] || s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      การ์ดจอ (Graphics / GPU)
                    </label>
                    <input
                      type="text"
                      value={gpu}
                      onChange={(e) => setGpu(e.target.value)}
                      placeholder="เช่น NVIDIA GeForce RTX 3050"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {GPU_PRESETS.slice(0, 4).map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGpu(g)}
                          className="text-[10px] bg-slate-200/70 hover:bg-slate-300 text-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          {g.includes('RTX') ? g.split('(')[0].trim() : g.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      ขนาดหน้าจอ
                    </label>
                    <input
                      type="text"
                      value={screenSize}
                      onChange={(e) => setScreenSize(e.target.value)}
                      placeholder="15.6&quot; FHD 144Hz"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      สถานะแบตเตอรี่
                    </label>
                    <select
                      value={batteryStatus}
                      onChange={(e) => setBatteryStatus(e.target.value as BatteryCondition | '')}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      required
                    >
                      <option value="">-- เลือกสถานะแบตเตอรี่ --</option>
                      <option value="good">เก็บไฟดีมาก (&gt; 2 ชม.)</option>
                      <option value="fair">เก็บไฟพอใช้ (1 - 2 ชม.)</option>
                      <option value="poor">แบตเสื่อม (&lt; 30 นาที)</option>
                      <option value="plugged_only">ต้องเสียบสายชาร์จตลอด</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      เกรดสภาพภายนอก
                    </label>
                    <div className="flex gap-1">
                      {(['A', 'B', 'C', 'D'] as CosmeticGrade[]).map(grade => (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => setCosmeticGrade(grade)}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            cosmeticGrade === grade
                              ? 'bg-amber-400 text-slate-950 ring-2 ring-slate-900'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          เกรด {grade}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Accessories & Cloud Clearance */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 text-xs">
                  อุปกรณ์และสถานะระบบความปลอดภัย
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={hasCharger}
                      onChange={(e) => setHasCharger(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700">มีสายชาร์จ/อะแดปเตอร์แท้</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={hasBag}
                      onChange={(e) => setHasBag(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700">มีกระเป๋าโน็ตบุ้ค</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={hasBox}
                      onChange={(e) => setHasBox(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700">มีกล่องบรรจุภัณฑ์</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={isICloudCleared}
                      onChange={(e) => setIsICloudCleared(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-medium text-emerald-700 font-bold">ปลดล็อค iCloud/BIOS แล้ว</span>
                  </label>
                </div>
              </div>

              {/* Interactive Hardware Checklist */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>ผลการตรวจเช็คฮาร์ดแวร์หน้าร้าน (8 รายการทดสอบ)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setChecklist({
                      keyboard: true,
                      screen: true,
                      touchpad: true,
                      wifiBluetooth: true,
                      webcamMic: true,
                      speakers: true,
                      usbPorts: true,
                      chargingPort: true,
                    })}
                    className="text-[10px] text-emerald-700 hover:underline cursor-pointer font-semibold"
                  >
                    ผ่านทั้งหมด (Pass All)
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'keyboard', label: 'คีย์บอร์ดพิมพ์ติดทุกปุ่ม' },
                    { key: 'screen', label: 'จอภาพปกติ ไม่มี Dead/Bright' },
                    { key: 'touchpad', label: 'ทัชแพดคลิกรูดปกติ' },
                    { key: 'wifiBluetooth', label: 'Wi-Fi / Bluetooth รับได้' },
                    { key: 'webcamMic', label: 'กล้องและไมโครโฟน' },
                    { key: 'speakers', label: 'ลำโพงเสียงไม่อู้อี้/แตก' },
                    { key: 'usbPorts', label: 'พอร์ต USB/Type-C ทุกช่อง' },
                    { key: 'chargingPort', label: 'ช่องชาร์จแน่น ไฟเข้าปกติ' },
                  ].map(item => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                        checklist[item.key as keyof typeof checklist]
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 font-medium'
                          : 'bg-rose-50/60 border-rose-200 text-rose-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checklist[item.key as keyof typeof checklist]}
                        onChange={(e) => setChecklist(prev => ({
                          ...prev,
                          [item.key]: e.target.checked
                        }))}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Defect notes */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  หมายเหตุ / สภาพตำหนิเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={defectsNotes}
                  onChange={(e) => setDefectsNotes(e.target.value)}
                  placeholder="เช่น มีรอยขนแมวด้านฝาหลังเล็กน้อย, ยางรองใต้เครื่องครบ"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('seller')}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  ← ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pricing')}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>ขั้นตอนถัดไป: ตกลงราคา & สัญญา</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRICING & LEGAL CONTRACT */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              {/* Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2">
                  <label className="block text-emerald-950 font-bold text-xs flex items-center justify-between">
                    <span>ราคารับซื้อเข้า (จ่ายให้ผู้ขาย)</span>
                    <span className="text-[10px] text-emerald-700 font-mono">เงินสด / โอน</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-emerald-700 font-bold">฿</span>
                    <input
                      type="number"
                      step={100}
                      value={purchasePrice || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPurchasePrice(val);
                        if (targetSalePrice <= val) {
                          setTargetSalePrice(Math.round(val * 1.3));
                        }
                      }}
                      placeholder="10000"
                      className="w-full pl-8 pr-3 py-1.5 text-base sm:text-lg font-bold font-mono text-emerald-900 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'transfer'}
                        onChange={() => setPaymentMethod('transfer')}
                        className="text-emerald-600"
                      />
                      <span>โอนเงินเข้าบัญชี</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="text-emerald-600"
                      />
                      <span>จ่ายเงินสด</span>
                    </label>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                  <label className="block text-amber-950 font-bold text-xs flex items-center justify-between">
                    <span>ราคาประเมินตั้งขายหน้าร้าน</span>
                    <span className="text-[10px] text-amber-700">เป้าหมายจำหน่าย</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-amber-700 font-bold">฿</span>
                    <input
                      type="number"
                      step={100}
                      value={targetSalePrice || ''}
                      onChange={(e) => setTargetSalePrice(Number(e.target.value))}
                      placeholder="13500"
                      className="w-full pl-8 pr-3 py-1.5 text-base sm:text-lg font-bold font-mono text-amber-900 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="text-[11px] text-amber-800 flex justify-between font-mono">
                    <span>กำไรส่วนต่างคาดการณ์:</span>
                    <span className="font-bold text-amber-900">+฿{estimatedProfit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Staff Buyer & Shop Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    พนักงานผู้รับซื้อ / ผู้ตรวจสอบ
                  </label>
                  <input
                    type="text"
                    value={currentUser.name}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    สาขาที่รับซื้อเข้าสต็อก
                  </label>
                  <input
                    type="text"
                    value={settings.shopName}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Legal Declaration Checkbox (Mandatory for Secondhand Trade Law) */}
              <div className="p-3 bg-slate-50 border-2 border-slate-300 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>คำรับรองกรรมสิทธิ์ตาม พ.ร.บ. ค้าของเก่า พ.ศ. ๒๔๗๔</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  ผู้ขายขอรับรองว่าทรัพย์สินโน็ตบุ้คและอุปกรณ์ตามรายการนี้ เป็นกรรมสิทธิ์ของผู้ขายโดยชอบด้วยกฎหมาย มิได้เป็นของที่ได้มาจากการกระทำความผิดอาญา ลักทรัพย์ ปล้นทรัพย์ ฉ้อโกง หรือโจรกรรมมาแต่ประการใด หากเกิดความเสียหายใดๆ ขึ้น ผู้ขายยินยอมรับผิดชอบชดใช้ทั้งทางแพ่งและทางอาญาทุกประการ
                </p>
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={legalDeclaration}
                    onChange={(e) => setLegalDeclaration(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                    required
                  />
                  <span className="font-bold text-xs text-slate-900">
                    ผู้ขายยินยอมรับรองกรรมสิทธิ์ถูกต้อง และตกลงขายตามเงื่อนไข
                  </span>
                </label>
              </div>

              {/* Navigation & Submit */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  ← ย้อนกลับ
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกการรับซื้อโน็ตบุ้ค (ออกสัญญา)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

      </div>
    </div>
  );
};
