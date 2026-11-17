import {
  FlaggedSerial,
  PawnContract,
  PawnItem,
  SerialCheckLevel,
  SerialCheckMatch,
} from '../types/pawn';
import { SecondhandBuyIn } from '../types/buyIn';

export interface CheckSerialOptions {
  contracts: PawnContract[];
  archivedContracts?: PawnContract[];
  secondhandBuyIns?: SecondhandBuyIn[];
  flagged?: FlaggedSerial[];
  excludeContractId?: string;
  customerId?: string;
  customerCitizenId?: string;
  isImei?: boolean;
}

const FLAG_REASON_LABELS: Record<FlaggedSerial['reason'], string> = {
  stolen: 'แจ้งโจรกรรม / ถูกขโมย',
  lost_report: 'แจ้งเอกสาร/ทรัพย์สินสูญหาย',
  suspicious: 'ของต้องสงสัย (เฝ้าระวัง)',
  police_notice: 'หนังสือแจ้งอายัดจากเจ้าหน้าที่ตำรวจ',
};

const CONTRACT_STATUS_LABELS: Record<PawnContract['status'], string> = {
  active: 'ยังเปิดสัญญา (ปกติ)',
  due_soon: 'ยังเปิดสัญญา (ใกล้ครบกำหนด)',
  overdue: 'ยังเปิดสัญญา (เกินกำหนด)',
  redeemed: 'ไถ่ถอนแล้ว',
  forfeited: 'หลุดจำนำแล้ว',
};

const LEVEL_PRIORITY: Record<SerialCheckLevel, number> = {
  block: 0,
  warn: 1,
  info: 2,
};

/**
 * Normalize serial/IMEI string for comparison:
 * trim, uppercase, remove spaces, hyphens, and dots.
 * Example: "r90z-8912 a004" -> "R90Z8912A004"
 */
export function normalizeSerial(s: string): string {
  if (!s) return '';
  return s.trim().toUpperCase().replace(/[\s\-.]+/g, '');
}

/**
 * Extract all serial numbers and IMEI values from a PawnItem
 * across notebook, printer, phone, and itGadget categories.
 */
export function collectSerials(item: PawnItem | undefined | null): string[] {
  if (!item) return [];
  const rawValues = [
    item.notebook?.serialNumber,
    item.printer?.serialNumber,
    item.phone?.imei,
    item.phone?.serialNumber,
    item.itGadget?.serialNumber,
  ];

  const seen = new Set<string>();
  const result: string[] = [];
  for (const val of rawValues) {
    if (!val) continue;
    const norm = normalizeSerial(val);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      result.push(norm);
    }
  }
  return result;
}

/**
 * Validate 15-digit numeric IMEI using the standard Luhn checksum algorithm.
 */
