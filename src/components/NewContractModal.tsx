import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  Search,
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  Laptop,
  Monitor,
  Printer,
  Smartphone,
  Cpu,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import {
  Customer,
  FlaggedSerial,
  PawnContract,
  PawnItem,
  ItemCategory,
  SerialCheckMatch,
  ShopSettings,
  UserAccount
} from '../types/pawn';
import { SecondhandBuyIn } from '../types/buyIn';
import {
  formatThaiDate,
  calculateTieredInterestRate,
  addMonthsAndDaysToDate,
  calculateDurationFromDates,
  formatDurationText,
  formatCitizenId,
  formatPhone
} from '../utils/thaiFormat';
import { generateNextContractNumber } from '../utils/storage';
import { checkSerial } from '../utils/serialCheck';
import { RamPicker } from './RamPicker';

interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: PawnContract, newCustomer?: Customer) => void;
  customers: Customer[];
  existingContracts: PawnContract[];
  archivedContracts?: PawnContract[];
  secondhandBuyIns?: SecondhandBuyIn[];
  flaggedSerials?: FlaggedSerial[];
  settings: ShopSettings;
  currentUser: UserAccount;
  initialCustomer?: Customer | null;
}

const COMMON_NOTEBOOK_BRANDS = ['Asus', 'Acer', 'Lenovo', 'Dell', 'HP', 'Apple', 'MSI', 'Huawei', 'Samsung', 'Microsoft', 'อื่นๆ'];
const COMMON_PRINTER_BRANDS = ['Epson', 'Canon', 'Brother', 'HP', 'อื่นๆ'];

type FieldErrors = Record<string, string>;

