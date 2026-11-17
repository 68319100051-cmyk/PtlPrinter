import { PawnContract, Customer, ShopSettings, UserAccount } from '../types/pawn';
import { SecondhandBuyIn } from '../types/buyIn';

const STORAGE_KEYS = {
  CONTRACTS: 'anchan_pawn_it_contracts_v3',
  ARCHIVED_CONTRACTS: 'anchan_pawn_it_archived_contracts_v3',
  CUSTOMERS: 'anchan_pawn_customers_v2',
  SETTINGS: 'anchan_pawn_settings_v3',
  USERS: 'anchan_pawn_users_v2',
  CURRENT_USER: 'anchan_pawn_current_user_v2',
  SECONDHAND: 'anchan_secondhand_buyin_v1',
};

/**
 * ปิดการโหลดข้อมูลตัวอย่าง (seed data) อัตโนมัติในโหมด production
 * เพื่อไม่ให้ข้อมูลตัวอย่าง (เช่น Asus ROG Strix G16) ปะปนเข้าสู่ฐานข้อมูลจริงของร้าน
 */
export const ENABLE_SAMPLE_DATA_SEED: boolean =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.PROD
    ? import.meta.env.VITE_ENABLE_SAMPLE_SEED === 'true'
    : true;

export const DEFAULT_USERS: UserAccount[] = [
  { id: 'u-1', name: 'คุณชัยกร (เจ้าของร้าน / ผู้ดูแลระบบ)', role: 'admin', pin: '1234' },
  { id: 'u-2', name: 'ช่างเอก (หัวหน้าช่างคอมพิวเตอร์ / ผู้จัดการ)', role: 'manager', pin: '8888' },
  { id: 'u-3', name: 'ช่างวิทย์ (ช่างปริ้นเตอร์และระบบหมึก / แคชเชียร์ 1)', role: 'staff', pin: '0000' },
  { id: 'u-4', name: 'ช่างต้น (ช่างเทคนิคไอที / แคชเชียร์ 2)', role: 'staff', pin: '1111' },
];

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์ & รับจำนำขายฝากไอที',
  branchName: 'สำนักงานใหญ่ (สาขาถนนพัฒนา)',
  taxId: '0935562018892',
  phone: '083-426-8058',
  email: 'poi1800@gmail.com',
  address: '553/7 ถ.พัฒนา ต.คูหาสวรรค์ อ.เมือง จ.พัทลุง 93000',
  lineId: 'poi1800',
  facebook: 'facebook.com/phatthalungprinter',
  promptPayId: '0834268058',
  bankName: 'ธนาคารกสิกรไทย สาขาพัทลุง',
  bankAccountNumber: '083-4-26805-8',
  bankAccountName: 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์',
  ownerName: 'คุณชัยกร (Chaiyakorn)',
  logoUrl: '/shop_logo.jpg',
  defaultDurationMonths: 2,
  defaultMonthlyRate: 1.75,
  enableSteppedTiers: true,
  tiers: [
    { minAmount: 1, maxAmount: 10000, monthlyRatePercent: 2.0 },
    { minAmount: 10001, maxAmount: 50000, monthlyRatePercent: 1.75 },
    { minAmount: 50001, maxAmount: 100000, monthlyRatePercent: 1.50 },
    { minAmount: 100001, maxAmount: 999999999, monthlyRatePercent: 1.25 },
  ],
  lateFeePerDay: 50,
  gracePeriodDays: 15,
  termsAndConditions: '1. ผู้ขายฝากมีสิทธิไถ่ถอนเครื่องคอมพิวเตอร์ โน็ตบุ้ค เครื่องพิมพ์ และอุปกรณ์ไอทีภายในกำหนดเวลาตามสัญญานี้\n2. อุปกรณ์ไอทีต้องได้รับการตรวจเช็คสภาพ ไม่มีรอยงัดแงะ และปลดล็อคบัญชี iCloud/Google/BIOS เรียบร้อยแล้ว\n3. กรณีพ้นกำหนดเวลาและระยะผ่อนผัน 15 วัน ทรัพย์สินจะตกเป็นกรรมสิทธิ์ของผู้รับซื้อฝากทันทีตามกฎหมาย\n4. การต่อดอกเบี้ยและการไถ่ถอนต้องนำตั๋วสัญญาฉบับจริงพร้อมบัตรประจำตัวประชาชนมาแสดง',
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    citizenId: '1939900234561',
    prefix: 'นาย',
    firstName: 'กฤษณะ',
    lastName: 'พงษ์ไพศาล',
    phone: '0819876543',
    lineId: 'kritsana_ptl',
    address: '55/12 ถนนราเมศวร์ ตำบลคูหาสวรรค์ อำเภอเมือง จังหวัดพัทลุง 93000',
    isVip: true,
    note: 'ลูกค้าประจำเมืองพัทลุง นำคอมพิวเตอร์และโน็ตบุ้คมาอัปเกรดและหมุนเวียนสม่ำเสมอ ประวัติดีเยี่ยม',
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'cust-2',
    citizenId: '0933556001234',
    prefix: 'นางสาว',
    firstName: 'พรทิพย์',
    lastName: 'สุขสมบูรณ์ (หจก. พัทลุงก่อสร้าง)',
    phone: '0845551122',
    lineId: 'pornthip_ptl',
    address: '124/8 หมู่ 2 ตำบลควนมะพร้าว อำเภอเมือง จังหวัดพัทลุง 93000',
    isVip: false,
    note: 'สำนักงานก่อสร้าง นำเครื่องพิมพ์แปลนและคอมพิวเตอร์สำนักงานมาดูแลรักษา',
    createdAt: '2026-03-15T11:30:00.000Z',
  },
  {
    id: 'cust-3',
    citizenId: '3930100456782',
    prefix: 'นาย',
    firstName: 'ธีระพล',
    lastName: 'พรหมเกิด (เทศบาลตำบลเมืองพัทลุง)',
    phone: '0834268058',
    lineId: 'ptl_mun',
    address: 'ถนนพัทลุง ตำบลคูหาสวรรค์ อำเภอเมือง จังหวัดพัทลุง 93000',
    isVip: true,
    note: 'หน่วยงานราชการ/กองช่าง เทศบาลเมืองพัทลุง',
    createdAt: '2026-05-20T14:15:00.000Z',
  },
  {
    id: 'cust-4',
    citizenId: '1930200876541',
    prefix: 'นาย',
    firstName: 'ธนภัทร',
    lastName: 'ธรรมศักดิ์',
    phone: '0923456712',
    address: '88/4 ถนนพัฒนา ตำบลคูหาสวรรค์ อำเภอเมือง จังหวัดพัทลุง 93000',
    isVip: false,
    note: 'เกมเมอร์และสายงานกราฟิกดีไซน์ ชอบนำสินค้าไอทีระดับท็อปมาฝากหมุนเวียน',
    createdAt: '2026-06-18T09:20:00.000Z',
  },
  {
    id: 'cust-5',
    citizenId: '0938800112233',
    prefix: 'อาจารย์',
    firstName: 'สมบูรณ์',
    lastName: 'ประสิทธิผล (โรงเรียนพัทลุง)',
    phone: '074613025',
    lineId: 'ptl_school',
    address: 'ถนนราเมศวร์ ตำบลคูหาสวรรค์ อำเภอเมือง จังหวัดพัทลุง 93000',
    isVip: true,
    note: 'กลุ่มสาระการเรียนรู้วิทยาการคำนวณ โรงเรียนประจำจังหวัดพัทลุง',
    createdAt: '2026-07-02T16:00:00.000Z',
  },
];

