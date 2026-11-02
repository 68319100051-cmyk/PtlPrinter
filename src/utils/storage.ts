import { PawnContract, Customer, ShopSettings, UserAccount } from '../types/pawn';

const STORAGE_KEYS = {
  CONTRACTS: 'anchan_pawn_contracts_v2',
  ARCHIVED_CONTRACTS: 'anchan_pawn_archived_contracts_v2',
  CUSTOMERS: 'anchan_pawn_customers_v2',
  SETTINGS: 'anchan_pawn_settings_v2',
  USERS: 'anchan_pawn_users_v2',
  CURRENT_USER: 'anchan_pawn_current_user_v2',
};

export const DEFAULT_USERS: UserAccount[] = [
  { id: 'u-1', name: 'คุณชัยกร (เจ้าของร้าน / ผู้ดูแลระบบ)', role: 'admin', pin: '1234' },
  { id: 'u-2', name: 'ช่างเอก (หัวหน้าช่าง / ผู้จัดการ)', role: 'manager', pin: '8888' },
  { id: 'u-3', name: 'ช่างวิทย์ (ผู้เชี่ยวชาญ / แคชเชียร์ 1)', role: 'staff', pin: '0000' },
  { id: 'u-4', name: 'ช่างต้น (ช่างเทคนิค / แคชเชียร์ 2)', role: 'staff', pin: '1111' },
];

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'พัทลุงปริ้นเตอร์ คอมพิวเตอร์ & รับจำนำขายฝาก',
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
  logoUrl: '/src/assets/shop_logo.jpg',
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
  termsAndConditions: '1. ผู้ขายฝากมีสิทธิไถ่ถอนทรัพย์สินภายในกำหนดเวลาตามสัญญานี้\n2. กรณีพ้นกำหนดเวลาและระยะผ่อนผัน 15 วัน ทรัพย์สินจะตกเป็นกรรมสิทธิ์ของผู้รับซื้อฝากทันทีตามกฎหมาย\n3. การต่อดอกเบี้ยและการไถ่ถอนต้องนำตั๋วสัญญาฉบับจริงพร้อมบัตรประจำตัวประชาชนมาแสดง',
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
    note: 'ลูกค้าประจำเมืองพัทลุง ประวัติดีเยี่ยม ชำระดอกเบี้ยตรงเวลาสม่ำเสมอ',
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
    note: 'ธุรกิจรับเหมาก่อสร้างในจังหวัดพัทลุง',
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
    note: 'ชอบนำสินค้าไอทีและอุปกรณ์อิเล็กทรอนิกส์มาฝากหมุนเวียน',
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
    note: 'กลุ่มสาระการเรียนรู้ โรงเรียนประจำจังหวัดพัทลุง',
    createdAt: '2026-07-02T16:00:00.000Z',
  },
];