export const NewContractModal: React.FC<NewContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customers,
  existingContracts,
  archivedContracts = [],
  secondhandBuyIns = [],
  flaggedSerials = [],
  settings,
  currentUser,
  initialCustomer,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  // Mode: select existing or new customer
  const [customerMode, setCustomerMode] = useState<'search' | 'new'>('search');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer fields (All blank by default)
  const [newCustCitizenId, setNewCustCitizenId] = useState('');
  const [newCustPrefix, setNewCustPrefix] = useState('');
  const [newCustFirstName, setNewCustFirstName] = useState('');
  const [newCustLastName, setNewCustLastName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustLineId, setNewCustLineId] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustIsVip, setNewCustIsVip] = useState(false);

  // Item category & general fields (All blank by default)
  const [category, setCategory] = useState<ItemCategory>('notebook');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [storageLocation, setStorageLocation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // 1. Notebook fields (All blank / unselected / unchecked)
  const [nbBrand, setNbBrand] = useState('');
  const [nbModel, setNbModel] = useState('');
  const [nbSerial, setNbSerial] = useState('');
  const [nbProcessor, setNbProcessor] = useState('');
  const [nbRam, setNbRam] = useState<number | null>(null);
  const [nbStorage, setNbStorage] = useState('');
  const [nbGpu, setNbGpu] = useState('');
  const [nbBattery, setNbBattery] = useState('');
  const [nbHasCharger, setNbHasCharger] = useState(false);
  const [nbHasBag, setNbHasBag] = useState(false);
  const [nbIcloudCleared, setNbIcloudCleared] = useState(false);

  // 2. Computer PC fields (All blank / unselected)
  const [pcBrandOrCustom, setPcBrandOrCustom] = useState('');
  const [pcModelOrCase, setPcModelOrCase] = useState('');
  const [pcProcessor, setPcProcessor] = useState('');
  const [pcRam, setPcRam] = useState<number | null>(null);
  const [pcStorage, setPcStorage] = useState('');
  const [pcGpu, setPcGpu] = useState('');
  const [pcMonitor, setPcMonitor] = useState('');
  const [pcAccessories, setPcAccessories] = useState('');

  // 3. Printer fields (All blank / unselected / unchecked)
  const [prBrand, setPrBrand] = useState('');
  const [prModel, setPrModel] = useState('');
  const [prSerial, setPrSerial] = useState('');
  const [prType, setPrType] = useState<'' | 'ink_tank' | 'laser' | 'all_in_one' | 'dot_matrix'>('');
  const [prInkSystem, setPrInkSystem] = useState<'' | 'genuine_tank' | 'cartridge' | 'mod_tank'>('');
  const [prHeadCondition, setPrHeadCondition] = useState<'' | 'normal' | 'need_clean'>('');
  const [prHasPowerCable, setPrHasPowerCable] = useState(false);
  const [prHasUsbCable, setPrHasUsbCable] = useState(false);

  // 4. Phone / Tablet fields (All blank / unselected)
  const [phoneBrand, setPhoneBrand] = useState('');
  const [phoneModel, setPhoneModel] = useState('');
  const [phoneStorage, setPhoneStorage] = useState('');
  const [phoneImei, setPhoneImei] = useState('');
  const [phoneSerialNumber, setPhoneSerialNumber] = useState('');
  const [phoneIcloudStatus, setPhoneIcloudStatus] = useState<'' | 'signed_out' | 'locked' | 'unlocked'>('');
  const [phoneAccessories, setPhoneAccessories] = useState('');

  // 5. IT Gadget fields (All blank / unselected)
  const [gtType, setGtType] = useState<'' | 'tablet' | 'monitor' | 'camera' | 'gpu_part' | 'console' | 'other'>('');
  const [gtBrand, setGtBrand] = useState('');
  const [gtModel, setGtModel] = useState('');
  const [gtSerial, setGtSerial] = useState('');
  const [gtSpecs, setGtSpecs] = useState('');

  // Financial & Contract terms (Blank amount and duration; startDate is system date)
  const getTodayIso = () => new Date().toISOString().split('T')[0];
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [isTieredRate, setIsTieredRate] = useState<boolean>(settings.enableSteppedTiers);
  const [monthlyInterestRate, setMonthlyInterestRate] = useState<number>(settings.defaultMonthlyRate);
  const [durationMonths, setDurationMonths] = useState<string>('');
  const [durationDays, setDurationDays] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(getTodayIso);
  const [dueDate, setDueDate] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Serial / IMEI duplicate & flagged check state
  const serialDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [serialMatches, setSerialMatches] = useState<SerialCheckMatch[]>([]);
  const [warnAcknowledged, setWarnAcknowledged] = useState<boolean>(false);
  const [showOverridePanel, setShowOverridePanel] = useState<boolean>(false);
  const [overrideApproved, setOverrideApproved] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');

  const clearSerialCheckState = useCallback(() => {
    if (serialDebounceRef.current) {
      clearTimeout(serialDebounceRef.current);
      serialDebounceRef.current = null;
    }
    setSerialMatches([]);
    setWarnAcknowledged(false);
    setShowOverridePanel(false);
    setOverrideApproved(false);
    setOverrideReason('');
  }, []);

  useEffect(() => {
    return () => {
      if (serialDebounceRef.current) {
        clearTimeout(serialDebounceRef.current);
      }
    };
  }, []);

  /**
   * ฟังก์ชันรีเซ็ตฟอร์มกลางสำหรับส่วนสินค้าไอทีทุกหมวดหมู่ (5 แท็บ)
   * ป้องกันค่าเดิมค้างข้ามแท็บหรือข้ามสัญญาอย่างเด็ดขาด
   */
  const resetItemForm = useCallback(() => {
    // General item fields
    setItemName('');
    setItemDescription('');
    setEstimatedValue('');
    setStorageLocation('');
    setPhotos([]);

    // 1. Notebook
    setNbBrand('');
    setNbModel('');
    setNbSerial('');
    setNbProcessor('');
    setNbRam(null);
    setNbStorage('');
    setNbGpu('');
    setNbBattery('');
    setNbHasCharger(false);
    setNbHasBag(false);
    setNbIcloudCleared(false);

    // 2. Computer PC
    setPcBrandOrCustom('');
    setPcModelOrCase('');
    setPcProcessor('');
    setPcRam(null);
    setPcStorage('');
    setPcGpu('');
    setPcMonitor('');
    setPcAccessories('');

    // 3. Printer
    setPrBrand('');
    setPrModel('');
    setPrSerial('');
    setPrType('');
    setPrInkSystem('');
    setPrHeadCondition('');
    setPrHasPowerCable(false);
    setPrHasUsbCable(false);

    // 4. Phone / Tablet
    setPhoneBrand('');
    setPhoneModel('');
    setPhoneStorage('');
    setPhoneImei('');
    setPhoneSerialNumber('');
    setPhoneIcloudStatus('');
    setPhoneAccessories('');

    // 5. IT Gadget
    setGtType('');
    setGtBrand('');
    setGtModel('');
    setGtSerial('');
    setGtSpecs('');

    // Clear item-related validation errors & serial alerts
    setFieldErrors({});
    clearSerialCheckState();
  }, [clearSerialCheckState]);

  /**
   * ฟังก์ชันรีเซ็ตฟอร์มสัญญาใหม่ทั้งหน้าต่าง (ลูกค้า + สินค้า + การเงิน)
   */
  const resetFullContractForm = useCallback(() => {
    resetItemForm();
    setCategory('notebook');

    // Customer section
    setCustomerMode('search');
    setCustomerSearchQuery('');
    setSelectedCustomer(initialCustomer || null);
    setNewCustCitizenId('');
    setNewCustPrefix('');
    setNewCustFirstName('');
    setNewCustLastName('');
    setNewCustPhone('');
    setNewCustLineId('');
    setNewCustAddress('');
    setNewCustIsVip(false);

    // Financial & Dates (keep system-generated startDate only)
    const today = getTodayIso();
    setLoanAmount('');
    setIsTieredRate(settings.enableSteppedTiers);
    setMonthlyInterestRate(settings.defaultMonthlyRate);
    setDurationMonths('');
    setDurationDays('');
    setStartDate(today);
    setDueDate('');
    setNote('');
    setFieldErrors({});

    if (formRef.current) {
      formRef.current.reset();
    }
  }, [resetItemForm, initialCustomer, settings.enableSteppedTiers, settings.defaultMonthlyRate]);

  // Reset form completely every time the "New Contract" modal opens
  useEffect(() => {
    if (isOpen) {
      resetFullContractForm();
    }
  }, [isOpen, resetFullContractForm]);

  const clearError = (key: string) => {
    setFieldErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Switch category tab & immediately reset all item fields
  const handleSelectCategory = (cat: ItemCategory) => {
    resetItemForm();
    setCategory(cat);
  };

  // Run serial/IMEI verification immediately
  const runSerialCheckNow = useCallback(
    (rawSerial: string, isImei = false): SerialCheckMatch[] => {
      if (serialDebounceRef.current) {
        clearTimeout(serialDebounceRef.current);
        serialDebounceRef.current = null;
      }
      if (!rawSerial.trim()) {
        setSerialMatches([]);
        return [];
      }
      const matches = checkSerial(rawSerial, {
        contracts: existingContracts,
        archivedContracts,
        secondhandBuyIns,
        flagged: flaggedSerials,
        customerId: customerMode === 'search' ? selectedCustomer?.id : undefined,
        customerCitizenId:
          customerMode === 'search'
            ? selectedCustomer?.citizenId
            : newCustCitizenId.replace(/\D/g, ''),
        isImei,
      });
      setSerialMatches(matches);
      return matches;
    },
    [
      existingContracts,
      archivedContracts,
      secondhandBuyIns,
      flaggedSerials,
      customerMode,
      selectedCustomer,
      newCustCitizenId,
    ]
  );

  // Debounced serial check (400ms) on input change
  const handleSerialInputChange = (
    val: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    errorKey: string,
    isImei = false
  ) => {
    setter(val);
    clearError(errorKey);
    // Reset prior acknowledgments/overrides when serial value changes
    setWarnAcknowledged(false);
    setShowOverridePanel(false);
    setOverrideApproved(false);
    setOverrideReason('');

    if (serialDebounceRef.current) {
      clearTimeout(serialDebounceRef.current);
      serialDebounceRef.current = null;
    }

    if (!val.trim()) {
      setSerialMatches([]);
      return;
    }

    serialDebounceRef.current = setTimeout(() => {
      runSerialCheckNow(val, isImei);
    }, 400);
  };

  const canOverrideBlock = currentUser.role === 'admin' || currentUser.role === 'manager';
  const hasSerialBlock = serialMatches.some((m) => m.level === 'block');
  const hasSerialWarn = serialMatches.some((m) => m.level === 'warn');
  const isBlockOverridden =
    hasSerialBlock &&
    canOverrideBlock &&
    overrideApproved &&
    overrideReason.trim().length >= 10;
  const isSaveLockedBySerial =
    (hasSerialBlock && !isBlockOverridden) || (hasSerialWarn && !warnAcknowledged);

  // Date & Duration helpers
  const parsedMonths = durationMonths === '' ? 0 : Math.max(0, parseInt(durationMonths, 10) || 0);
  const parsedDays = durationDays === '' ? 0 : Math.max(0, parseInt(durationDays, 10) || 0);
  const parsedLoanAmount = loanAmount === '' ? 0 : Math.max(0, parseFloat(loanAmount) || 0);

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (newStart && (parsedMonths > 0 || parsedDays > 0)) {
      setDueDate(addMonthsAndDaysToDate(newStart, parsedMonths, parsedDays));
      clearError('dueDate');
    }
  };

  const handleDurationMonthsChange = (val: string) => {
    setDurationMonths(val);
    const m = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
    if (m > 0 || parsedDays > 0) {
      setDueDate(addMonthsAndDaysToDate(startDate, m, parsedDays));
      clearError('duration');
      clearError('dueDate');
    } else {
      setDueDate('');
    }
  };

  const handleDurationDaysChange = (val: string) => {
    setDurationDays(val);
    const d = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
    if (parsedMonths > 0 || d > 0) {
      setDueDate(addMonthsAndDaysToDate(startDate, parsedMonths, d));
      clearError('duration');
      clearError('dueDate');
    } else {
      setDueDate('');
    }
  };

  const handleDueDateChange = (newDue: string) => {
    setDueDate(newDue);
    clearError('dueDate');
    clearError('duration');
    if (newDue && startDate) {
      const { months, days } = calculateDurationFromDates(startDate, newDue);
      setDurationMonths(String(months));
      setDurationDays(String(days));
    }
  };

  const handlePresetSelect = (m: number, d: number) => {
    setDurationMonths(String(m));
    setDurationDays(String(d));
    setDueDate(addMonthsAndDaysToDate(startDate, m, d));
    clearError('duration');
    clearError('dueDate');
  };

  // Interest calculations
  const totalDurationMonths = parsedMonths + parsedDays / 30;
  const totalInterest = Math.round(parsedLoanAmount * (monthlyInterestRate / 100) * totalDurationMonths);
  const monthlyInterest = Math.round(parsedLoanAmount * (monthlyInterestRate / 100));
  const dailyInterest = Math.round(monthlyInterest / 30);

  const handleLoanAmountChange = (val: string) => {
    setLoanAmount(val);
    clearError('loanAmount');
    const numeric = parseFloat(val) || 0;
    if (isTieredRate && numeric > 0) {
      const calculatedRate = calculateTieredInterestRate(numeric, settings.tiers, settings.defaultMonthlyRate);
      setMonthlyInterestRate(calculatedRate);
    }
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
    e.target.value = '';
  };

  // Save new contract with strict required-field validation
  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: FieldErrors = {};

    // 1. Validate Customer
    if (customerMode === 'search') {
      if (!selectedCustomer) {
        errors.selectedCustomer = 'กรุณาเลือกลูกค้าจากรายการ หรือสลับไปแท็บ "+ ลงทะเบียนลูกค้าใหม่"';
      }
    } else {
      if (newCustCitizenId.replace(/\D/g, '').length !== 13) {
        errors.newCustCitizenId = 'กรุณากรอกเลขบัตรประชาชน 13 หลักให้ครบถ้วน';
      }
      if (!newCustPrefix) {
        errors.newCustPrefix = 'กรุณาเลือกคำนำหน้า';
      }
      if (!newCustFirstName.trim()) {
        errors.newCustFirstName = 'กรุณากรอกชื่อจริง';
      }
      if (!newCustLastName.trim()) {
        errors.newCustLastName = 'กรุณากรอกนามสกุล';
      }
      if (!newCustPhone.trim()) {
        errors.newCustPhone = 'กรุณากรอกเบอร์โทรศัพท์';
      }
    }

    // 2. Validate Category-Specific Required Fields (Brand, Model, S/N, RAM)
    if (category === 'notebook') {
      if (!nbBrand.trim()) errors.nbBrand = 'กรุณาเลือกยี่ห้อโน็ตบุ้ค';
      if (!nbModel.trim()) errors.nbModel = 'กรุณากรอกรุ่น / ซีรีส์';
      if (!nbSerial.trim()) errors.nbSerial = 'กรุณากรอกหมายเลขเครื่อง (S/N)';
      if (nbRam === null) errors.nbRam = 'กรุณากดเลือกขนาด RAM (8G / 16G / 32G / 64G)';
    } else if (category === 'computer') {
      if (!pcBrandOrCustom.trim()) errors.pcBrandOrCustom = 'กรุณากรอกแบรนด์ / การประกอบ';
      if (!pcModelOrCase.trim()) errors.pcModelOrCase = 'กรุณากรอกรุ่น / เคส';
      if (!pcProcessor.trim()) errors.pcProcessor = 'กรุณากรอกซีพียู (CPU)';
      if (pcRam === null) errors.pcRam = 'กรุณาเลือกขนาด RAM';
    } else if (category === 'printer') {
      if (!prBrand.trim()) errors.prBrand = 'กรุณาเลือกยี่ห้อเครื่องพิมพ์';
      if (!prModel.trim()) errors.prModel = 'กรุณากรอกรุ่นเครื่องพิมพ์';
      if (!prSerial.trim()) errors.prSerial = 'กรุณากรอกหมายเลขเครื่อง (S/N)';
    } else if (category === 'phone') {
      if (!phoneBrand.trim()) errors.phoneBrand = 'กรุณากรอกยี่ห้อมือถือ / แท็บเล็ต';
      if (!phoneModel.trim()) errors.phoneModel = 'กรุณากรอกรุ่นสินค้า';
      if (!phoneImei.trim()) errors.phoneImei = 'กรุณากรอกหมายเลข IMEI / S/N';
    } else if (category === 'gadget_it') {
      if (!gtType) errors.gtType = 'กรุณาเลือกประเภทอุปกรณ์';
      if (!gtBrand.trim()) errors.gtBrand = 'กรุณากรอกยี่ห้อ / แบรนด์';
      if (!gtModel.trim()) errors.gtModel = 'กรุณากรอกรุ่นสินค้า';
      if (!gtSerial.trim()) errors.gtSerial = 'กรุณากรอกหมายเลขเครื่อง (S/N)';
    }

    // 3. Validate General Item Name & Financial Terms
    if (!itemName.trim()) {
      errors.itemName = 'กรุณากรอกชื่อรายการทรัพย์สินไอที';
    }
    if (parsedLoanAmount <= 0) {
      errors.loanAmount = 'กรุณากรอกจำนวนเงินต้นที่มากกว่า 0 บาท';
    }
    if (parsedMonths <= 0 && parsedDays <= 0) {
      errors.duration = 'กรุณากำหนดระยะเวลาสัญญา (เดือน/วัน)';
    }
    if (!dueDate) {
      errors.dueDate = 'กรุณากำหนดวันครบกำหนดไถ่ถอน';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorEl = formRef.current?.querySelector('[data-has-error="true"]') as HTMLElement | null;
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Re-run serial/IMEI verification before saving to ensure up-to-date enforcement
    const serialFieldValue =
      category === 'notebook'
        ? nbSerial
        : category === 'printer'
        ? prSerial
        : category === 'phone'
        ? phoneImei
        : category === 'gadget_it'
        ? gtSerial
        : '';

    const finalSerialMatches = serialFieldValue.trim()
      ? runSerialCheckNow(serialFieldValue, category === 'phone')
      : [];

    const finalHasBlock = finalSerialMatches.some((m) => m.level === 'block');
    const finalHasWarn = finalSerialMatches.some((m) => m.level === 'warn');
    const finalOverridden =
      finalHasBlock &&
      canOverrideBlock &&
      overrideApproved &&
      overrideReason.trim().length >= 10;

    if (finalHasBlock && !finalOverridden) {
      const serialErrorKey =
        category === 'notebook'
          ? 'nbSerial'
          : category === 'printer'
          ? 'prSerial'
          : category === 'phone'
          ? 'phoneImei'
          : 'gtSerial';
      setFieldErrors({
        [serialErrorKey]:
          'พบเลขเครื่องต้องห้าม/ซ้ำในระบบ ต้องให้ผู้จัดการหรือเจ้าของร้านอนุมัติข้ามคำเตือนก่อนบันทึก',
      });
      return;
    }

    if (finalHasWarn && !warnAcknowledged) {
      const serialErrorKey =
        category === 'notebook'
          ? 'nbSerial'
          : category === 'printer'
          ? 'prSerial'
          : category === 'phone'
          ? 'phoneImei'
          : 'gtSerial';
      setFieldErrors({
        [serialErrorKey]: 'กรุณาติ๊กยืนยัน "ได้ตรวจสอบแล้ว" ใต้ช่องหมายเลขเครื่องก่อนบันทึก',
      });
      return;
    }

    let targetCustomer: Customer;
    let newlyCreatedCustomer: Customer | undefined;

    if (customerMode === 'search') {
      targetCustomer = selectedCustomer!;
    } else {
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

    const parsedEstimatedValue = parseFloat(estimatedValue) || Math.round(parsedLoanAmount * 1.3);

    // Build IT PawnItem object purely from user inputs (no sample values)
    const pawnItem: PawnItem = {
      id: `item-${Date.now()}`,
      category,
      name: itemName.trim(),
      description: itemDescription.trim() || itemName.trim(),
      estimatedValue: parsedEstimatedValue,
      photos,
      ...(category === 'notebook' ? {
        notebook: {
          brand: nbBrand.trim(),
          model: nbModel.trim(),
          serialNumber: nbSerial.trim().toUpperCase(),
          processor: nbProcessor.trim(),
          ramGb: nbRam!,
          storage: nbStorage.trim(),
          ...(nbGpu.trim() ? { gpu: nbGpu.trim() } : {}),
          ...(nbBattery ? { batteryHealth: nbBattery } : {}),
          hasCharger: nbHasCharger,
          hasBag: nbHasBag,
          icloudStatus: nbIcloudCleared ? 'unlocked' : 'locked',
        }
      } : {}),
      ...(category === 'computer' ? {
        computer: {
          brandOrCustom: pcBrandOrCustom.trim(),
          modelOrCase: pcModelOrCase.trim(),
          processor: pcProcessor.trim(),
          ramGb: pcRam!,
          storage: pcStorage.trim(),
          ...(pcGpu.trim() ? { gpu: pcGpu.trim() } : {}),
          ...(pcMonitor.trim() ? { monitor: pcMonitor.trim() } : {}),
          accessories: pcAccessories.split(',').map(s => s.trim()).filter(Boolean),
        }
      } : {}),
      ...(category === 'printer' ? {
        printer: {
          brand: prBrand.trim(),
          model: prModel.trim(),
          serialNumber: prSerial.trim().toUpperCase(),
          printerType: (prType || 'ink_tank'),
          inkSystem: (prInkSystem || 'genuine_tank'),
          headCondition: (prHeadCondition || 'normal'),
          hasPowerCable: prHasPowerCable,
          hasUsbCable: prHasUsbCable,
        }
      } : {}),
      ...(category === 'phone' ? {
        phone: {
          brand: phoneBrand.trim(),
          model: phoneModel.trim(),
          storageGb: phoneStorage || '-',
          imei: phoneImei.trim(),
          ...(phoneSerialNumber.trim() ? { serialNumber: phoneSerialNumber.trim().toUpperCase() } : {}),
          accessories: phoneAccessories.split(',').map(s => s.trim()).filter(Boolean),
          icloudStatus: (phoneIcloudStatus || 'unlocked'),
        }
      } : {}),
      ...(category === 'gadget_it' ? {
        itGadget: {
          gadgetType: (gtType || 'other'),
          brand: gtBrand.trim(),
          model: gtModel.trim(),
          serialNumber: gtSerial.trim().toUpperCase(),
          specsSummary: gtSpecs.trim(),
          accessories: [],
        }
      } : {}),
    };

    const nextContractNumber = generateNextContractNumber(existingContracts);

    const newContract: PawnContract = {
      id: `c-${Date.now()}`,
      contractNumber: nextContractNumber,
      customerId: targetCustomer.id,
      customerSnapshot: targetCustomer,
      item: pawnItem,
      loanAmount: parsedLoanAmount,
      monthlyInterestRate,
      isTieredRate,
      startDate,
      durationMonths: parsedMonths,
      durationDays: parsedDays,
      dueDate,
      status: 'active',
      isLocked: true,
      storageLocation: storageLocation.trim(),
      interestPayments: [],
      amendmentLogs: [],
      note: note.trim(),
      ...(serialFieldValue.trim()
        ? {
            serialCheck: {
              checkedAt: new Date().toISOString(),
              results: finalSerialMatches,
              ...(finalOverridden
                ? {
                    overriddenBy: currentUser.name,
                    overrideReason: overrideReason.trim(),
                  }
                : {}),
            },
          }
        : {}),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    onSave(newContract, newlyCreatedCustomer);
    resetFullContractForm();
    onClose();
  };

  if (!isOpen) return null;

  const renderSerialCheckAlerts = () => {
    if (serialMatches.length === 0) return null;

    const blockMatches = serialMatches.filter((m) => m.level === 'block');
    const warnMatches = serialMatches.filter((m) => m.level === 'warn');
    const infoMatches = serialMatches.filter((m) => m.level === 'info');

    return (
      <div className="mt-1.5 space-y-1.5">
        {blockMatches.length > 0 && (
          <div className="p-2.5 rounded-lg border-2 border-rose-500 bg-rose-50 text-rose-900 space-y-2 text-[11px]">
            <div className="flex items-start gap-1.5 font-bold text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>พบปัญหาต้องระงับการรับฝาก (BLOCK)</span>
            </div>
            <ul className="space-y-1 pl-5 list-disc">
              {blockMatches.map((m, idx) => (
                <li key={`${m.refId}-${idx}`}>
                  <div className="font-bold">{m.label}</div>
                  <div className="text-[10px] text-rose-700">{m.detail}</div>
                </li>
              ))}
            </ul>

            {canOverrideBlock ? (
              <div className="pt-1.5 border-t border-rose-200 space-y-1.5">
                {!showOverridePanel && !overrideApproved && (
                  <button
                    type="button"
                    onClick={() => setShowOverridePanel(true)}
                    className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-md text-[10.5px] cursor-pointer"
                  >
                    อนุมัติข้ามคำเตือน ({currentUser.role === 'admin' ? 'เจ้าของร้าน' : 'ผู้จัดการ'})
                  </button>
                )}

                {(showOverridePanel || overrideApproved) && (
                  <div className="space-y-1.5 bg-white/90 p-2 rounded border border-rose-300">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-rose-900">
                        ระบุเหตุผลการอนุมัติข้ามคำเตือน (อย่างน้อย 10 ตัวอักษร):
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          overrideReason.trim().length >= 10 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {overrideReason.trim().length}/10
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={overrideReason}
                      onChange={(e) => {
                        setOverrideReason(e.target.value);
                        if (e.target.value.trim().length < 10) {
                          setOverrideApproved(false);
                        }
                      }}
                      placeholder="เช่น ตรวจสอบหลักฐานแล้วเป็นเครื่องคนละรุ่นหรือลูกค้าแจ้งปิดสัญญาเก่าเรียบร้อย..."
                      className="w-full px-2 py-1 text-[11px] bg-white border border-rose-300 rounded text-slate-900 resize-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                      {!overrideApproved ? (
                        <button
                          type="button"
                          disabled={overrideReason.trim().length < 10}
                          onClick={() => setOverrideApproved(true)}
                          className={`px-2.5 py-1 rounded text-[10.5px] font-bold transition-colors ${
                            overrideReason.trim().length >= 10
                              ? 'bg-rose-700 hover:bg-rose-800 text-white cursor-pointer'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          ยืนยันอนุมัติข้ามคำเตือน
                        </button>
                      ) : (
                        <span className="text-[10.5px] font-bold text-emerald-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          อนุมัติข้ามคำเตือนแล้ว โดย {currentUser.name}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowOverridePanel(false);
                          setOverrideApproved(false);
                          setOverrideReason('');
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        ยกเลิกการอนุมัติ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-1 border-t border-rose-200 text-[10.5px] font-semibold text-rose-800">
                ไม่สามารถบันทึกได้: สิทธิ์พนักงานทั่วไป ({currentUser.role}) ไม่สามารถข้ามคำเตือนระดับ Block กรุณาให้ผู้จัดการหรือเจ้าของร้านตรวจสอบและอนุมัติ
              </div>
            )}
          </div>
        )}

        {warnMatches.length > 0 && (
          <div className="p-2.5 rounded-lg border-2 border-amber-400 bg-amber-50 text-amber-900 space-y-1.5 text-[11px]">
            <div className="flex items-start gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>คำเตือนการตรวจสอบเลขเครื่อง (WARN)</span>
            </div>
            <ul className="space-y-1 pl-5 list-disc">
              {warnMatches.map((m, idx) => (
                <li key={`${m.refId}-${idx}`}>
                  <div className="font-bold">{m.label}</div>
                  <div className="text-[10px] text-amber-800">{m.detail}</div>
                </li>
              ))}
            </ul>
            <label className="flex items-center gap-1.5 pt-1 border-t border-amber-200 cursor-pointer font-bold text-amber-950">
              <input
                type="checkbox"
                checked={warnAcknowledged}
                onChange={(e) => setWarnAcknowledged(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>ได้ตรวจสอบแล้ว (ยืนยันความถูกต้องเพื่อบันทึกสัญญา)</span>
            </label>
          </div>
        )}

        {infoMatches.length > 0 && (
          <div className="p-2 rounded-lg border border-sky-400 bg-sky-50 text-sky-900 space-y-1 text-[11px]">
            <div className="flex items-start gap-1.5 font-bold text-sky-800">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>ข้อมูลอ้างอิง (INFO)</span>
            </div>
            <ul className="space-y-0.5 pl-5 list-disc">
              {infoMatches.map((m, idx) => (
                <li key={`${m.refId}-${idx}`}>
                  <span className="font-semibold">{m.label}: </span>
                  <span className="text-[10px] text-sky-800">{m.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const previewContractNumber = generateNextContractNumber(existingContracts);

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
              <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                <span>เปิดสัญญาขายฝาก / จำนำไอทีใหม่</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-normal">
                  เลขที่อัตโนมัติ: {previewContractNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ฟอร์มเริ่มว่างทุกครั้งเพื่อป้องกันข้อมูลผิดพลาด · กรุณากรอกข้อมูลสินค้าจริงก่อนบันทึก
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetFullContractForm();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content (autocomplete="off" + noValidate so custom red error highlights validate everything including RAM buttons) */}
        <form
          ref={formRef}
          onSubmit={handleSaveContract}
          autoComplete="off"
          noValidate
          className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 text-slate-800 text-xs"
        >
          {/* Global error summary banner when validation fails */}
          {Object.keys(fieldErrors).length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนก่อนบันทึกสัญญา</div>
                <div className="text-[11px] text-rose-700">
                  พบข้อมูลที่ยังไม่ระบุจำนวน {Object.keys(fieldErrors).length} รายการ (โปรดตรวจสอบช่องที่มีกรอบสีแดงด้านล่าง)
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: CUSTOMER SELECTION / SMART LOOKUP */}
          <div
            data-has-error={Boolean(fieldErrors.selectedCustomer)}
            className={`bg-slate-50 border rounded-xl p-3 sm:p-4 space-y-3 ${
              fieldErrors.selectedCustomer ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>ข้อมูลผู้ขายฝาก (ลูกค้า) *</span>
              </div>
              <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode('search');
                    clearError('selectedCustomer');
                  }}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    customerMode === 'search' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  ค้นหาลูกค้าเดิม (AG Customer)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode('new');
                    clearError('selectedCustomer');
                  }}
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
                    name="search-customer-no-autofill"
                    autoComplete="off"
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
                        onClick={() => {
                          setSelectedCustomer(cust);
                          clearError('selectedCustomer');
                        }}
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
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-[10px] font-bold bg-amber-200 hover:bg-amber-300 px-2 py-0.5 rounded-full text-amber-900 cursor-pointer"
                    >
                      เลือกแล้ว ✕
                    </button>
                  </div>
                )}

                {fieldErrors.selectedCustomer && (
                  <p className="text-[11px] font-semibold text-rose-600">{fieldErrors.selectedCustomer}</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div data-has-error={Boolean(fieldErrors.newCustCitizenId)}>
                  <label className="block text-slate-700 font-semibold mb-1">เลขบัตร ปชช. (13 หลัก) *</label>
                  <input
                    type="text"
                    name="new-cust-cid"
                    autoComplete="off"
                    maxLength={13}
                    value={newCustCitizenId}
                    onChange={(e) => {
                      setNewCustCitizenId(e.target.value.replace(/\D/g, ''));
                      clearError('newCustCitizenId');
                    }}
                    placeholder="กรอกเลขบัตร 13 หลัก"
                    className={`w-full font-mono bg-white border rounded-lg px-2.5 py-1.5 text-xs text-slate-900 ${
                      fieldErrors.newCustCitizenId ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'
                    }`}
                    required
                  />
                  {fieldErrors.newCustCitizenId && (
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.newCustCitizenId}</p>
                  )}
                </div>
                <div data-has-error={Boolean(fieldErrors.newCustPrefix)}>
                  <label className="block text-slate-700 font-semibold mb-1">คำนำหน้า *</label>
                  <select
                    autoComplete="off"
                    value={newCustPrefix}
                    onChange={(e) => {
                      setNewCustPrefix(e.target.value);
                      clearError('newCustPrefix');
                    }}
                    className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs text-slate-900 ${
                      fieldErrors.newCustPrefix ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'
                    }`}
                    required
                  >
                    <option value="">-- เลือก --</option>
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="อาจารย์">อาจารย์</option>
                    <option value="คุณ">คุณ</option>
                  </select>
                  {fieldErrors.newCustPrefix && (
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.newCustPrefix}</p>
                  )}
                </div>
                <div data-has-error={Boolean(fieldErrors.newCustPhone)}>
                  <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์ *</label>
                  <input
                    type="tel"
                    name="new-cust-phone"
                    autoComplete="off"
                    value={newCustPhone}
                    onChange={(e) => {
                      setNewCustPhone(e.target.value);
                      clearError('newCustPhone');
                    }}
                    placeholder="กรอกเบอร์โทรศัพท์"
                    className={`w-full font-mono bg-white border rounded-lg px-2.5 py-1.5 text-xs text-slate-900 ${
                      fieldErrors.newCustPhone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'
                    }`}
                    required
                  />
                  {fieldErrors.newCustPhone && (
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.newCustPhone}</p>
                  )}
                </div>
                <div data-has-error={Boolean(fieldErrors.newCustFirstName)}>
                  <label className="block text-slate-700 font-semibold mb-1">ชื่อจริง *</label>
                  <input
                    type="text"
                    name="new-cust-firstname"
                    autoComplete="off"
                    value={newCustFirstName}
                    onChange={(e) => {
                      setNewCustFirstName(e.target.value);
                      clearError('newCustFirstName');
                    }}
                    placeholder="ชื่อลูกค้า"
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs text-slate-900 ${
                      fieldErrors.newCustFirstName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'
                    }`}
                    required
                  />
                  {fieldErrors.newCustFirstName && (
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.newCustFirstName}</p>
                  )}
                </div>
                <div data-has-error={Boolean(fieldErrors.newCustLastName)}>
                  <label className="block text-slate-700 font-semibold mb-1">นามสกุล *</label>
                  <input
                    type="text"
                    name="new-cust-lastname"
                    autoComplete="off"
                    value={newCustLastName}
                    onChange={(e) => {
                      setNewCustLastName(e.target.value);
                      clearError('newCustLastName');
                    }}
                    placeholder="นามสกุล"
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs text-slate-900 ${
                      fieldErrors.newCustLastName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'
                    }`}
                    required
                  />
                  {fieldErrors.newCustLastName && (
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.newCustLastName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Line ID</label>
                  <input
                    type="text"
                    name="new-cust-line"
                    autoComplete="off"
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
                    name="new-cust-address"
                    autoComplete="off"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    placeholder="กรอกที่อยู่ตามบัตรประชาชน"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: ITEM & ASSET DETAILS (ALL 5 CATEGORIES START BLANK) */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <div data-has-error={Boolean(fieldErrors.nbBrand)}>
                    <label className="block text-slate-700 font-semibold mb-1">ยี่ห้อ (Brand) *</label>
                    <select
                      autoComplete="off"
                      value={nbBrand}
                      onChange={(e) => {
                        setNbBrand(e.target.value);
                        clearError('nbBrand');
                      }}
                      className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs ${
                        fieldErrors.nbBrand ? 'border-rose-500 ring-1 ring-rose-500' : 'border-amber-300'
                      }`}
                      required
                    >
                      <option value="">-- เลือก --</option>
                      {COMMON_NOTEBOOK_BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {fieldErrors.nbBrand && (
                      <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.nbBrand}</p>
                    )}
                  </div>
                  <div data-has-error={Boolean(fieldErrors.nbModel)}>
                    <label className="block text-slate-700 font-semibold mb-1">รุ่น / ซีรีส์ (Model) *</label>
                    <input
                      type="text"
                      name="nb-model-no-autofill"
                      autoComplete="off"
                      value={nbModel}
                      onChange={(e) => {
                        setNbModel(e.target.value);
                        clearError('nbModel');
                      }}
                      placeholder="กรอกรุ่น / ซีรีส์"
                      className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                        fieldErrors.nbModel ? 'border-rose-500 ring-1 ring-rose-500' : 'border-amber-300'
                      }`}
                      required
                    />
                    {fieldErrors.nbModel && (
                      <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.nbModel}</p>
                    )}
                  </div>
                  <div data-has-error={Boolean(fieldErrors.nbSerial)}>
                    <label className="block text-slate-700 font-semibold mb-1">หมายเลขเครื่อง (S/N) *</label>
                    <input
                      type="text"
                      name="nb-serial-no-autofill"
                      autoComplete="off"
                      value={nbSerial}
                      onChange={(e) => handleSerialInputChange(e.target.value, setNbSerial, 'nbSerial', false)}
                      onBlur={(e) => runSerialCheckNow(e.target.value, false)}
                      placeholder="กรอกหมายเลข S/N"
                      className={`w-full font-mono uppercase font-bold bg-white border rounded-lg px-2.5 py-1.5 text-xs text-amber-950 ${
                        fieldErrors.nbSerial ? 'border-rose-500 ring-1 ring-rose-500' : 'border-amber-300'
                      }`}
                      required
                    />
                    {fieldErrors.nbSerial && (
                      <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.nbSerial}</p>
                    )}
                    {category === 'notebook' && renderSerialCheckAlerts()}
                  </div>
                  <div data-has-error={Boolean(fieldErrors.nbRam)}>
                    <label className="block text-slate-700 font-semibold mb-1">หน่วยความจำ (RAM) *</label>
                    <RamPicker
                      value={nbRam}
                      onChange={(gb) => {
                        setNbRam(gb);
                        if (gb !== null) clearError('nbRam');
                      }}
                      hasError={Boolean(fieldErrors.nbRam)}
                      accent="amber"
                    />
                    {fieldErrors.nbRam && (
                      <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.nbRam}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ซีพียู (Processor)</label>
                    <input
                      type="text"
                      name="nb-cpu-no-autofill"
                      autoComplete="off"
                      value={nbProcessor}
                      onChange={(e) => setNbProcessor(e.target.value)}
                      placeholder="ระบุรุ่น CPU"
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ความจุ (SSD/Storage)</label>
                    <input
                      type="text"
                      name="nb-storage-no-autofill"
                      autoComplete="off"
                      value={nbStorage}
                      onChange={(e) => setNbStorage(e.target.value)}
                      placeholder="ระบุความจุ SSD/HDD"
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">การ์ดจอ (GPU)</label>
                    <input
                      type="text"
                      name="nb-gpu-no-autofill"
                      autoComplete="off"
                      value={nbGpu}
                      onChange={(e) => setNbGpu(e.target.value)}
                      placeholder="ระบุรุ่น GPU"
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">สถานะแบตเตอรี่</label>
                    <select
                      autoComplete="off"
                      value={nbBattery}
                      onChange={(e) => setNbBattery(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs"
                    >
                      <option value="">-- เลือก --</option>
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
                      checked={nbIcloudCleared}
                      onChange={(e) => setNbIcloudCleared(e.target.checked)}
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
                  <div data-has-error={Boolean(fieldErrors.pcBrandOrCustom)}>
                    <label className="block text-slate-700 font-semibold mb-1">แบรนด์ / การประกอบ *</label>
                    <input
                      type="text"
                      name="pc-brand-no-autofill"
                      autoComplete="off"
                      value={pcBrandOrCustom}
                      onChange={(e) => {
                        setPcBrandOrCustom(e.target.value);
                        clearError('pcBrandOrCustom');
                      }}
                      placeholder="ระบุยี่ห้อหรือชุดประกอบ"
                      className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs ${
                        fieldErrors.pcBrandOrCustom ? 'border-rose-500 ring-1 ring-rose-500' : 'border-indigo-300'
                      }`}
                      required
                    />
                    {fieldErrors.pcBrandOrCustom && (
                      <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.pcBrandOrCustom}</p>
                    )}
                  </div>
                  <div data-has-error={Boolean(fieldErrors.pcModelOrCase)}>
                    <label className="block text-slate-700 font-semibold mb-1">เคส / โมเดล (Case Model) *</label>
                    <input
                      type="text"
                      name="pc-model-no-autofill"
                      autoComplete="off"
                      value={pcModelOrCase}
                      onChange={(e) => {
                        setPcModelOrCase(e.target.value);
                        clearError('pcModelOrCase');
                      }}
                      placeholder="ระบุเคส / รุ่น"
                      className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs ${
                        fieldErrors.pcModelOrCase ? 'border-rose-500 ring-1 ring-rose-500' : 'border-indigo-300'
                      }`}
                      required
                    />
                    {fieldErrors.pcModelOrCase && (
                      <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.pcModelOrCase}</p>
                    )}
                  </div>
                  <div data-has-error={Boolean(fieldErrors.pcProcessor)}>
                    <label className="block text-slate-700 font-semibold mb-1">หน่วยประมวลผล (CPU) *</label>
                    <input
                      type="text"
                      name="pc-cpu-no-autofill"
                      autoComplete="off"
                      value={pcProcessor}
                      onChange={(e) => {
                        setPcProcessor(e.target.value);
                        clearError('pcProcessor');
                      }}
                      placeholder="ระบุรุ่น CPU"
                      className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs ${
                        fieldErrors.pcProcessor ? 'border-rose-500 ring-1 ring-rose-500' : 'border-indigo-300'
                      }`}
                      required
                    />
                    {fieldErrors.pcProcessor && (
                      <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.pcProcessor}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <div data-has-error={Boolean(fieldErrors.pcRam)}>
                    <label className="block text-slate-700 font-semibold mb-1">RAM (GB) *</label>
                    <RamPicker
                      value={pcRam}
                      onChange={(gb) => {
                        setPcRam(gb);
                        if (gb !== null) clearError('pcRam');
                      }}
                      hasError={Boolean(fieldErrors.pcRam)}
                      accent="indigo"
                    />
                    {fieldErrors.pcRam && (
                      <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.pcRam}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ความจุฮาร์ดดิสก์ (SSD)</label>
                    <input
                      type="text"
                      name="pc-storage-no-autofill"
                      autoComplete="off"
                      value={pcStorage}
                      onChange={(e) => setPcStorage(e.target.value)}
                      placeholder="ระบุความจุ SSD/HDD"
                      className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">การ์ดจอแยก (GPU)</label>
                    <input
                      type="text"
                      name="pc-gpu-no-autofill"
                      autoComplete="off"
                      value={pcGpu}
                      onChange={(e) => setPcGpu(e.target.value)}
                      placeholder="ระบุรุ่นการ์ดจอ"
                      className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">จอภาพที่นำมาด้วย (Monitor)</label>
                    <input
                      type="text"
                      name="pc-monitor-no-autofill"
                      autoComplete="off"
                      value={pcMonitor}
                      onChange={(e) => setPcMonitor(e.target.value)}
                      placeholder="ระบุรุ่นจอภาพ (ถ้ามี)"
                      className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">อุปกรณ์ต่อพ่วงที่ส่งมอบด้วย</label>
                  <input
                    type="text"
                    name="pc-acc-no-autofill"
                    autoComplete="off"
                    value={pcAccessories}
                    onChange={(e) => setPcAccessories(e.target.value)}
                    placeholder="ระบุอุปกรณ์ที่นำมาด้วย (คั่นด้วยจุลภาค)"
                    className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}

            {/* 3. PRINTER CUSTOM FIELDS */}
            {category === 'printer' && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <div data-has-error={Boolean(fieldErrors.prBrand)}>
                    <label className="block text-slate-700 font-semibold mb-1">ยี่ห้อปริ้นเตอร์ (Brand) *</label>
                    <select
                      autoComplete="off"
                      value={prBrand}
                      onChange={(e) => {
                        setPrBrand(e.target.value);
                        clearError('prBrand');
                      }}
                      className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs ${
                        fieldErrors.prBrand ? 'border-rose-500 ring-1 ring-rose-500' : 'border-emerald-300'
                      }`}
                      required
                    >
                      <option value="">-- เลือก --</option>
                      {COMMON_PRINTER_BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {fieldErrors.prBrand && (
                      <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.prBrand}</p>
                    )}
                  </div>
                  <div data-has-error={Boolean(fieldErrors.prModel)}>
                    <label className="block text-slate-700 font-semibold mb-1">รุ่นเครื่องพิมพ์ (Model) *</label>
                    <input
                      type="text"
                      name="pr-model-no-autofill"
                      autoComplete="off"
                      value={prModel}
                      onChange={(e) => {
                        setPrModel(e.target.value);
                        clearError('prModel');
                      }}
                      placeholder="กรอกรุ่นเครื่องพิมพ์"
                      className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                        fieldErrors.prModel ? 'border-rose-500 ring-1 ring-rose-500' : 'border-emerald-300'
                      }`}
                      required
                    />
                    {fieldErrors.prModel && (
                      <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.prModel}</p>
                    )}
                  </div>
                  <div data-has-error={Boolean(fieldErrors.prSerial)}>
                    <label className="block text-slate-700 font-semibold mb-1">หมายเลขเครื่อง (S/N) *</label>
                    <input
                      type="text"
                      name="pr-serial-no-autofill"
                      autoComplete="off"
                      value={prSerial}
                      onChange={(e) => handleSerialInputChange(e.target.value, setPrSerial, 'prSerial', false)}
                      onBlur={(e) => runSerialCheckNow(e.target.value, false)}
                      placeholder="กรอกหมายเลข S/N"
                      className={`w-full font-mono uppercase font-bold bg-white border rounded-lg px-2.5 py-1.5 text-xs text-emerald-950 ${
                        fieldErrors.prSerial ? 'border-rose-500 ring-1 ring-rose-500' : 'border-emerald-300'
                      }`}
                      required
                    />
                    {fieldErrors.prSerial && (
                      <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.prSerial}</p>
                    )}
                    {category === 'printer' && renderSerialCheckAlerts()}
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ระบบน้ำหมึก (Ink System)</label>
                    <select
                      autoComplete="off"
                      value={prInkSystem}
                      onChange={(e) => setPrInkSystem(e.target.value as any)}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1.5 text-xs"
                    >
                      <option value="">-- เลือก --</option>
                      <option value="genuine_tank">ระบบแท็งก์แท้ศูนย์ (EcoTank/MegaTank)</option>
                      <option value="cartridge">ตลับหมึกแท้ (Cartridge)</option>
                      <option value="mod_tank">แท็งก์ดัดแปลงภายนอก (Mod Tank)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ประเภทเครื่องพิมพ์</label>
                    <select
                      autoComplete="off"
                      value={prType}
                      onChange={(e) => setPrType(e.target.value as any)}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1.5 text-xs"
                    >
                      <option value="">-- เลือก --</option>
                      <option value="ink_tank">Ink Tank (อิงค์แท็งก์)</option>
                      <option value="laser">Laser (เลเซอร์)</option>
                      <option value="all_in_one">All-in-One มัลติฟังก์ชัน</option>
                      <option value="dot_matrix">หัวเข็ม / Dot Matrix</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">สภาพหัวพิมพ์ (Print Head Test)</label>
                    <select
                      autoComplete="off"
                      value={prHeadCondition}
                      onChange={(e) => setPrHeadCondition(e.target.value as any)}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1.5 text-xs font-semibold"
                    >
                      <option value="">-- เลือก --</option>
                      <option value="normal">หัวพิมพ์ออกครบ 100% สภาพสมบูรณ์</option>
                      <option value="need_clean">มีเส้นบางสี ต้องทำความสะอาดหัวพิมพ์</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-2 sm:pt-4">
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
                      <span className="text-slate-800 font-medium">มีสายต่อ USB</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PHONE / TABLET CUSTOM FIELDS */}
            {category === 'phone' && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div data-has-error={Boolean(fieldErrors.phoneBrand)}>
                  <label className="block text-slate-700 font-semibold mb-1">ยี่ห้อโทรศัพท์ / แท็บเล็ต *</label>
                  <input
                    type="text"
                    name="phone-brand-no-autofill"
                    autoComplete="off"
                    value={phoneBrand}
                    onChange={(e) => {
                      setPhoneBrand(e.target.value);
                      clearError('phoneBrand');
                    }}
                    placeholder="กรอกยี่ห้อ"
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs ${
                      fieldErrors.phoneBrand ? 'border-rose-500 ring-1 ring-rose-500' : 'border-blue-300'
                    }`}
                    required
                  />
                  {fieldErrors.phoneBrand && (
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.phoneBrand}</p>
                  )}
                </div>
                <div data-has-error={Boolean(fieldErrors.phoneModel)}>
                  <label className="block text-slate-700 font-semibold mb-1">รุ่นสินค้า *</label>
                  <input
                    type="text"
                    name="phone-model-no-autofill"
                    autoComplete="off"
                    value={phoneModel}
                    onChange={(e) => {
                      setPhoneModel(e.target.value);
                      clearError('phoneModel');
                    }}
                    placeholder="กรอกรุ่นสินค้า"
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                      fieldErrors.phoneModel ? 'border-rose-500 ring-1 ring-rose-500' : 'border-blue-300'
                    }`}
                    required
                  />
                  {fieldErrors.phoneModel && (
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.phoneModel}</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ความจุ</label>
                  <select
                    autoComplete="off"
                    value={phoneStorage}
                    onChange={(e) => setPhoneStorage(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="">-- เลือก --</option>
                    <option value="64GB">64GB</option>
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB</option>
                  </select>
                </div>
                <div data-has-error={Boolean(fieldErrors.phoneImei)}>
                  <label className="block text-slate-700 font-semibold mb-1">หมายเลข IMEI / S/N *</label>
                  <input
                    type="text"
                    name="phone-imei-no-autofill"
                    autoComplete="off"
                    maxLength={20}
                    value={phoneImei}
                    onChange={(e) => handleSerialInputChange(e.target.value, setPhoneImei, 'phoneImei', true)}
                    onBlur={(e) => runSerialCheckNow(e.target.value, true)}
                    placeholder="กรอก IMEI หรือ S/N"
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs font-mono ${
                      fieldErrors.phoneImei ? 'border-rose-500 ring-1 ring-rose-500' : 'border-blue-300'
                    }`}
                    required
                  />
                  {fieldErrors.phoneImei && (
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.phoneImei}</p>
                  )}
                  {category === 'phone' && renderSerialCheckAlerts()}
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">สถานะ iCloud / บัญชี</label>
                  <select
                    autoComplete="off"
                    value={phoneIcloudStatus}
                    onChange={(e) => setPhoneIcloudStatus(e.target.value as any)}
                    className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1.5 text-xs font-semibold"
                  >
                    <option value="">-- เลือก --</option>
                    <option value="signed_out">ออกจากระบบเรียบร้อย (Sign out)</option>
                    <option value="unlocked">ปลดล็อคแล้ว</option>
                    <option value="locked">ติดล็อค (ต้องแจ้งรหัส)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">อุปกรณ์ที่นำมาด้วย</label>
                  <input
                    type="text"
                    name="phone-acc-no-autofill"
                    autoComplete="off"
                    value={phoneAccessories}
                    onChange={(e) => setPhoneAccessories(e.target.value)}
                    placeholder="เช่น กล่อง, สายชาร์จ (ถ้ามี)"
                    className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}

            {/* 5. GADGET / IT PARTS */}
            {category === 'gadget_it' && (
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div data-has-error={Boolean(fieldErrors.gtType)}>
                  <label className="block text-slate-700 font-semibold mb-1">ประเภทอุปกรณ์ *</label>
                  <select
                    autoComplete="off"
                    value={gtType}
                    onChange={(e) => {
                      setGtType(e.target.value as any);
                      clearError('gtType');
                    }}
                    className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs ${
                      fieldErrors.gtType ? 'border-rose-500 ring-1 ring-rose-500' : 'border-purple-300'
                    }`}
                    required
                  >
                    <option value="">-- เลือก --</option>
                    <option value="monitor">จอคอมพิวเตอร์ / Monitor</option>
                    <option value="gpu_part">การ์ดจอแยก / GPU</option>
                    <option value="tablet">แท็บเล็ตกราฟิก / iPad</option>
                    <option value="console">เครื่องเล่นเกม Console</option>
                    <option value="camera">กล้องดิจิทัล / อุปกรณ์ไลฟ์</option>
                    <option value="other">อุปกรณ์ไอทีอื่นๆ</option>
                  </select>
                  {fieldErrors.gtType && (
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.gtType}</p>
                  )}
                </div>
                <div data-has-error={Boolean(fieldErrors.gtBrand)}>
                  <label className="block text-slate-700 font-semibold mb-1">ยี่ห้อ / แบรนด์ *</label>
                  <input
                    type="text"
                    name="gt-brand-no-autofill"
                    autoComplete="off"
                    value={gtBrand}
                    onChange={(e) => {
                      setGtBrand(e.target.value);
                      clearError('gtBrand');
                    }}
                    placeholder="กรอกยี่ห้อ"
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs ${
                      fieldErrors.gtBrand ? 'border-rose-500 ring-1 ring-rose-500' : 'border-purple-300'
                    }`}
                    required
                  />
                  {fieldErrors.gtBrand && (
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.gtBrand}</p>
                  )}
                </div>
                <div data-has-error={Boolean(fieldErrors.gtModel)}>
                  <label className="block text-slate-700 font-semibold mb-1">รุ่นสินค้า (Model) *</label>
                  <input
                    type="text"
                    name="gt-model-no-autofill"
                    autoComplete="off"
                    value={gtModel}
                    onChange={(e) => {
                      setGtModel(e.target.value);
                      clearError('gtModel');
                    }}
                    placeholder="กรอกรุ่นสินค้า"
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs ${
                      fieldErrors.gtModel ? 'border-rose-500 ring-1 ring-rose-500' : 'border-purple-300'
                    }`}
                    required
                  />
                  {fieldErrors.gtModel && (
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.gtModel}</p>
                  )}
                </div>
                <div data-has-error={Boolean(fieldErrors.gtSerial)}>
                  <label className="block text-slate-700 font-semibold mb-1">หมายเลขเครื่อง (S/N) *</label>
                  <input
                    type="text"
                    name="gt-serial-no-autofill"
                    autoComplete="off"
                    value={gtSerial}
                    onChange={(e) => handleSerialInputChange(e.target.value, setGtSerial, 'gtSerial', false)}
                    onBlur={(e) => runSerialCheckNow(e.target.value, false)}
                    placeholder="กรอกหมายเลข S/N"
                    className={`w-full font-mono uppercase font-bold bg-white border rounded-lg px-2.5 py-1.5 text-xs ${
                      fieldErrors.gtSerial ? 'border-rose-500 ring-1 ring-rose-500' : 'border-purple-300'
                    }`}
                    required
                  />
                  {fieldErrors.gtSerial && (
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.gtSerial}</p>
                  )}
                  {category === 'gadget_it' && renderSerialCheckAlerts()}
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-slate-700 font-semibold mb-1">สรุปรายละเอียดสเปก</label>
                  <input
                    type="text"
                    name="gt-specs-no-autofill"
                    autoComplete="off"
                    value={gtSpecs}
                    onChange={(e) => setGtSpecs(e.target.value)}
                    placeholder="กรอกรายละเอียดสเปกอุปกรณ์"
                    className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}

            {/* General item title, description, estimated value & storage location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div data-has-error={Boolean(fieldErrors.itemName)}>
                <label className="block text-slate-700 font-semibold mb-1">ชื่อรายการทรัพย์สินไอที *</label>
                <input
                  type="text"
                  name="item-name-no-autofill"
                  autoComplete="off"
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                    clearError('itemName');
                  }}
                  placeholder="กรอกชื่อรายการทรัพย์สินสำหรับแสดงในสัญญา"
                  className={`w-full px-2.5 py-1.5 rounded-lg border bg-white font-bold text-slate-900 ${
                    fieldErrors.itemName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'
                  }`}
                  required
                />
                {fieldErrors.itemName && (
                  <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.itemName}</p>
                )}
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">สถานที่จัดเก็บในร้าน</label>
                <input
                  type="text"
                  name="storage-loc-no-autofill"
                  autoComplete="off"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  placeholder="ระบุตู้ / ชั้นวาง / ล็อกเกอร์"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">สภาพเครื่อง / รายละเอียดเพิ่มเติม</label>
                <input
                  type="text"
                  name="item-desc-no-autofill"
                  autoComplete="off"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="ระบุสภาพเครื่อง ตำหนิ หรืออุปกรณ์เสริม"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ราคาประเมินทรัพย์สิน (บาท)</label>
                <input
                  type="number"
                  name="item-est-no-autofill"
                  autoComplete="off"
                  min={0}
                  step={100}
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="กรอกราคาประเมิน (บาท)"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Photo upload */}
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
                        className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 opacity-80 hover:opacity-100 cursor-pointer"
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
              <div data-has-error={Boolean(fieldErrors.loanAmount)}>
                <label className="block text-slate-700 font-semibold mb-1">
                  เงินต้นรับจำนำ / ขายฝาก (บาท) *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-500 font-bold">฿</span>
                  <input
                    type="number"
                    name="loan-amount-no-autofill"
                    autoComplete="off"
                    min={1}
                    step={100}
                    value={loanAmount}
                    onChange={(e) => handleLoanAmountChange(e.target.value)}
                    placeholder="กรอกจำนวนเงินต้น"
                    className={`w-full pl-7 pr-3 py-1.5 text-base font-bold font-mono text-indigo-700 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      fieldErrors.loanAmount ? 'border-rose-500 ring-1 ring-rose-500' : 'border-indigo-300'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.loanAmount && (
                  <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.loanAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  อัตราดอกเบี้ย (% ต่อเดือน)
                </label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="number"
                    autoComplete="off"
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

              <div data-has-error={Boolean(fieldErrors.duration)}>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>ระยะเวลา (เดือน / วัน) *</span>
                  <span className="text-[11px] text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                    {parsedMonths > 0 || parsedDays > 0 ? formatDurationText(parsedMonths, parsedDays) : 'ยังไม่ระบุ'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      name="duration-months-no-autofill"
                      autoComplete="off"
                      min={0}
                      max={36}
                      value={durationMonths}
                      onChange={(e) => handleDurationMonthsChange(e.target.value)}
                      className={`w-full px-2 py-1.5 bg-white border rounded-lg font-mono font-bold text-slate-900 text-xs text-center focus:ring-1 focus:ring-amber-400 focus:outline-none ${
                        fieldErrors.duration ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'
                      }`}
                      placeholder="เดือน"
                    />
                    <span className="text-slate-500 text-xs shrink-0">เดือน</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      name="duration-days-no-autofill"
                      autoComplete="off"
                      min={0}
                      max={31}
                      value={durationDays}
                      onChange={(e) => handleDurationDaysChange(e.target.value)}
                      className={`w-full px-2 py-1.5 bg-white border rounded-lg font-mono font-bold text-slate-900 text-xs text-center focus:ring-1 focus:ring-amber-400 focus:outline-none ${
                        fieldErrors.duration ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'
                      }`}
                      placeholder="วัน"
                    />
                    <span className="text-slate-500 text-xs shrink-0">วัน</span>
                  </div>
                </div>
                {fieldErrors.duration && (
                  <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.duration}</p>
                )}
              </div>
            </div>

            {/* Row 2: Flexible Date Picker Inputs (Start Date & Due Date) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>วันที่เริ่มทำสัญญา (สร้างอัตโนมัติ)</span>
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

              <div data-has-error={Boolean(fieldErrors.dueDate)}>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>วันที่ครบกำหนดไถ่ถอน *</span>
                  <span className="text-[11px] text-rose-600 font-bold">
                    {dueDate ? formatThaiDate(dueDate, false) : 'กรุณาระบุระยะเวลาหรือเลือกวัน'}
                  </span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  min={startDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className={`w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-bold text-rose-700 focus:ring-1 focus:ring-rose-500 focus:outline-none ${
                    fieldErrors.dueDate ? 'border-rose-500 ring-1 ring-rose-500' : 'border-rose-300'
                  }`}
                  required
                />
                {fieldErrors.dueDate && (
                  <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{fieldErrors.dueDate}</p>
                )}
              </div>
            </div>

            {/* Quick Duration Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-500 font-medium">กำหนดด่วน:</span>
              {[
                { label: '15 วัน', m: 0, d: 15 },
                { label: '1 เดือน', m: 1, d: 0 },
                { label: '1 เดือน 15 วัน', m: 1, d: 15 },
                { label: '2 เดือน (มาตรฐาน)', m: 2, d: 0 },
                { label: '3 เดือน', m: 3, d: 0 },
                { label: '4 เดือน', m: 4, d: 0 },
                { label: '6 เดือน', m: 6, d: 0 },
              ].map((preset) => {
                const isSelected = durationMonths !== '' && parsedMonths === preset.m && parsedDays === preset.d;
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

            {/* Optional Note */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">หมายเหตุสัญญา (ถ้ามี)</label>
              <input
                type="text"
                name="contract-note-no-autofill"
                autoComplete="off"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
              />
            </div>

            {/* Interest Calculation Strip */}
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row justify-between items-center gap-1.5 text-xs">
              <div className="text-emerald-900">
                <span>ดอกเบี้ยตลอดสัญญา ({formatDurationText(parsedMonths, parsedDays)}): </span>
                <strong className="font-mono text-sm text-emerald-800">
                  ฿{totalInterest.toLocaleString()} บาท
                </strong>
                <span className="text-[11px] text-emerald-700 ml-1.5">
                  (เดือนละ ฿{monthlyInterest.toLocaleString()} {parsedDays > 0 ? `• เฉลี่ยวันละ ~฿${dailyInterest.toLocaleString()}` : ''})
                </span>
              </div>
              <div className="text-slate-600 font-mono text-[11px]">
                ครบกำหนดไถ่ถอน: <strong className="text-slate-900">{dueDate ? formatThaiDate(dueDate, true) : '-'}</strong>
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                resetFullContractForm();
                onClose();
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaveLockedBySerial}
              className={`px-5 py-2 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-transform ${
                isSaveLockedBySerial
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95 cursor-pointer'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                {hasSerialBlock && !isBlockOverridden
                  ? 'ถูกล็อก: พบเลขเครื่องติด Block'
                  : hasSerialWarn && !warnAcknowledged
                  ? 'กรุณาติ๊ก "ได้ตรวจสอบแล้ว" ก่อนบันทึก'
                  : 'บันทึกเปิดสัญญาขายฝากไอที'}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