// Reference date: November 2026 (Purely Computer, IT, Notebook, Printer & Mobile!)
export const INITIAL_CONTRACTS: PawnContract[] = [
  {
    id: 'c-1001',
    contractNumber: 'AC-6911001',
    customerId: 'cust-4',
    customerSnapshot: INITIAL_CUSTOMERS[3],
    item: {
      id: 'item-1',
      category: 'notebook',
      name: 'Asus ROG Strix G16 (2024) Core i7-13650HX / RTX 4060',
      description: 'โน็ตบุ้คเกมมิ่งระดับสูง สภาพ 99% ไร้รอย แรม 16GB DDR5 SSD 1TB จอ 16 นิ้ว 165Hz ROG Nebula ครบกล่องสายชาร์จแท้ 280W',
      estimatedValue: 45000,
      photos: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80'],
      notebook: {
        brand: 'Asus',
        model: 'ROG Strix G16 G614JV',
        serialNumber: 'R90Z8912A004',
        processor: 'Intel Core i7-13650HX (14 Cores / 20 Threads)',
        ramGb: 16,
        storage: 'SSD 1TB M.2 NVMe PCIe 4.0',
        gpu: 'NVIDIA GeForce RTX 4060 (8GB GDDR6)',
        screenSize: '16.0" FHD+ (1920x1200) 165Hz IPS',
        batteryHealth: 'เก็บไฟดีมาก (> 3 ชม.)',
        hasCharger: true,
        hasBag: true,
        icloudStatus: 'unlocked',
      },
    },
    loanAmount: 32000,
    monthlyInterestRate: 1.75,
    isTieredRate: true,
    startDate: '2026-10-15',
    durationMonths: 2,
    dueDate: '2026-12-15',
    status: 'active',
    isLocked: true,
    storageLocation: 'ตู้ล็อกเกอร์ไอที ชั้น 2 ล็อกเกอร์ A-01 พัทลุง',
    interestPayments: [],
    amendmentLogs: [],
    createdAt: '2026-10-15T10:30:00.000Z',
    createdBy: 'คุณชัยกร (เจ้าของร้าน / ผู้ดูแลระบบ)',
  },
  {
    id: 'c-1002',
    contractNumber: 'AC-6911002',
    customerId: 'cust-1',
    customerSnapshot: INITIAL_CUSTOMERS[0],
    item: {
      id: 'item-2',
      category: 'phone',
      name: 'iPhone 16 Pro Max 256GB Desert Titanium ศูนย์ไทย',
      description: 'เครื่องศูนย์ไทย สภาพ 99% แบตเตอรี่ 100% ครบกล่อง สายชาร์จ USB-C แท้ ปลดล็อค iCloud เรียบร้อย',
      estimatedValue: 42000,
      photos: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80'],
      phone: {
        brand: 'Apple',
        model: 'iPhone 16 Pro Max',
        storageGb: '256GB',
        imei: '358921098877665',
        serialNumber: 'XJ99M7890KL',
        accessories: ['กล่องบรรจุภัณฑ์', 'สายชาร์จ USB-C แท้', 'หัวชาร์จ 20W แท้'],
        icloudStatus: 'signed_out',
        passcode: 'ปลดล็อคแล้ว',
      },
    },
    loanAmount: 28000,
    monthlyInterestRate: 1.75,
    isTieredRate: true,
    startDate: '2026-09-04',
    durationMonths: 2,
    dueDate: '2026-11-04', // Due soon!
    status: 'due_soon',
    isLocked: true,
    storageLocation: 'ตู้ไอที ชั้น 2 ล็อกเกอร์ 14 พัทลุง',
    interestPayments: [],
    amendmentLogs: [],
    createdAt: '2026-09-04T13:40:00.000Z',
    createdBy: 'ช่างวิทย์ (ช่างปริ้นเตอร์และระบบหมึก / แคชเชียร์ 1)',
  },
  {
    id: 'c-1003',
    contractNumber: 'AC-6911003',
    customerId: 'cust-4',
    customerSnapshot: INITIAL_CUSTOMERS[3],
    item: {
      id: 'item-3',
      category: 'computer',
      name: 'ชุดคอมพิวเตอร์เกมมิ่ง Core i5-13400F / RTX 3060 12GB + จอ 24" 165Hz',
      description: 'เคสกระจก NZXT พัดลม ARGB สภาพใหม่มาก แรม 32GB DDR4 BUS 3200 SSD 1TB พร้อมจอ AOC 24" 165Hz เมาส์ คีย์บอร์ด ครบชุดพร้อมเล่น',
      estimatedValue: 28000,
      photos: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80'],
      computer: {
        brandOrCustom: 'ประกอบคัสตอม (Custom Gaming PC)',
        modelOrCase: 'Case NZXT H5 Flow RGB สีดำ',
        processor: 'Intel Core i5-13400F (10 Cores / 16 Threads)',
        ramGb: 32,
        storage: 'SSD 1TB M.2 NVMe PCIe 4.0',
        gpu: 'NVIDIA GeForce RTX 3060 (12GB GDDR6)',
        powerSupply: 'Corsair 650W 80+ Bronze',
        monitor: 'AOC 24G2SP 23.8" IPS 165Hz',
        accessories: ['จอภาพ 24 นิ้ว', 'สายไฟ AC x2', 'สาย HDMI', 'คีย์บอร์ดเรืองแสง', 'เมาส์เกมมิ่ง'],
      },
    },
    loanAmount: 18500,
    monthlyInterestRate: 1.75,
    isTieredRate: true,
    startDate: '2026-08-25',
    durationMonths: 2,
    dueDate: '2026-10-25', // Overdue
    status: 'overdue',
    isLocked: true,
    storageLocation: 'ชั้นวางคอมพิวเตอร์เซิร์ฟเวอร์ โซน B03 พัทลุง',
    interestPayments: [],
    amendmentLogs: [],
    createdAt: '2026-08-25T11:00:00.000Z',
    createdBy: 'ช่างเอก (หัวหน้าช่างคอมพิวเตอร์ / ผู้จัดการ)',
  },
  {
    id: 'c-1004',
    contractNumber: 'AC-6911004',
    customerId: 'cust-2',
    customerSnapshot: INITIAL_CUSTOMERS[1],
    item: {
      id: 'item-4',
      category: 'printer',
      name: 'เครื่องพิมพ์มัลติฟังก์ชัน Epson EcoTank L3250 Wi-Fi All-in-One',
      description: 'ปริ้นเตอร์ระบบแท็งก์แท้ศูนย์ พิมพ์ สแกน ถ่ายเอกสาร เชื่อมต่อ Wi-Fi สภาพ 95% หัวพิมพ์สมบูรณ์ 100% หมึกเต็มแท็งก์ พร้อมสายไฟและสายเชื่อมต่อ USB',
      estimatedValue: 5500,
      photos: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80'],
      printer: {
        brand: 'Epson',
        model: 'EcoTank L3250 All-in-One Wi-Fi',
        serialNumber: 'X8TY019942',
        printerType: 'ink_tank',
        inkSystem: 'genuine_tank',
        headCondition: 'normal',
        hasPowerCable: true,
        hasUsbCable: true,
      },
    },
    loanAmount: 3500,
    monthlyInterestRate: 2.0,
    isTieredRate: true,
    startDate: '2026-08-01',
    durationMonths: 2,
    dueDate: '2026-12-01',
    status: 'active',
    isLocked: true,
    storageLocation: 'ชั้นวางสต็อกปริ้นเตอร์ โซน C ล็อกเกอร์ 02 พัทลุง',
    interestPayments: [
      {
        id: 'p-1',
        receiptNumber: 'RC-691001',
        date: '2026-10-01T09:15:00.000Z',
        monthsPaid: 2,
        ratePercent: 2.0,
        interestAmount: 140,
        discountAmount: 0,
        lateFee: 0,
        totalPaid: 140,
        previousDueDate: '2026-10-01',
        newDueDate: '2026-12-01',
        recordedBy: 'คุณชัยกร (เจ้าของร้าน / ผู้ดูแลระบบ)',
        paymentMethod: 'cash',
        note: 'ต่อดอกเบี้ยล่วงหน้า 2 เดือน ตรวจเช็คหัวพิมพ์หมึกเรียบร้อย',
      },
    ],
    amendmentLogs: [],
    createdAt: '2026-08-01T15:20:00.000Z',
    createdBy: 'คุณชัยกร (เจ้าของร้าน / ผู้ดูแลระบบ)',
  },
  {
    id: 'c-1005',
    contractNumber: 'AC-6910008',
    customerId: 'cust-3',
    customerSnapshot: INITIAL_CUSTOMERS[2],
    item: {
      id: 'item-5',
      category: 'notebook',
      name: 'MacBook Air 13.6" M3 (2024) สี Midnight แรม 8GB SSD 256GB',
      description: 'ชิป Apple M3 สภาพสวย 99% แบตเตอรี่ Cycle 25 รอบ อุปกรณ์ครบกล่อง สาย MagSafe 3 แท้ ปลดล็อค Apple ID แล้ว',
      estimatedValue: 34000,
      photos: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'],
      notebook: {
        brand: 'Apple',
        model: 'MacBook Air 13.6" M3 Midnight',
        serialNumber: 'C02J0889PTL',
        processor: 'Apple M3 (8-core CPU / 8-core GPU)',
        ramGb: 8,
        storage: 'SSD 256GB Unified Fast Storage',
        gpu: 'Apple M3 8-Core GPU',
        screenSize: '13.6" Liquid Retina True Tone',
        batteryHealth: 'เก็บไฟดีเยี่ยม 100% (> 10 ชม.)',
        hasCharger: true,
        hasBag: false,
        icloudStatus: 'unlocked',
      },
    },
    loanAmount: 24000,
    monthlyInterestRate: 1.75,
    isTieredRate: true,
    startDate: '2026-07-10',
    durationMonths: 2,
    dueDate: '2026-09-10',
    status: 'redeemed',
    isLocked: true,
    storageLocation: 'ตู้ไอที ชั้น 2 (ส่งมอบเครื่องคืนลูกค้าแล้ว)',
    interestPayments: [],
    redemption: {
      redeemDate: '2026-09-08T11:45:00.000Z',
      receiptNumber: 'RD-690908',
      principalPaid: 24000,
      interestPaid: 840,
      discountAmount: 40,
      extraFee: 0,
      totalPaid: 24800,
      recordedBy: 'ช่างเอก (หัวหน้าช่างคอมพิวเตอร์ / ผู้จัดการ)',
      paymentMethod: 'transfer',
    },
    amendmentLogs: [],
    createdAt: '2026-07-10T11:00:00.000Z',
    createdBy: 'ช่างเอก (หัวหน้าช่างคอมพิวเตอร์ / ผู้จัดการ)',
  },
  {
    id: 'c-1006',
    contractNumber: 'AC-6911005',
    customerId: 'cust-5',
    customerSnapshot: INITIAL_CUSTOMERS[4],
    item: {
      id: 'item-6',
      category: 'printer',
      name: 'เครื่องพิมพ์ Canon PIXMA G3010 Wi-Fi All-in-One Ink Tank',
      description: 'เครื่องพิมพ์มัลติฟังก์ชันระบบแท็งก์แท้ สภาพ 95% พิมพ์/สแกน/ก็อปปี้ ผ่าน Wi-Fi และคอมพิวเตอร์',
      estimatedValue: 4500,
      photos: ['https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=600&q=80'],
      printer: {
        brand: 'Canon',
        model: 'PIXMA G3010 Wi-Fi',
        serialNumber: 'KMYG781923',
        printerType: 'ink_tank',
        inkSystem: 'genuine_tank',
        headCondition: 'normal',
        hasPowerCable: true,
        hasUsbCable: true,
      },
    },
    loanAmount: 2800,
    monthlyInterestRate: 2.0,
    isTieredRate: true,
    startDate: '2026-10-20',
    durationMonths: 2,
    dueDate: '2026-12-20',
    status: 'active',
    isLocked: true,
    storageLocation: 'ชั้นวางสต็อกปริ้นเตอร์ โซน C ล็อกเกอร์ 04 พัทลุง',
    interestPayments: [],
    amendmentLogs: [],
    createdAt: '2026-10-20T14:10:00.000Z',
    createdBy: 'คุณชัยกร (เจ้าของร้าน / ผู้ดูแลระบบ)',
  },
];

