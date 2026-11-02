export type ItemCategory = 'gold' | 'phone' | 'vehicle' | 'jewelry' | 'general';

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
  prefix: string; // นาย / นาง / นางสาว
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

export interface GoldDetails {
  goldType: 'necklace' | 'bracelet' | 'ring' | 'bangle' | 'pendant' | 'bar' | 'other';
  goldTypeName: string;
  purity: '96.5%' | '99.99%' | '90%' | 'other';
  weightBaht: number; // e.g. 1, 2, 0.5
  weightGram: number; // e.g. 15.244
  condition: string;
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

export interface VehicleDetails {
  vehicleType: 'motorcycle' | 'car' | 'pickup' | 'other';
  licensePlate: string;
  province: string;
  brand: string;
  model: string;
  year?: string;
  chassisNumber?: string;
  hasBook: boolean;
  taxExpiryDate?: string;
}

export interface PawnItem {
  id: string;
  category: ItemCategory;
  name: string;
  description: string;
  estimatedValue: number; // ราคาประเมิน
  photos: string[]; // URLs or base64 data URLs
  gold?: GoldDetails;
  phone?: PhoneDetails;
  vehicle?: VehicleDetails;
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
  loanAmount: number; // เงินต้นรับจำนำ
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
  storageLocation?: string; // ที่จัดเก็บ เช่น ตู้เซฟ A-03, ชั้น 2 ล็อก 12
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
  gracePeriodDays: number; // ระยะเวลาผ่อนผันก่อนยึดหลุด เช่น 7 วัน
  termsAndConditions: string;
}
