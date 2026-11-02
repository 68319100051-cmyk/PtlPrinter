import { Customer } from './pawn';

export type NotebookBrand = 
  | 'Asus' 
  | 'Acer' 
  | 'Lenovo' 
  | 'Dell' 
  | 'HP' 
  | 'Apple' 
  | 'MSI' 
  | 'Huawei' 
  | 'Samsung' 
  | 'Microsoft' 
  | 'Other';

export type BatteryCondition = 
  | 'good'        // เก็บไฟดี (> 2 ชม.)
  | 'fair'        // พอใช้ (1 - 2 ชม.)
  | 'poor'        // เสื่อม (< 30 นาที)
  | 'plugged_only'; // ต้องเสียบสายชาร์จตลอด

export type CosmeticGrade = 'A' | 'B' | 'C' | 'D';

export interface NotebookHardwareChecklist {
  keyboard: boolean;       // คีย์บอร์ดพิมพ์ติดทุกปุ่ม
  screen: boolean;         // จอภาพปกติ ไม่มีจุด Dead/Bright Pixel หรือเส้น
  touchpad: boolean;       // ทัชแพดคลิกและรูดลื่นปกติ
  wifiBluetooth: boolean;  // ไวไฟและบลูทูธรับสัญญาณได้ปกติ
  webcamMic: boolean;      // กล้องเว็บแคมและไมโครโฟนใช้งานได้
  speakers: boolean;       // ลำโพงเสียงออกทั้งสองข้าง ไม่แตก
  usbPorts: boolean;       // พอร์ต USB/Type-C เสียบติดทุกช่อง
  chargingPort: boolean;   // รูชาร์จไฟแน่น ชาร์จเข้าปกติ
}

export interface NotebookSpecs {
  brand: NotebookBrand | string;
  model: string;
  serialNumber: string; // S/N เครื่อง
  processor: string;    // CPU เช่น Intel Core i5-12450H, AMD Ryzen 5 5600H, Apple M2
  ramGb: number;        // RAM เช่น 8, 16, 32 GB
  storage: string;      // ความจุ เช่น SSD 512GB NVMe, 1TB SSD
  gpu: string;          // การ์ดจอ เช่น NVIDIA RTX 3050 4GB, Intel Iris Xe, Onboard
  screenSize: string;   // เช่น 15.6" FHD 144Hz, 14" OLED, 13.6" Liquid Retina
  batteryStatus: BatteryCondition;
  cosmeticGrade: CosmeticGrade; // A (สวย 95%+), B (รอยทั่วไป), C (มีรอยบุบ/ถลอก), D (ตำหนิหนัก)
  hasCharger: boolean;  // มีสายชาร์จ/อะแดปเตอร์แท้
  hasBox: boolean;      // มีกล่องบรรจุภัณฑ์
  hasBag: boolean;      // มีกระเป๋าใส่โน็ตบุ้ค
  isICloudOrPasscodeCleared: boolean; // ปลดล็อค Apple ID, Microsoft Account, BIOS password แล้ว
  checklist: NotebookHardwareChecklist;
  defectsNotes?: string; // รายละเอียดตำหนิ (ถ้ามี)
}

export type BuyInStatus = 
  | 'in_stock'       // อยู่ในคลัง/สต็อก
  | 'ready_to_sell'  // ตรวจเช็คลงวินโดว์พร้อมขายหน้าร้าน
  | 'sold'           // ขายออกแล้ว
  | 'under_repair';  // ส่งช่างตรวจซ่อม/อัปเกรด

export interface SecondhandBuyIn {
  id: string;
  buyInNumber: string; // e.g. NB-6911001 หรือ BUY-6911001
  date: string;        // วันที่รับซื้อ (ISO)
  category: 'laptop' | 'desktop_pc' | 'electronics';
  notebookSpecs: NotebookSpecs;
  sellerSnapshot: Customer; // ข้อมูลผู้ขาย (บัตรประชาชน 13 หลัก, ชื่อ-สกุล, ที่อยู่, เบอร์โทร)
  purchasePrice: number;    // ราคาที่รับซื้อ (บาท)
  targetSalePrice: number;  // ราคาตั้งขายหน้าร้าน (บาท)
  paymentMethod: 'cash' | 'transfer';
  status: BuyInStatus;
  soldPrice?: number;
  soldDate?: string;
  soldCustomerName?: string;
  photos: string[];         // รูปถ่ายตัวเครื่อง, S/N, สเปก, สำเนาบัตรประชาชน
  buyerStaff: string;       // พนักงานผู้รับซื้อและตรวจสอบ
  notes?: string;
  legalOwnershipDeclaration: boolean; // ผู้ขายยินยอมรับรองว่าเป็นเจ้าของที่ถูกต้อง ไม่ใช่ของโจรกรรม
  createdAt: string;
}