/**
 * Storage helpers
 */
export function getContracts(): PawnContract[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTRACTS);
    if (!raw) {
      if (!ENABLE_SAMPLE_DATA_SEED) return [];
      saveContracts(INITIAL_CONTRACTS);
      return INITIAL_CONTRACTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading contracts from storage', err);
    return ENABLE_SAMPLE_DATA_SEED ? INITIAL_CONTRACTS : [];
  }
}

export function saveContracts(contracts: PawnContract[]): void {
  localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(contracts));
}

export function getArchivedContracts(): PawnContract[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ARCHIVED_CONTRACTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveArchivedContracts(archived: PawnContract[]): void {
  localStorage.setItem(STORAGE_KEYS.ARCHIVED_CONTRACTS, JSON.stringify(archived));
}

export function getCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) {
      if (!ENABLE_SAMPLE_DATA_SEED) return [];
      saveCustomers(INITIAL_CUSTOMERS);
      return INITIAL_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch {
    return ENABLE_SAMPLE_DATA_SEED ? INITIAL_CUSTOMERS : [];
  }
}

export function saveCustomers(customers: Customer[]): void {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
}

export function getSettings(): ShopSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.logoUrl || parsed.logoUrl === '/src/assets/shop_logo.jpg') {
      parsed.logoUrl = '/shop_logo.jpg';
    }
    return { ...DEFAULT_SETTINGS, ...parsed, logoUrl: parsed.logoUrl || '/shop_logo.jpg' };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ShopSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      saveUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: UserAccount[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getCurrentUser(): UserAccount {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return DEFAULT_USERS[0];
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS[0];
  }
}

