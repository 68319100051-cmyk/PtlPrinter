/**
 * Thai formatting and calculation utilities for Anchan Pawn System
 */

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * Format number to Thai Baht currency string
 */
export function formatCurrency(amount: number, showSymbol = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) return showSymbol ? '฿0.00' : '0.00';
  const formatted = amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return showSymbol ? `฿${formatted}` : formatted;
}

/**
 * Format ISO date string into Thai Buddhist Era Date (e.g. 1 พ.ย. 2569)
 */
export function formatThaiDate(dateStr: string, isFullMonth = false): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  
  const day = d.getDate();
  const month = isFullMonth ? THAI_MONTHS_FULL[d.getMonth()] : THAI_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear() + 543;
  
  return `${day} ${month} ${year}`;
}

/**
 * Format date with time in Thai
 */
export function formatThaiDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  
  const dateFormatted = formatThaiDate(dateStr, false);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${dateFormatted} ${hours}:${minutes} น.`;
}

/**
 * Calculate difference in days between target date and today
 * Positive: Days remaining until due date
 * Negative: Days overdue
 */
export function getDaysRemaining(dueDateStr: string): number {
  if (!dueDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format Thai Citizen ID (13 digits) with hyphens: x-xxxx-xxxxx-xx-x
 */
export function formatCitizenId(id: string): string {
  const clean = (id || '').replace(/\D/g, '').slice(0, 13);
  if (clean.length !== 13) return clean;
  return `${clean.slice(0, 1)}-${clean.slice(1, 5)}-${clean.slice(5, 10)}-${clean.slice(10, 12)}-${clean.slice(12)}`;
}

/**
 * Format Thai Phone number: 08x-xxx-xxxx
 */
export function formatPhone(phone: string): string {
  const clean = (phone || '').replace(/\D/g, '').slice(0, 10);
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  if (clean.length === 9) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
  }
  return clean;
}

/**
 * Convert number into Thai text Baht (บาทถ้วน) for legal contracts
 * e.g. 15000 -> หนึ่งหมื่นห้าพันบาทถ้วน
 */
export function bahtToText(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'ศูนย์บาทถ้วน';

  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const splitAmount = amount.toFixed(2).split('.');
  const baht = splitAmount[0];
  const satang = splitAmount[1];

  function convertGroup(digits: string): string {
    let result = '';
    const len = digits.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(digits[i], 10);
      const position = len - i - 1;

      if (digit !== 0) {
        if (position === 0 && digit === 1 && len > 1 && digits[len - 2] !== '0') {
          result += 'เอ็ด';
        } else if (position === 1 && digit === 2) {
          result += 'ยี่สิบ';
        } else if (position === 1 && digit === 1) {
          result += 'สิบ';
        } else {
          result += numbers[digit] + (digit > 0 ? units[position] : '');
        }
      }
    }
    return result;
  }

  let text = '';
  if (baht.length > 6) {
    const millions = baht.slice(0, baht.length - 6);
    const remainder = baht.slice(baht.length - 6);
    text += convertGroup(millions) + 'ล้าน' + convertGroup(remainder);
  } else {
    text += convertGroup(baht);
  }

  text += 'บาท';

  if (satang === '00') {
    text += 'ถ้วน';
  } else {
    text += convertGroup(satang) + 'สตางค์';
  }

  return text;
}

export const thaiBahtText = bahtToText;

/**
 * Calculate stepped tiered interest rate
 */
export function calculateTieredInterestRate(
  amount: number,
  tiers: { minAmount: number; maxAmount: number; monthlyRatePercent: number }[],
  fallbackRate = 1.75
): number {
  if (!tiers || tiers.length === 0) return fallbackRate;
  const matched = tiers.find(t => amount >= t.minAmount && amount <= t.maxAmount);
  return matched ? matched.monthlyRatePercent : fallbackRate;
}

/**
 * Format duration text nicely in Thai (e.g. "1 เดือน 15 วัน", "2 เดือน", "15 วัน")
 */
export function formatDurationText(months: number = 0, days: number = 0): string {
  const m = Math.max(0, Math.floor(months || 0));
  const d = Math.max(0, Math.floor(days || 0));
  
  if (m > 0 && d > 0) {
    return `${m} เดือน ${d} วัน`;
  }
  if (m > 0) {
    return `${m} เดือน`;
  }
  if (d > 0) {
    return `${d} วัน`;
  }
  return '0 วัน';
}

/**
 * Add months to date string and return ISO format YYYY-MM-DD
 */
export function addMonthsToDate(baseDateStr: string, months: number): string {
  return addMonthsAndDaysToDate(baseDateStr, months, 0);
}

/**
 * Add months and days to date string and return ISO format YYYY-MM-DD
 */
export function addMonthsAndDaysToDate(baseDateStr: string, months: number = 0, days: number = 0): string {
  const d = new Date(baseDateStr);
  if (isNaN(d.getTime())) return baseDateStr;
  if (months > 0) {
    d.setMonth(d.getMonth() + months);
  }
  if (days > 0) {
    d.setDate(d.getDate() + days);
  }
  return d.toISOString().split('T')[0];
}

/**
 * Calculate months and days between two ISO date strings (startDate and dueDate)
 */
export function calculateDurationFromDates(startDateStr: string, dueDateStr: string): { months: number; days: number } {
  if (!startDateStr || !dueDateStr) return { months: 0, days: 0 };
  const start = new Date(startDateStr);
  const due = new Date(dueDateStr);
  if (isNaN(start.getTime()) || isNaN(due.getTime()) || due < start) {
    return { months: 0, days: 0 };
  }

  let months = (due.getFullYear() - start.getFullYear()) * 12 + (due.getMonth() - start.getMonth());
  let dayDiff = due.getDate() - start.getDate();

  if (dayDiff < 0) {
    months -= 1;
    // Get days in previous month
    const prevMonthDate = new Date(due.getFullYear(), due.getMonth(), 0);
    dayDiff += prevMonthDate.getDate();
  }

  if (months < 0) {
    const diffTime = due.getTime() - start.getTime();
    const totalDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
    return { months: 0, days: totalDays };
  }

  return { months: Math.max(0, months), days: Math.max(0, dayDiff) };
}
