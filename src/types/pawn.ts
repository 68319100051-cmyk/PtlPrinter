export type ItemCategory = 'notebook' | 'computer' | 'printer' | 'phone' | 'gadget_it' | 'general';

export type ContractStatus = 'active' | 'due_soon' | 'overdue' | 'redeemed' | 'forfeited';

export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserAccount {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
}

export interface InterestTier {
  minAmount: number;
  maxAmount: number; // e.g. 10000, 50000, or Infinity
  monthlyRatePercent: number; // e.g. 2.0%
}

export interface Customer {
  id: string;
  citizenId: string; // 13 digits
  prefix: string; // นาย / นาง / นางสาว / อาจารย์ / คุณ
  firstName: string;
  lastName: string;
  phone: string;
  lineId?: string;
  address: string;
  photoUrl?: string;
  note?: string;
  isVip?: boolean;
  createdAt: string;
}

export interface NotebookItemDetails {
  brand: string;
  model: string;
  serialNumber: string;
  processor: string; // เช่น Intel Core i7-13650HX, AMD Ryzen 7 5800H, Apple M3
  ramGb: number | string; // เช่น 8, 16, 32 GB
  storage: string; // เช่น SSD 512GB NVMe, 1TB
  gpu?: string; // เช่น NVIDIA RTX 4060, Iris Xe, Onboard
  screenSize?: string; // เช่น 15.6" 144Hz, 14" OLED
  batteryHealth?: string; // เช่น เก็บไฟดี > 2 ชม., พอใช้, เสื่อม
  hasCharger: boolean;
  hasBag: boolean;
  icloudStatus?: 'signed_out' | 'locked' | 'unlocked';
}

export interface ComputerItemDetails {
  brandOrCustom: string; // เช่น แบรนด์ประกอบ (Custom DIY), Dell, HP, Lenovo
  modelOrCase: string; // เช่น Case NZXT H5 Flow, Dell OptiPlex
  processor: string; // เช่น Intel Core i5-13400F, AMD Ryzen 5 5600X
  ramGb: number | string; // เช่น 16, 32 GB DDR4/DDR5
  storage: string; // เช่น SSD 1TB M.2 NVMe + HDD 2TB
  gpu?: string; // เช่น NVIDIA GeForce RTX 3060 12GB
  powerSupply?: string; // เช่น 650W 80+ Bronze
  monitor?: string; // เช่น จอ AOC 24" 165Hz IPS
  accessories: string[]; // เช่น เมาส์, คีย์บอร์ด, สายไฟ AC, สาย HDMI
}

export interface PrinterItemDetails {
  brand: 'Epson' | 'Canon' | 'Brother' | 'HP' | string;
  model: string; // เช่น EcoTank L3250, L4260, PIXMA G3010, DCP-T420W
  serialNumber: string;
  printerType: 'ink_tank' | 'laser' | 'all_in_one' | 'dot_matrix' | 'other';
  inkSystem: 'genuine_tank' | 'cartridge' | 'mod_tank'; // ระบบแท็งก์แท้ศูนย์ / ตลับหมึก
  headCondition: 'normal' | 'need_clean' | 'clogged_minor'; // สภาพหัวพิมพ์ ออกครบ 100% / มีเส้น
  hasPowerCable: boolean;
  hasUsbCable: boolean;
}

export interface PhoneDetails {
  brand: string;
  model: string;
  storageGb: string;
  imei: string;
  serialNumber?: string;
  accessories: string[];
  icloudStatus: 'signed_out' | 'locked' | 'unlocked';
  passcode?: string;
}

export interface ItGadgetDetails {
  gadgetType: 'tablet' | 'monitor' | 'camera' | 'gpu_part' | 'console' | 'other';
  brand: string;
  model: string;
  serialNumber?: string;
  specsSummary: string; // สเปกย่อ
  accessories: string[];
}

export interface PawnItem {
  id: string;
  category: ItemCategory;
  name: string;
  description: string;
  estimatedValue: number; // ราคาประเมิน
  photos: string[]; // URLs or base64 data URLs
  notebook?: NotebookItemDetails;
  computer?: ComputerItemDetails;
  printer?: PrinterItemDetails;
  phone?: PhoneDetails;
  itGadget?: ItGadgetDetails;
}

export interface InterestPayment {
  id: string;
  receiptNumber: string;
  date: string;
  monthsPaid: number;
  ratePercent: number;
  interestAmount: number;
  discountAmount: number;
  lateFee: number;
  totalPaid: number;
  previousDueDate: string;
  newDueDate: string;
  recordedBy: string;
  paymentMethod: 'cash' | 'transfer';
  note?: string;
}

export interface ContractAmendmentLog {
  id: string;
  timestamp: string;
  authorizedBy: string;
  reason: string;
  changesSummary: string;
}

export interface PawnContract {
  id: string;
  contractNumber: string; // e.g. AC-6911001
  customerId: string;
  customerSnapshot: Customer;
  item: PawnItem;
  loanAmount: number; // เงินต้นรับจำนำ/ขายฝาก
  monthlyInterestRate: number; // อัตราดอกเบี้ยต่อเดือน เช่น 1.75%
  isTieredRate: boolean;
  startDate: string; // ISO date
  durationMonths: number; // e.g. 1, 2, 3, 4
  dueDate: string; // ISO date
  status: ContractStatus;
  isLocked: boolean; // Locked against modification
  interestPayments: InterestPayment[];
  redemption?: {
    redeemDate: string;
    receiptNumber: string;
    principalPaid: number;
    interestPaid: number;
    discountAmount: number;
    extraFee: number;
    totalPaid: number;
    recordedBy: string;
    paymentMethod: 'cash' | 'transfer';
  };
  forfeitedDate?: string;
  amendmentLogs: ContractAmendmentLog[];
  storageLocation?: string; // ที่จัดเก็บ เช่น ตู้ไอที ชั้น 2 ล็อกเกอร์ B-03, โซนคอมพิวเตอร์
  note?: string;
  createdAt: string;
  createdBy: string;
}

export interface ShopSettings {
  shopName: string;
  branchName: string;
  taxId: string;
  phone: string;
  email?: string;
  address: string;
  lineId: string;
  facebook?: string;
  promptPayId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  ownerName?: string;
  logoUrl?: string;
  defaultDurationMonths: number;
  defaultMonthlyRate: number;
  enableSteppedTiers: boolean;
  tiers: InterestTier[];
  lateFeePerDay: number;
  gracePeriodDays: number; // ระยะเวลาผ่อนผันก่อนยึดหลุด เช่น 7-15 วัน
  termsAndConditions: string;
}