export function setCurrentUser(user: UserAccount): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

/**
 * Generate Next Contract Number (e.g. AC-6911005)
 */
export function generateNextContractNumber(existingContracts: PawnContract[]): string {
  const now = new Date();
  const thaiYear = String(now.getFullYear() + 543).slice(-2);
  const thaiMonth = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `AC-${thaiYear}${thaiMonth}`;
  
  const currentMonthContracts = existingContracts.filter(c => c.contractNumber.startsWith(prefix));
  const maxSeq = currentMonthContracts.reduce((max, c) => {
    const seq = parseInt(c.contractNumber.slice(prefix.length), 10);
    return !isNaN(seq) && seq > max ? seq : max;
  }, 0);

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

export const INITIAL_SECONDHAND_BUYINS: SecondhandBuyIn[] = [
  {
    id: 'nb-1001',
    buyInNumber: 'NB-6911001',
    date: '2026-10-28T11:20:00.000Z',
    category: 'laptop',
    notebookSpecs: {
      brand: 'Asus',
      model: 'TUF Gaming A15 FA506IC',
      serialNumber: 'M9NRCX01A892147',
      processor: 'AMD Ryzen 7 4800H (8 Cores / 16 Threads)',
      ramGb: 16,
      storage: 'SSD 512GB M.2 NVMe PCIe',
      gpu: 'NVIDIA GeForce RTX 3050 (4GB GDDR6)',
      screenSize: '15.6" FHD (1920x1080) 144Hz IPS',
      batteryStatus: 'good',
      cosmeticGrade: 'A',
      hasCharger: true,
      hasBox: true,
      hasBag: true,
      isICloudOrPasscodeCleared: true,
      checklist: {
        keyboard: true,
        screen: true,
        touchpad: true,
        wifiBluetooth: true,
        webcamMic: true,
        speakers: true,
        usbPorts: true,
        chargingPort: true,
      },
      defectsNotes: 'สภาพสวยงามมาก ไร้รอยตกกระแทก คีย์บอร์ดไฟ RGB ใช้งานได้ปกติทุกปุ่ม',
    },
    sellerSnapshot: {
      id: 'cust-4',
      citizenId: '1930200876541',
      prefix: 'นาย',
      firstName: 'ธนภัทร',
      lastName: 'ธรรมศักดิ์',
      phone: '0923456712',
      address: '88/4 ถนนพัฒนา ตำบลคูหาสวรรค์ อำเภอเมือง จังหวัดพัทลุง 93000',
      createdAt: '2026-06-18T09:20:00.000Z',
    },
    purchasePrice: 12500,
    targetSalePrice: 15900,
    paymentMethod: 'transfer',
    status: 'ready_to_sell',
    photos: [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
    ],
    buyerStaff: 'คุณชัยกร (เจ้าของร้าน / ผู้ดูแลระบบ)',
    notes: 'เครื่องศูนย์ไทย ประกันศูนย์หมดแล้ว เทสผ่าน 100% สภาพพร้อมจำหน่ายหน้าร้าน',
    legalOwnershipDeclaration: true,
    createdAt: '2026-10-28T11:20:00.000Z',
  },
  {
    id: 'nb-1002',
    buyInNumber: 'NB-6911002',
    date: '2026-10-30T14:40:00.000Z',
    category: 'laptop',
    notebookSpecs: {
      brand: 'Lenovo',
      model: 'IdeaPad 3 15ITL6',
      serialNumber: 'PF3N89K20084',
      processor: 'Intel Core i5-1135G7 (4 Cores / 8 Threads)',
      ramGb: 8,
      storage: 'SSD 512GB M.2 NVMe',
      gpu: 'Intel Iris Xe Graphics (Onboard)',
      screenSize: '15.6" FHD Anti-glare',
      batteryStatus: 'fair',
      cosmeticGrade: 'B',
      hasCharger: true,
      hasBox: false,
      hasBag: true,
      isICloudOrPasscodeCleared: true,
      checklist: {
        keyboard: true,
        screen: true,
        touchpad: true,
        wifiBluetooth: true,
        webcamMic: true,
        speakers: true,
        usbPorts: true,
        chargingPort: true,
      },
      defectsNotes: 'มีรอยขนแมวบางๆ ด้านฝาหลัง แบตเตอรี่เก็บไฟได้ประมาณ 1.5 ชม.',
    },
    sellerSnapshot: {
      id: 'cust-1',
      citizenId: '1939900234561',
      prefix: 'นาย',
      firstName: 'กฤษณะ',
      lastName: 'พงษ์ไพศาล',
      phone: '0819876543',
      address: '55/12 ถนนราเมศวร์ ตำบลคูหาสวรรค์ อำเภอเมือง จังหวัดพัทลุง 93000',
      createdAt: '2026-01-10T10:00:00.000Z',
    },
    purchasePrice: 7500,
    targetSalePrice: 9900,
    paymentMethod: 'cash',
    status: 'in_stock',
    photos: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
    ],
    buyerStaff: 'ช่างวิทย์ (ผู้เชี่ยวชาญ / แคชเชียร์ 1)',
    notes: 'ตรวจเช็คเบื้องต้นเรียบร้อย เหมาะสำหรับทำงานเอกสารและเรียนออนไลน์',
    legalOwnershipDeclaration: true,
    createdAt: '2026-10-30T14:40:00.000Z',
  },
  {
    id: 'nb-1003',
    buyInNumber: 'NB-6910005',
    date: '2026-10-18T10:15:00.000Z',
    category: 'laptop',
    notebookSpecs: {
      brand: 'Apple',
      model: 'MacBook Air 13.6" M2 (2022) สี Midnight',
      serialNumber: 'C02JD77NQ05D',
      processor: 'Apple M2 (8-core CPU / 8-core GPU)',
      ramGb: 8,
      storage: 'SSD 256GB Unified Storage',
      gpu: 'Apple M2 8-Core GPU',
      screenSize: '13.6" Liquid Retina Display True Tone',
      batteryStatus: 'good',
      cosmeticGrade: 'A',
      hasCharger: true,
      hasBox: true,
      hasBag: false,
      isICloudOrPasscodeCleared: true,
      checklist: {
        keyboard: true,
        screen: true,
        touchpad: true,
        wifiBluetooth: true,
        webcamMic: true,
        speakers: true,
        usbPorts: true,
        chargingPort: true,
      },
      defectsNotes: 'สุขภาพแบตเตอรี่ 94% Cycle Count 86 รอบ ปลดล็อค iCloud เรียบร้อย',
    },
    sellerSnapshot: {
      id: 'cust-2',
      citizenId: '0933556001234',
      prefix: 'นางสาว',
      firstName: 'พรทิพย์',
      lastName: 'สุขสมบูรณ์ (หจก. พัทลุงก่อสร้าง)',
      phone: '0845551122',
      address: '124/8 หมู่ 2 ตำบลควนมะพร้าว อำเภอเมือง จังหวัดพัทลุง 93000',
      createdAt: '2026-03-15T11:30:00.000Z',
    },
    purchasePrice: 18500,
    targetSalePrice: 23500,
    paymentMethod: 'transfer',
    status: 'sold',
    soldPrice: 22900,
    soldDate: '2026-10-25T16:30:00.000Z',
    soldCustomerName: 'คุณภานุวัฒน์ (ลูกค้าประจำพัทลุง)',
    photos: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    ],
    buyerStaff: 'คุณชัยกร (เจ้าของร้าน / ผู้ดูแลระบบ)',
    notes: 'ขายออกเรียบร้อย รับประกันหลังการขาย 30 วัน',
    legalOwnershipDeclaration: true,
    createdAt: '2026-10-18T10:15:00.000Z',
  },
  {
    id: 'nb-1004',
    buyInNumber: 'NB-6911003',
    date: '2026-11-01T09:30:00.000Z',
    category: 'laptop',
    notebookSpecs: {
      brand: 'Acer',
      model: 'Nitro 5 AN515-58-59JP',
      serialNumber: 'NHQFKST00234188A',
      processor: 'Intel Core i5-12500H (12 Cores / 16 Threads)',
      ramGb: 16,
      storage: 'SSD 512GB M.2 NVMe PCIe 4.0',
      gpu: 'NVIDIA GeForce RTX 3050 Ti (4GB GDDR6)',
      screenSize: '15.6" FHD 144Hz SlimBezel',
      batteryStatus: 'good',
      cosmeticGrade: 'B',
      hasCharger: true,
      hasBox: true,
      hasBag: false,
      isICloudOrPasscodeCleared: true,
      checklist: {
        keyboard: true,
        screen: true,
        touchpad: true,
        wifiBluetooth: true,
        webcamMic: true,
        speakers: true,
        usbPorts: true,
        chargingPort: true,
      },
      defectsNotes: 'มีฝุ่นสะสมตามช่องระบายความร้อน นำส่งช่างแกะเป่าฝุ่นและลง Windows 11 ใหม่',
    },
    sellerSnapshot: {
      id: 'cust-3',
      citizenId: '3930100456782',
      prefix: 'นาย',
      firstName: 'ธีระพล',
      lastName: 'พรหมเกิด (เทศบาลตำบลเมืองพัทลุง)',
      phone: '0834268058',
      address: 'ถนนพัทลุง ตำบลคูหาสวรรค์ อำเภอเมือง จังหวัดพัทลุง 93000',
      createdAt: '2026-05-20T14:15:00.000Z',
    },
    purchasePrice: 13500,
    targetSalePrice: 16900,
    paymentMethod: 'transfer',
    status: 'under_repair',
    photos: [
      'https://images.unsplash.com/photo-1544731612-de7f96afe55f?auto=format&fit=crop&w=600&q=80',
    ],
    buyerStaff: 'ช่างเอก (หัวหน้าช่าง / ผู้จัดการ)',
    notes: 'ส่งช่างเอกเช็คพัดลม ทำความสะอาดซิลิโคน เตรียมตั้งขายหน้าร้าน',
    legalOwnershipDeclaration: true,
    createdAt: '2026-11-01T09:30:00.000Z',
  },
];