// Reference date: November 2026
export const INITIAL_CONTRACTS: PawnContract[] = [
  {
    id: 'c-1001',
    contractNumber: 'AC-6911001',
    customerId: 'cust-1',
    customerSnapshot: INITIAL_CUSTOMERS[0],
    item: {
      id: 'item-1',
      category: 'gold',
      name: 'สร้อยคอทองคำ 96.5% ลายสี่เสา ตราฮั่วเซ่งเฮง',
      description: 'สร้อยคอทองคำแท้ 96.5% ลายสี่เสา สภาพ 98% พร้อมตะขอปั๊มตราชัดเจน',
      estimatedValue: 92000,
      photos: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80'],
      gold: {
        goldType: 'necklace',
        goldTypeName: 'สร้อยคอ',
        purity: '96.5%',
        weightBaht: 2,
        weightGram: 30.48,
        condition: 'สภาพสวย ตะขอแน่น ไม่มีรอยบุบหรือขาด',
      },
    },
    loanAmount: 75000,
    monthlyInterestRate: 1.5,
    isTieredRate: true,
    startDate: '2026-10-15',
    durationMonths: 2,
    dueDate: '2026-12-15',
    status: 'active',
    isLocked: true,
    storageLocation: 'ตู้เซฟ A-01 สำนักงานใหญ่ พัทลุง',
    interestPayments: [],
    amendmentLogs: [],
    createdAt: '2026-10-15T10:30:00.000Z',
    createdBy: 'คุณชัยกร (เจ้าของร้าน / ผู้ดูแลระบบ)',
  },
  {
    id: 'c-1002',
    contractNumber: 'AC-6911002',
    customerId: 'cust-4',
    customerSnapshot: INITIAL_CUSTOMERS[3],
    item: {
      id: 'item-2',
      category: 'phone',
      name: 'iPhone 16 Pro Max 256GB Desert Titanium',
      description: 'เครื่องศูนย์ไทย สภาพ 99% แบตเตอรี่ 100% ครบกล่อง สายชาร์จแท้',
      estimatedValue: 42000,
      photos: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80'],
      phone: {
        brand: 'Apple',
        model: 'iPhone 16 Pro Max',
        storageGb: '256GB',
        imei: '358921098877665',
        serialNumber: 'XJ99M7890KL',
        accessories: ['กล่องบรรจุภัณฑ์', 'สายชาร์จ USB-C', 'หัวแปลงแท้'],
        icloudStatus: 'signed_out',
        passcode: 'ปลดล็อคแล้ว',
      },
    },
    loanAmount: 28000,
    monthlyInterestRate: 1.75,
    isTieredRate: true,
    startDate: '2026-09-04',
    durationMonths: 2,
    dueDate: '2026-11-04', // Due in 3 days!
    status: 'due_soon',
    isLocked: true,
    storageLocation: 'ตู้ไอที ชั้น 2 ล็อกเกอร์ 14 พัทลุง',
    interestPayments: [],
    amendmentLogs: [],
    createdAt: '2026-09-04T13:40:00.000Z',
    createdBy: 'ช่างวิทย์ (ผู้เชี่ยวชาญ / แคชเชียร์ 1)',
  },
  {
    id: 'c-1003',
    contractNumber: 'AC-6911003',
    customerId: 'cust-2',
    customerSnapshot: INITIAL_CUSTOMERS[1],
    item: {
      id: 'item-3',
      category: 'gold',
      name: 'สร้อยข้อมือทองคำ 96.5% ลายเบนซ์ น้ำหนัก 1 บาท',
      description: 'สร้อยข้อมือทองคำ 1 บาท ตราเยาวราช ห่วงแข็งแรง',
      estimatedValue: 46000,
      photos: ['https://images.unsplash.com/photo-1611591475152-473523321526?auto=format&fit=crop&w=600&q=80'],
      gold: {
        goldType: 'bracelet',
        goldTypeName: 'สร้อยข้อมือ',
        purity: '96.5%',
        weightBaht: 1,
        weightGram: 15.24,
        condition: 'สภาพดี 95%',
      },
    },
    loanAmount: 35000,
    monthlyInterestRate: 1.75,
    isTieredRate: true,
    startDate: '2026-08-25',
    durationMonths: 2,
    dueDate: '2026-10-25', // Overdue by 7 days!
    status: 'overdue',
    isLocked: true,
    storageLocation: 'ตู้เซฟ A-02 ลิ้นชัก 3 พัทลุง',
    interestPayments: [],
    amendmentLogs: [],
    createdAt: '2026-08-25T11:00:00.000Z',
    createdBy: 'ช่างเอก (หัวหน้าช่าง / ผู้จัดการ)',
  },
  {
    id: 'c-1004',
    contractNumber: 'AC-6911004',
    customerId: 'cust-1',
    customerSnapshot: INITIAL_CUSTOMERS[0],
    item: {
      id: 'item-4',
      category: 'vehicle',
      name: 'รถจักรยานยนต์ Honda Wave 125i สีแดง-ดำ ทะเบียนพัทลุง',
      description: 'เล่มทะเบียนแท้พร้อมโอน กุญแจ 2 ดอก ไมล์ 12,000 กม.',
      estimatedValue: 35000,
      photos: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80'],
      vehicle: {
        vehicleType: 'motorcycle',
        licensePlate: '1กข-9993',
        province: 'พัทลุง',
        brand: 'Honda',
        model: 'Wave 125i',
        year: '2024',
        chassisNumber: 'MLHJF4890NK12345',
        hasBook: true,
        taxExpiryDate: '2027-04-12',
      },
    },
    loanAmount: 22000,
    monthlyInterestRate: 1.75,
    isTieredRate: true,
    startDate: '2026-08-01',
    durationMonths: 2,
    dueDate: '2026-12-01',
    status: 'active',
    isLocked: true,
    storageLocation: 'ลานจอดโกดังยานพาหนะ พัทลุง ล็อก 04',
    interestPayments: [
      {
        id: 'p-1',
        receiptNumber: 'RC-691001',
        date: '2026-10-01T09:15:00.000Z',
        monthsPaid: 2,
        ratePercent: 1.75,
        interestAmount: 770,
        discountAmount: 0,
        lateFee: 0,
        totalPaid: 770,
        previousDueDate: '2026-10-01',
        newDueDate: '2026-12-01',
        recordedBy: 'คุณชัยกร (เจ้าของร้าน / ผู้ดูแลระบบ)',
        paymentMethod: 'cash',
        note: 'ต่อดอกเบี้ยล่วงหน้า 2 เดือน',
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
      category: 'jewelry',
      name: 'แหวนเพชรแท้เบลเยี่ยมคัต 0.50 กะรัต ตัวเรือนทองขาว 18K',
      description: 'เพชรเม็ดกลาง 0.50 กะรัต น้ำ 97 VVS2 พร้อมใบรับประกัน',
      estimatedValue: 40000,
      photos: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80'],
    },
    loanAmount: 25000,
    monthlyInterestRate: 1.75,
    isTieredRate: true,
    startDate: '2026-07-10',
    durationMonths: 2,
    dueDate: '2026-09-10',
    status: 'redeemed',
    isLocked: true,
    storageLocation: 'ตู้เซฟ A-03 (ส่งมอบคืนแล้ว)',
    interestPayments: [],
    redemption: {
      redeemDate: '2026-09-08T11:45:00.000Z',
      receiptNumber: 'RD-690908',
      principalPaid: 25000,
      interestPaid: 875,
      discountAmount: 75,
      extraFee: 0,
      totalPaid: 25800,
      recordedBy: 'ช่างเอก (หัวหน้าช่าง / ผู้จัดการ)',
      paymentMethod: 'transfer',
    },
    amendmentLogs: [],
    createdAt: '2026-07-10T11:00:00.000Z',
    createdBy: 'ช่างเอก (หัวหน้าช่าง / ผู้จัดการ)',
  },
];

/**
 * Storage helpers
 */
export function getContracts(): PawnContract[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTRACTS);
    if (!raw) {
      saveContracts(INITIAL_CONTRACTS);
      return INITIAL_CONTRACTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading contracts from storage', err);
    return INITIAL_CONTRACTS;
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
      saveCustomers(INITIAL_CUSTOMERS);
      return INITIAL_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CUSTOMERS;
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
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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

/**
 * Export complete backup database as JSON string
 */
export function exportDatabaseBackup(): string {
  const data = {
    app: 'Anchan Pawn Pro',
    version: '2.0.0',
    owner: 'คุณชัยกร (Chaiyakorn)',
    exportDate: new Date().toISOString(),
    contracts: getContracts(),
    archivedContracts: getArchivedContracts(),
    customers: getCustomers(),
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
  saveSettings(DEFAULT_SETTINGS);
  saveUsers(DEFAULT_USERS);
  saveArchivedContracts([]);
  setCurrentUser(DEFAULT_USERS[0]);
}
