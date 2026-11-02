import React, { useState, useRef } from 'react';
import { X, Camera, Plus, Check, Search, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { Customer, PawnContract, PawnItem, ItemCategory, ShopSettings, UserAccount } from '../types/pawn';
import { formatCurrency, formatThaiDate, calculateTieredInterestRate, addMonthsToDate, formatCitizenId, formatPhone } from '../utils/thaiFormat';
import { generateNextContractNumber } from '../utils/storage';

interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: PawnContract, newCustomer?: Customer) => void;
  customers: Customer[];
  existingContracts: PawnContract[];
  settings: ShopSettings;
  currentUser: UserAccount;
}

export const NewContractModal: React.FC<NewContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customers,
  existingContracts,
  settings,
  currentUser,
}) => {
  // Mode: select existing or new customer
  const [customerMode, setCustomerMode] = useState<'search' | 'new'>('search');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer fields
  const [newCustCitizenId, setNewCustCitizenId] = useState('');
  const [newCustPrefix, setNewCustPrefix] = useState('นาย');
  const [newCustFirstName, setNewCustFirstName] = useState('');
  const [newCustLastName, setNewCustLastName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustLineId, setNewCustLineId] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustIsVip, setNewCustIsVip] = useState(false);

  // Item fields
  const [category, setCategory] = useState<ItemCategory>('gold');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [storageLocation, setStorageLocation] = useState('ตู้เซฟ A-01 ลิ้นชักทอง');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Category specific fields
  // 1. Gold
  const [goldType, setGoldType] = useState<'necklace' | 'bracelet' | 'ring' | 'bangle' | 'pendant' | 'bar' | 'other'>('necklace');
  const [goldTypeName, setGoldTypeName] = useState('สร้อยคอ');
  const [goldPurity, setGoldPurity] = useState<'96.5%' | '99.99%' | '90%' | 'other'>('96.5%');
  const [goldWeightBaht, setGoldWeightBaht] = useState<number>(1);
  const [goldWeightGram, setGoldWeightGram] = useState<number>(15.244);
  const [goldCondition, setGoldCondition] = useState('สภาพสวย 98% ตราปั๊มชัดเจน');

  // 2. Phone
  const [phoneBrand, setPhoneBrand] = useState('Apple');
  const [phoneModel, setPhoneModel] = useState('iPhone 16 Pro Max');
  const [phoneStorage, setPhoneStorage] = useState('256GB');
  const [phoneImei, setPhoneImei] = useState('');
  const [phoneSerialNumber, setPhoneSerialNumber] = useState('');
  const [phoneIcloudStatus, setPhoneIcloudStatus] = useState<'signed_out' | 'locked' | 'unlocked'>('signed_out');
  const [phoneAccessories, setPhoneAccessories] = useState('กล่องแท้, สายชาร์จแท้');

  // 3. Vehicle
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'car' | 'pickup' | 'other'>('motorcycle');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleProvince, setVehicleProvince] = useState('กรุงเทพมหานคร');
  const [vehicleBrand, setVehicleBrand] = useState('Honda');
  const [vehicleModel, setVehicleModel] = useState('Wave 125i');
  const [vehicleHasBook, setVehicleHasBook] = useState(true);

  // Financial fields
  const [loanAmount, setLoanAmount] = useState<number>(30000);
  const [isTieredRate, setIsTieredRate] = useState<boolean>(settings.enableSteppedTiers);
  const [monthlyInterestRate, setMonthlyInterestRate] = useState<number>(
    settings.enableSteppedTiers
      ? calculateTieredInterestRate(30000, settings.tiers, settings.defaultMonthlyRate)
      : settings.defaultMonthlyRate
  );
  const [durationMonths, setDurationMonths] = useState<number>(settings.defaultDurationMonths || 2);
  const [note, setNote] = useState('');

  // Auto-calculated dates
  const todayIso = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayIso);
  const dueDate = addMonthsToDate(startDate, durationMonths);

  // Recalculate tiered rate whenever loanAmount changes
  const handleLoanAmountChange = (amount: number) => {
    setLoanAmount(amount);
    if (isTieredRate) {
      const calculatedRate = calculateTieredInterestRate(amount, settings.tiers, settings.defaultMonthlyRate);
      setMonthlyInterestRate(calculatedRate);
    }
  };

  // Preset gold weight helper
  const handleGoldWeightSelect = (baht: number) => {
    setGoldWeightBaht(baht);
    const gram = +(baht * 15.244).toFixed(3);
    setGoldWeightGram(gram);
    if (!itemName) {
      setItemName(`${goldTypeName}ทองคำ 96.5% น้ำหนัก ${baht} บาท`);
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
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhotos(prev => [...prev.slice(0, 3), dataUrl]);
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotos(prev => [...prev.slice(0, 3), reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add default demo photo for speed
  const addSamplePhoto = () => {
    const samplePhotos = {
      gold: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
      phone: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80',
      vehicle: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
      jewelry: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
      general: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    };
    setPhotos(prev => [...prev.slice(0, 3), samplePhotos[category]]);
  };

  // Filtered customer list for instant search
  const filteredCustomers = customers.filter(c => {
    const q = customerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.citizenId.includes(q) ||
      c.phone.includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let targetCustomer: Customer;
    let newlyCreatedCustomer: Customer | undefined;

    if (customerMode === 'search') {
      if (!selectedCustomer) {
        alert('กรุณาเลือกข้อมูลลูกค้า หรือคลิก "ลงทะเบียนลูกค้าใหม่"');
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

    // Prepare item details
    const finalItemName = itemName.trim() || (category === 'gold' ? `${goldTypeName}ทองคำ 96.5% น้ำหนัก ${goldWeightBaht} บาท` : `สินค้า${category}`);
    const pawnItem: PawnItem = {
      id: `item-${Date.now()}`,
      category,
      name: finalItemName,
      description: itemDescription.trim() || finalItemName,
      estimatedValue: estimatedValue || loanAmount * 1.25,
      photos,
      gold: category === 'gold' ? {
        goldType,
        goldTypeName,
        purity: goldPurity,
        weightBaht: goldWeightBaht,
        weightGram: goldWeightGram,
        condition: goldCondition,
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
      vehicle: category === 'vehicle' ? {
        vehicleType,
        licensePlate: licensePlate.trim(),
        province: vehicleProvince,
        brand: vehicleBrand,
        model: vehicleModel,
        hasBook: vehicleHasBook,
      } : undefined,
    };

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
      dueDate,
      status: 'active',
      isLocked: true, // Locked to protect against unauthorized alterations
      storageLocation: storageLocation.trim(),
      interestPayments: [],
      amendmentLogs: [],
      note: note.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    onSave(newContract, newlyCreatedCustomer);
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  const monthlyInterest = (loanAmount * monthlyInterestRate) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto no-print">
      <div className="w-full h-full sm:h-auto sm:max-h-[95vh] max-w-5xl bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400 text-slate-900 shadow-xs font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg tracking-tight">เปิดสัญญาใหม่ / บันทึกรับจำนำขายฝาก</h2>
              <p className="text-xs text-indigo-200">ระบบบันทึกรายการด่วนหน้าจอเดียว (Single Screen Workstation)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { stopCamera(); onClose(); }}
            className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECTION 1: AG CUSTOMER INTELLIGENCE */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <h3 className="font-semibold text-slate-900 text-sm">ข้อมูลลูกค้า (AG Customer Intelligence)</h3>
              </div>
              <div className="flex items-center p-1 bg-slate-200 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode('search')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${customerMode === 'search' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}
                >
                  ค้นหาลูกค้าเดิม
                </button>
                <button
                  type="button"
                  onClick={() => { setCustomerMode('new'); setSelectedCustomer(null); }}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${customerMode === 'new' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}
                >
                  + ลงทะเบียนลูกค้าใหม่
                </button>
              </div>
            </div>

            {customerMode === 'search' ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="พิมพ์ค้นหา: ชื่อ, นามสกุล, เลขบัตร ปชช. 13 หลัก, หรือเบอร์โทร..."
                    className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                  {filteredCustomers.map(c => {
                    const isSelected = selectedCustomer?.id === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all text-xs ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200'
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{c.prefix}{c.firstName} {c.lastName}</span>
                          {c.isVip && <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">VIP</span>}
                        </div>
                        <div className="text-slate-500 font-mono mt-0.5">{formatCitizenId(c.citizenId)}</div>
                        <div className="text-slate-500 mt-0.5">โทร: {formatPhone(c.phone)}</div>
                      </div>
                    );
                  })}
                </div>

                {selectedCustomer && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        ลูกค้าที่เลือก: <strong className="text-sm">{selectedCustomer.prefix}{selectedCustomer.firstName} {selectedCustomer.lastName}</strong>
                        <span className="text-slate-600 ml-2">บัตร ปชช. {formatCitizenId(selectedCustomer.citizenId)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline"
                    >
                      เปลี่ยน
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">คำนำหน้า</label>
                  <select
                    value={newCustPrefix}
                    onChange={(e) => setNewCustPrefix(e.target.value)}
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
                    value={newCustFirstName}
                    onChange={(e) => setNewCustFirstName(e.target.value)}
                    placeholder="เช่น สมพร"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    required={customerMode === 'new'}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">นามสกุล <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={newCustLastName}
                    onChange={(e) => setNewCustLastName(e.target.value)}
                    placeholder="เช่น มั่งมีสุข"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    required={customerMode === 'new'}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">เลขบัตรประชาชน (13 หลัก) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    maxLength={13}
                    value={newCustCitizenId}
                    onChange={(e) => setNewCustCitizenId(e.target.value)}
                    placeholder="1100200345678"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                    required={customerMode === 'new'}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="0812345678"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Line ID</label>
                  <input
                    type="text"
                    value={newCustLineId}
                    onChange={(e) => setNewCustLineId(e.target.value)}
                    placeholder="ไอดีไลน์ (ถ้ามี)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1">ที่อยู่ตามบัตร / ที่ติดต่อได้</label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    placeholder="เลขที่ หมู่บ้าน ตำบล อำเภอ จังหวัด"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: ITEM & ASSET DETAILS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="font-semibold text-slate-900 text-sm">ข้อมูลทรัพย์สินขายฝาก / จำนำ</h3>
              </div>
              <div className="flex items-center p-1 bg-slate-200 rounded-lg text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setCategory('gold')}
                  className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${category === 'gold' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-700'}`}
                >
                  ทองคำ / รูปพรรณ
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('phone')}
                  className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${category === 'phone' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700'}`}
                >
                  โทรศัพท์ / ไอที
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('vehicle')}
                  className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${category === 'vehicle' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700'}`}
                >
                  ยานพาหนะ / ทะเบียน
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('jewelry')}
                  className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${category === 'jewelry' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-700'}`}
                >
                  เพชร / อัญมณี
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('general')}
                  className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${category === 'general' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-700'}`}
                >
                  สินค้าทั่วไป
                </button>
              </div>
            </div>

            {/* Category Custom Fields */}
            {category === 'gold' && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 mb-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">ประเภททอง</label>
                    <select
                      value={goldType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setGoldType(val);
                        const names: Record<string, string> = {
                          necklace: 'สร้อยคอ',
                          bracelet: 'สร้อยข้อมือ',
                          ring: 'แหวน',
                          bangle: 'กำไล',
                          pendant: 'จี้ทอง',
                          bar: 'ทองคำแท่ง',
                          other: 'อื่นๆ',
                        };
                        setGoldTypeName(names[val] || 'ทอง');
                        setItemName(`${names[val] || 'ทอง'} 96.5% น้ำหนัก ${goldWeightBaht} บาท`);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white"
                    >
                      <option value="necklace">สร้อยคอ</option>
                      <option value="bracelet">สร้อยข้อมือ</option>
                      <option value="ring">แหวน</option>
                      <option value="bangle">กำไล</option>
                      <option value="pendant">จี้ทอง</option>
                      <option value="bar">ทองคำแท่ง</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">ความบริสุทธิ์</label>
                    <select
                      value={goldPurity}
                      onChange={(e) => setGoldPurity(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white"
                    >
                      <option value="96.5%">96.5% (มาตรฐานทองไทย)</option>
                      <option value="99.99%">99.99% (ทองสวิส/ฮ่องกง)</option>
                      <option value="90%">90%</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">น้ำหนัก (บาททอง)</label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="number"
                        step="0.05"
                        value={goldWeightBaht}
                        onChange={(e) => handleGoldWeightSelect(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">น้ำหนัก (กรัม)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={goldWeightGram}
                      onChange={(e) => setGoldWeightGram(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Quick weight shortcuts */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-500 mr-1">ปุ่มลัดน้ำหนัก:</span>
                  {[0.25, 0.5, 1, 2, 3, 5, 10].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleGoldWeightSelect(b)}
                      className={`px-2 py-1 rounded border text-[11px] font-mono ${goldWeightBaht === b ? 'bg-amber-500 text-white border-amber-600 font-bold' : 'bg-white border-amber-200 text-amber-900 hover:bg-amber-100'}`}
                    >
                      {b >= 1 ? `${b} บาท` : `${b === 0.25 ? '1 สลึง' : '2 สลึง'}`}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">สภาพและรายละเอียดลายทอง</label>
                  <input
                    type="text"
                    value={goldCondition}
                    onChange={(e) => setGoldCondition(e.target.value)}
                    placeholder="เช่น ลายผ่าหวาย ตราปั๊มร้านทองเยาวราช ตะขอสมบูรณ์"
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white"
                  />
                </div>
              </div>
            )}

            {category === 'phone' && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">ยี่ห้อ / แบรนด์</label>
                  <input
                    type="text"
                    value={phoneBrand}
                    onChange={(e) => setPhoneBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">รุ่นสินค้า</label>
                  <input
                    type="text"
                    value={phoneModel}
                    onChange={(e) => {
                      setPhoneModel(e.target.value);
                      setItemName(`${phoneBrand} ${e.target.value} ${phoneStorage}`);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">ความจุ</label>
                  <select
                    value={phoneStorage}
                    onChange={(e) => setPhoneStorage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white"
                  >
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">หมายเลข IMEI (15 หลัก)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={phoneImei}
                    onChange={(e) => setPhoneImei(e.target.value)}
                    placeholder="กด *#06# เพื่อดูเลข IMEI"
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">สถานะ iCloud / บัญชี</label>
                  <select
                    value={phoneIcloudStatus}
                    onChange={(e) => setPhoneIcloudStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white"
                  >
                    <option value="signed_out">ออกจากระบบเรียบร้อย (Sign out)</option>
                    <option value="unlocked">ปลดล็อคแล้ว</option>
                    <option value="locked">ติดล็อค (ต้องแจ้งรหัส)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">อุปกรณ์ที่นำมาด้วย</label>
                  <input
                    type="text"
                    value={phoneAccessories}
                    onChange={(e) => setPhoneAccessories(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white"
                  />
                </div>
              </div>
            )}

            {category === 'vehicle' && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">เลขทะเบียนรถ</label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => {
                      setLicensePlate(e.target.value);
                      setItemName(`${vehicleBrand} ${vehicleModel} ทะเบียน ${e.target.value} ${vehicleProvince}`);
                    }}
                    placeholder="เช่น 1กข-9999"
                    className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">จังหวัด</label>
                  <input
                    type="text"
                    value={vehicleProvince}
                    onChange={(e) => setVehicleProvince(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">ยี่ห้อ / รุ่น</label>
                  <input
                    type="text"
                    value={`${vehicleBrand} ${vehicleModel}`}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white"
                  />
                </div>
              </div>
            )}

            {/* General item title & description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">ชื่อรายการทรัพย์สิน <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="เช่น สร้อยคอทองคำ 96.5% น้ำหนัก 2 บาท ลายสี่เสา"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">สถานที่จัดเก็บในร้าน</label>
                <input
                  type="text"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  placeholder="เช่น ตู้เซฟ A-01, กล่องล็อกเกอร์หมายเลข 5"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* Direct Camera / Photo capture & Document Scan */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-700">รูปภาพสินค้า / สแกนเอกสาร (สูงสุด 4 รูป)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addSamplePhoto}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    ใส่รูปตัวอย่าง
                  </button>
                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-2.5 py-1 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-700 flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      ถ่ายจากกล้อง
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700 flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      กดถ่ายภาพ (Snap)
                    </button>
                  )}
                  <label className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded-lg text-xs hover:bg-slate-300 cursor-pointer flex items-center gap-1">
                    <span>อัปโหลด</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {isCameraActive && (
                <div className="mb-3 relative bg-black rounded-xl overflow-hidden aspect-video max-h-48 flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Photos preview strip */}
              <div className="flex gap-2 overflow-x-auto py-1">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-300 shrink-0 group">
                    <img src={p} alt={`asset-${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white p-1 rounded-full text-[10px]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length === 0 && (
                  <div className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-400">
                    ยังไม่มีรูปภาพ (สามารถถ่ายรูปหรืออัปโหลดหลักฐานทรัพย์สินเพื่อความปลอดภัย)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: FINANCIAL TERMS & STEPPED INTEREST */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h3 className="font-semibold text-slate-900 text-sm">การคำนวณเงินกู้และดอกเบี้ย</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  ยอดเงินต้นรับจำนำ (บาท) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="100"
                  value={loanAmount}
                  onChange={(e) => handleLoanAmountChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-base text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 font-medium">อัตราดอกเบี้ยต่อเดือน (%)</label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTieredRate}
                      onChange={(e) => {
                        setIsTieredRate(e.target.checked);
                        if (e.target.checked) {
                          setMonthlyInterestRate(calculateTieredInterestRate(loanAmount, settings.tiers, settings.defaultMonthlyRate));
                        }
                      }}
                      className="rounded text-indigo-600"
                    />
                    คิดขั้นบันได
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    value={monthlyInterestRate}
                    onChange={(e) => setMonthlyInterestRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-base text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3.5 top-3 text-slate-400 font-medium">%</span>
                </div>
                {isTieredRate && (
                  <p className="text-[10px] text-indigo-600 mt-1 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    คำนวณตามอัตราขั้นบันไดร้าน ({monthlyInterestRate}% / เดือน)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">ระยะเวลากำหนด (เดือน)</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1 เดือน (30 วัน)</option>
                  <option value={2}>2 เดือน (60 วัน)</option>
                  <option value={3}>3 เดือน (90 วัน)</option>
                  <option value={4}>4 เดือน (120 วัน)</option>
                  <option value={5}>5 เดือน (150 วัน)</option>
                  <option value={6}>6 เดือน (180 วัน)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">วันที่เริ่มต้นสัญญา</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Calculations highlight banner */}
            <div className="mt-4 bg-slate-900 text-white rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-slate-400">เงินต้นที่จ่ายออก:</div>
                <div className="text-xl font-bold font-mono text-white">{formatCurrency(loanAmount)}</div>
              </div>
              <div>
                <div className="text-slate-400">ดอกเบี้ยรับต่อเดือน:</div>
                <div className="text-xl font-bold font-mono text-amber-400">{formatCurrency(monthlyInterest)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">รวม {durationMonths} เดือน = {formatCurrency(monthlyInterest * durationMonths)}</div>
              </div>
              <div>
                <div className="text-slate-400">วันครบกำหนดไถ่ถอน:</div>
                <div className="text-base font-bold text-emerald-400">{formatThaiDate(dueDate, true)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">ระยะผ่อนผัน +{settings.gracePeriodDays} วันก่อนยึดหลุด</div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>ระบบล็อคสัญญาอัตโนมัติ:</strong> เมื่อกดบันทึก ข้อมูลสาระสำคัญ (เงินต้น, อัตราดอกเบี้ย, รายละเอียดทรัพย์สิน) จะถูกล็อคทันทีเพื่อป้องกันการทุจริต หากจำเป็นต้องแก้ไขในภายหลัง จะต้องได้รับการอนุมัติด้วยรหัส PIN ของผู้จัดการหรือเจ้าของร้านเท่านั้น
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { stopCamera(); onClose(); }}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              บันทึกสัญญาและพิมพ์ตั๋ว
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