export function getSecondhandBuyIns(): SecondhandBuyIn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECONDHAND);
    if (!raw) {
      if (!ENABLE_SAMPLE_DATA_SEED) return [];
      saveSecondhandBuyIns(INITIAL_SECONDHAND_BUYINS);
      return INITIAL_SECONDHAND_BUYINS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading secondhand items from storage', err);
    return ENABLE_SAMPLE_DATA_SEED ? INITIAL_SECONDHAND_BUYINS : [];
  }
}

export function saveSecondhandBuyIns(items: SecondhandBuyIn[]): void {
  localStorage.setItem(STORAGE_KEYS.SECONDHAND, JSON.stringify(items));
}

/**
 * Generate Next Buy-In Number (e.g. NB-6911004)
 */
export function generateNextBuyInNumber(existingItems: SecondhandBuyIn[]): string {
  const now = new Date();
  const thaiYear = String(now.getFullYear() + 543).slice(-2);
  const thaiMonth = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `NB-${thaiYear}${thaiMonth}`;

  const currentMonthItems = existingItems.filter(item => item.buyInNumber.startsWith(prefix));
  const maxSeq = currentMonthItems.reduce((max, item) => {
    const seq = parseInt(item.buyInNumber.slice(prefix.length), 10);
    return !isNaN(seq) && seq > max ? seq : max;
  }, 0);

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

/**
 * Export complete backup database as JSON string
 */
export function exportDatabaseBackup(): string {
  const data = {
    app: 'Anchan Pawn Pro',
    version: '2.1.0',
    owner: 'คุณชัยกร (Chaiyakorn)',
    exportDate: new Date().toISOString(),
    contracts: getContracts(),
    archivedContracts: getArchivedContracts(),
    customers: getCustomers(),
    secondhandBuyIns: getSecondhandBuyIns(),
    settings: getSettings(),
    users: getUsers(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Restore complete database from parsed JSON
 */
export function restoreDatabaseBackup(jsonData: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonData);
    if (!parsed || !Array.isArray(parsed.contracts)) {
      return { success: false, message: 'รูปแบบไฟล์สำรองไม่ถูกต้อง (Missing contracts array)' };
    }
    saveContracts(parsed.contracts);
    if (Array.isArray(parsed.archivedContracts)) {
      saveArchivedContracts(parsed.archivedContracts);
    }
    if (Array.isArray(parsed.customers)) {
      saveCustomers(parsed.customers);
    }
    if (Array.isArray(parsed.secondhandBuyIns)) {
      saveSecondhandBuyIns(parsed.secondhandBuyIns);
    }
    if (parsed.settings) {
      saveSettings(parsed.settings);
    }
    if (Array.isArray(parsed.users)) {
      saveUsers(parsed.users);
    }
    return { success: true, message: 'กู้คืนฐานข้อมูลสำเร็จเรียบร้อย' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `เกิดข้อผิดพลาดในการกู้คืน: ${errorMsg}` };
  }
}

/**
 * Archive closed contracts (redeemed or forfeited) to separate storage to optimize main workstation
 */
export function archiveClosedContracts(): { archivedCount: number } {
  const allContracts = getContracts();
  const activeContracts = allContracts.filter(c => c.status === 'active' || c.status === 'due_soon' || c.status === 'overdue');
  const closedContracts = allContracts.filter(c => c.status === 'redeemed' || c.status === 'forfeited');
  
  if (closedContracts.length === 0) {
    return { archivedCount: 0 };
  }

  const existingArchive = getArchivedContracts();
  const mergedArchive = [...existingArchive, ...closedContracts];
  
  const uniqueArchive = Array.from(new Map(mergedArchive.map(item => [item.id, item])).values());
  
  saveArchivedContracts(uniqueArchive);
  saveContracts(activeContracts);
  
  return { archivedCount: closedContracts.length };
}

/**
 * Reset all data to default initial state
 */
export function resetToSampleData(): void {
  saveContracts(INITIAL_CONTRACTS);
  saveCustomers(INITIAL_CUSTOMERS);
  saveSecondhandBuyIns(INITIAL_SECONDHAND_BUYINS);
  saveSettings(DEFAULT_SETTINGS);
  saveUsers(DEFAULT_USERS);
  saveArchivedContracts([]);
  setCurrentUser(DEFAULT_USERS[0]);
}

/**
 * Helper to escape CSV values and preserve text fields (like Citizen ID and phone) in Excel
 */
function escapeCsvCell(val: any, forceText = false): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).trim();
  if (forceText) {
    // Preserve leading zeros and prevent scientific notation in Excel
    return `="${str.replace(/"/g, '""')}"`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Export contracts to UTF-8 CSV compatible with Microsoft Excel
 */
export function exportContractsToExcelCsv(contractList: PawnContract[]): string {
  const headers = [
    'เลขที่สัญญา',
    'วันที่ทำสัญญา',
    'วันครบกำหนด',
    'สถานะสัญญา',
    'ชื่อผู้ขายฝาก',
    'เบอร์โทรศัพท์',
    'เลขบัตรประชาชน',
    'ที่อยู่ลูกค้า',
    'หมวดหมู่ทรัพย์สิน',
    'ชื่อทรัพย์สิน/รุ่น',
    'ยี่ห้อ',
    'Serial Number/IMEI',
    'ราคาประเมิน (บาท)',
    'เงินต้น (บาท)',
    'อัตราดอกเบี้ยต่อเดือน (%)',
    'ดอกเบี้ยต่องวด (บาท)',
    'ที่เก็บทรัพย์สิน',
    'จำนวนครั้งที่ต่อดอก',
    'ยอดดอกเบี้ยชำระสะสม (บาท)',
    'วันที่ไถ่ถอน/หลุดจำนำ',
    'หมายเหตุ',
  ];

  const statusMap: Record<string, string> = {
    active: 'ปกติ (ยังไม่ครบกำหนด)',
    due_soon: 'ใกล้ครบกำหนด',
    overdue: 'เกินกำหนด (อยู่ในระยะผ่อนผัน)',
    redeemed: 'ไถ่ถอนแล้ว',
    forfeited: 'หลุดจำนำ',
  };

  const rows = contractList.map((c) => {
    const cust = c.customerSnapshot;
    const item = c.item;
    const brand = item.notebook?.brand || item.computer?.brandOrCustom || item.printer?.brand || item.phone?.brand || item.itGadget?.brand || '';
    const serial = item.notebook?.serialNumber || item.printer?.serialNumber || item.phone?.imei || item.itGadget?.serialNumber || '';
    const paymentsCount = c.interestPayments?.length || 0;
    const totalInterestPaid = (c.interestPayments || []).reduce((sum, p) => sum + (p.totalPaid || p.interestAmount || 0), 0);
    const monthlyInterestAmt = Math.round(c.loanAmount * (c.monthlyInterestRate / 100));
    const closeDate = c.redemption?.redeemDate || c.forfeitedDate || '';

    return [
      escapeCsvCell(c.contractNumber, true),
      escapeCsvCell(c.startDate),
      escapeCsvCell(c.dueDate),
      escapeCsvCell(statusMap[c.status] || c.status),
      escapeCsvCell(`${cust.prefix || ''}${cust.firstName} ${cust.lastName}`.trim()),
      escapeCsvCell(cust.phone, true),
      escapeCsvCell(cust.citizenId, true),
      escapeCsvCell(cust.address),
      escapeCsvCell(item.category),
      escapeCsvCell(item.name),
      escapeCsvCell(brand),
      escapeCsvCell(serial, true),
      escapeCsvCell(item.estimatedValue || ''),
      escapeCsvCell(c.loanAmount),
      escapeCsvCell(c.monthlyInterestRate),
      escapeCsvCell(monthlyInterestAmt),
      escapeCsvCell(c.storageLocation || ''),
      escapeCsvCell(paymentsCount),
      escapeCsvCell(totalInterestPaid),
      escapeCsvCell(closeDate),
      escapeCsvCell(c.note || ''),
    ].join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) for native Excel Thai support
  return '\uFEFF' + [headers.map(h => escapeCsvCell(h)).join(','), ...rows].join('\r\n');
}

/**
 * Export customers to UTF-8 CSV compatible with Microsoft Excel
 */
export function exportCustomersToExcelCsv(customerList: Customer[]): string {
  const headers = [
    'รหัสลูกค้า',
    'คำนำหน้า',
    'ชื่อ',
    'นามสกุล',
    'เลขประจำตัวประชาชน',
    'เบอร์โทรศัพท์',
    'Line ID',
    'ที่อยู่',
    'ลูกค้า VIP',
    'หมายเหตุ',
    'วันที่ลงทะเบียน',
  ];

  const rows = customerList.map((cust) => {
    return [
      escapeCsvCell(cust.id, true),
      escapeCsvCell(cust.prefix || ''),
      escapeCsvCell(cust.firstName),
      escapeCsvCell(cust.lastName),
      escapeCsvCell(cust.citizenId, true),
      escapeCsvCell(cust.phone, true),
      escapeCsvCell(cust.lineId || '', true),
      escapeCsvCell(cust.address),
      escapeCsvCell(cust.isVip ? 'ใช่ (VIP)' : 'ทั่วไป'),
      escapeCsvCell(cust.note || ''),
      escapeCsvCell(cust.createdAt || ''),
    ].join(',');
  });

  return '\uFEFF' + [headers.map(h => escapeCsvCell(h)).join(','), ...rows].join('\r\n');
}

/**
 * Export secondhand buy-in inventory to UTF-8 CSV compatible with Microsoft Excel
 */
export function exportSecondhandToExcelCsv(items: SecondhandBuyIn[]): string {
  const headers = [
    'รหัสรับซื้อ',
    'วันที่รับซื้อ',
    'ประเภทสินค้า',
    'ชื่อสินค้า/รุ่น',
    'ยี่ห้อ',
    'Serial Number',
    'ซีพียู (CPU)',
    'แรม (RAM GB)',
    'ความจุ Storage',
    'การ์ดจอ (GPU)',
    'เกรดสภาพสินค้า',
    'ราคาต้นทุนรับซื้อ (บาท)',
    'ราคาตั้งขายหน้าร้าน (บาท)',
    'สถานะสินค้า',
    'ชื่อผู้ขาย',
    'เบอร์โทรผู้ขาย',
    'หมายเหตุ',
  ];

  const statusMap: Record<string, string> = {
    in_stock: 'อยู่ในคลังสต็อก',
    ready_to_sell: 'พร้อมขายหน้าร้าน',
    sold: 'ขายแล้ว',
    under_repair: 'ส่งช่างตรวจซ่อม',
  };

  const rows = items.map((i) => {
    const specs = i.notebookSpecs;
    return [
      escapeCsvCell(i.buyInNumber, true),
      escapeCsvCell(i.date),
      escapeCsvCell(i.category),
      escapeCsvCell(specs?.model || ''),
      escapeCsvCell(specs?.brand || ''),
      escapeCsvCell(specs?.serialNumber || '', true),
      escapeCsvCell(specs?.processor || ''),
      escapeCsvCell(specs?.ramGb || ''),
      escapeCsvCell(specs?.storage || ''),
      escapeCsvCell(specs?.gpu || ''),
      escapeCsvCell(specs?.cosmeticGrade || ''),
      escapeCsvCell(i.purchasePrice),
      escapeCsvCell(i.targetSalePrice || ''),
      escapeCsvCell(statusMap[i.status] || i.status),
      escapeCsvCell(`${i.sellerSnapshot.prefix || ''}${i.sellerSnapshot.firstName} ${i.sellerSnapshot.lastName}`.trim()),
      escapeCsvCell(i.sellerSnapshot.phone, true),
      escapeCsvCell(i.notes || ''),
    ].join(',');
  });

  return '\uFEFF' + [headers.map(h => escapeCsvCell(h)).join(','), ...rows].join('\r\n');
}