export function isValidImeiLuhn(imei: string): boolean {
  const norm = normalizeSerial(imei);
  if (!/^\d{15}$/.test(norm)) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(norm[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

function formatIsoDateShort(isoOrDate: string | undefined): string {
  if (!isoOrDate) return '-';
  return isoOrDate.includes('T') ? isoOrDate.split('T')[0] : isoOrDate;
}

/**
 * Pure serial/IMEI verification across flagged list, active/closed contracts,
 * archived contracts, secondhand buy-ins, customer history, and IMEI Luhn check.
 */
export function checkSerial(
  serial: string,
  options: CheckSerialOptions
): SerialCheckMatch[] {
  const normalized = normalizeSerial(serial);
  if (!normalized) return [];

  const {
    contracts = [],
    archivedContracts = [],
    secondhandBuyIns = [],
    flagged = [],
    excludeContractId,
    customerId,
    customerCitizenId,
    isImei = false,
  } = options;

  const matches: SerialCheckMatch[] = [];
  const cleanCitizenId = customerCitizenId ? normalizeSerial(customerCitizenId) : '';

  // 1. Flagged serials (active only) -> 'block'
  for (const flag of flagged) {
    if (!flag.active) continue;
    if (normalizeSerial(flag.serial) === normalized) {
      const reasonText = FLAG_REASON_LABELS[flag.reason] || flag.reason;
      matches.push({
        level: 'block',
        source: 'flagged_serials',
        label: `เลขเครื่องติดบัญชีเฝ้าระวัง: ${reasonText}`,
        detail: `${flag.note ? `${flag.note} · ` : ''}บันทึกโดย ${flag.addedBy} (${formatIsoDateShort(flag.addedAt)})`,
        refId: flag.id,
      });
    }
  }

  // 2. Active & closed contracts (excluding current contract when editing)
  for (const contract of contracts) {
    if (excludeContractId && contract.id === excludeContractId) continue;
    const itemSerials = collectSerials(contract.item);
    if (!itemSerials.includes(normalized)) continue;

    const custName = `${contract.customerSnapshot?.prefix || ''}${contract.customerSnapshot?.firstName || ''} ${contract.customerSnapshot?.lastName || ''}`.trim();
    const isSameCustomer = Boolean(
      (customerId && contract.customerId === customerId) ||
        (cleanCitizenId &&
          normalizeSerial(contract.customerSnapshot?.citizenId || '') === cleanCitizenId)
    );

    const isOpen = contract.status !== 'redeemed' && contract.status !== 'forfeited';

    if (isOpen) {
      matches.push({
        level: 'block',
        source: 'active_contract',
        label: `พบเลขเครื่องซ้ำในสัญญาที่ยังเปิดอยู่ (${contract.contractNumber})`,
        detail: `สัญญา ${contract.contractNumber} · ลูกค้า: ${custName || '-'} · ${CONTRACT_STATUS_LABELS[contract.status]} (ทำรายการ ${formatIsoDateShort(contract.startDate)})`,
        refId: contract.id,
      });
    } else {
      const closedDate =
        contract.redemption?.redeemDate || contract.forfeitedDate || contract.startDate;
      matches.push({
        level: 'warn',
        source: 'closed_contract',
        label: `เคยทำสัญญาแล้วและปิดรายการ (${contract.contractNumber})`,
        detail: `สัญญา ${contract.contractNumber} · ${CONTRACT_STATUS_LABELS[contract.status]} เมื่อ ${formatIsoDateShort(closedDate)} (${custName || '-'})`,
        refId: contract.id,
      });
    }

    if (isSameCustomer) {
      matches.push({
        level: 'info',
        source: 'same_customer',
        label: `ตรงกับลูกค้าคนเดิม (${contract.contractNumber})`,
        detail: `ลูกค้า ${custName || '-'} เคยนำเครื่องนี้มาทำสัญญา ${contract.contractNumber} วันที่ ${formatIsoDateShort(contract.startDate)}`,
        refId: contract.id,
      });
    }
  }

  // 3. Archived contracts -> 'warn' (+ 'info' if same customer)
  for (const archived of archivedContracts) {
    if (excludeContractId && archived.id === excludeContractId) continue;
    const itemSerials = collectSerials(archived.item);
    if (!itemSerials.includes(normalized)) continue;

    const custName = `${archived.customerSnapshot?.prefix || ''}${archived.customerSnapshot?.firstName || ''} ${archived.customerSnapshot?.lastName || ''}`.trim();
    const archivedDate =
      archived.redemption?.redeemDate || archived.forfeitedDate || archived.startDate;

    matches.push({
      level: 'warn',
      source: 'archived_contract',
      label: `พบประวัติในคลังสัญญาจัดเก็บ (${archived.contractNumber})`,
      detail: `สัญญา ${archived.contractNumber} · ${CONTRACT_STATUS_LABELS[archived.status]} วันที่ ${formatIsoDateShort(archivedDate)} (${custName || '-'})`,
      refId: archived.id,
    });

    const isSameCustomer = Boolean(
      (customerId && archived.customerId === customerId) ||
        (cleanCitizenId &&
          normalizeSerial(archived.customerSnapshot?.citizenId || '') === cleanCitizenId)
    );
    if (isSameCustomer) {
      matches.push({
        level: 'info',
        source: 'same_customer',
        label: `ตรงกับลูกค้าคนเดิมในคลังสัญญา (${archived.contractNumber})`,
        detail: `ลูกค้า ${custName || '-'} เคยทำสัญญา ${archived.contractNumber} วันที่ ${formatIsoDateShort(archived.startDate)}`,
        refId: archived.id,
      });
    }
  }

  // 4. Secondhand buy-ins -> 'warn'
  for (const buyIn of secondhandBuyIns) {
    const buyInSerial = normalizeSerial(buyIn.notebookSpecs?.serialNumber || '');
    if (buyInSerial && buyInSerial === normalized) {
      matches.push({
        level: 'warn',
        source: 'secondhand_buyin',
        label: `พบเลขเครื่องในสต็อกรับซื้อ / สินค้ามือสอง (${buyIn.buyInNumber})`,
        detail: `รหัส ${buyIn.buyInNumber} · ${buyIn.notebookSpecs?.brand || ''} ${buyIn.notebookSpecs?.model || ''} (วันที่ ${formatIsoDateShort(buyIn.date)})`,
        refId: buyIn.id,
      });
    }
  }

  // 5. IMEI 15-digit & Luhn checksum check -> 'warn'
  const shouldCheckImei =
    (isImei && /^\d+$/.test(normalized)) || /^\d{14,16}$/.test(normalized);
  if (shouldCheckImei && !isValidImeiLuhn(normalized)) {
    matches.push({
      level: 'warn',
      source: 'imei_luhn',
      label: 'IMEI ไม่ถูกต้อง อาจพิมพ์ผิดหรือถูกแก้ไข',
      detail: `เลขที่ตรวจสอบ: ${normalized} (${normalized.length} หลัก) ต้องเป็นตัวเลข 15 หลักที่ผ่านเกณฑ์ Luhn`,
      refId: 'imei-luhn',
    });
  }

  matches.sort((a, b) => LEVEL_PRIORITY[a.level] - LEVEL_PRIORITY[b.level]);
  return matches;
}
