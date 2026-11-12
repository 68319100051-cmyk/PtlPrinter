import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testConnection } from '../firebase/config';
import { PawnContract, Customer, ShopSettings } from '../types/pawn';
import { SecondhandBuyIn } from '../types/buyIn';
import { saveContracts, saveCustomers, saveSettings, saveSecondhandBuyIns } from '../utils/storage';

export type SyncStatus = 'connecting' | 'connected' | 'offline' | 'syncing' | 'error';

/**
 * Sync individual contract to Firestore (save / update single document)
 */
export async function syncContractToCloud(contract: PawnContract): Promise<string> {
  const path = `contracts/${contract.id}`;
  try {
    await setDoc(doc(db, 'contracts', contract.id), contract);
    console.log(`บันทึกแล้ว [Firestore]: ${path}`, contract);
    return path;
  } catch (err) {
    console.error(`บันทึกไม่สำเร็จ [Firestore]: ${path}`, err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete individual contract from Firestore
 */
export async function deleteContractFromCloud(contractId: string): Promise<string> {
  const path = `contracts/${contractId}`;
  try {
    await deleteDoc(doc(db, 'contracts', contractId));
    console.log(`ลบแล้ว [Firestore]: ${path}`);
    return path;
  } catch (err) {
    console.error(`ลบไม่สำเร็จ [Firestore]: ${path}`, err);
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Sync individual customer to Firestore (save / update single document)
 */
export async function syncCustomerToCloud(customer: Customer): Promise<string> {
  const path = `customers/${customer.id}`;
  try {
    await setDoc(doc(db, 'customers', customer.id), customer);
    console.log(`บันทึกแล้ว [Firestore]: ${path}`, customer);
    return path;
  } catch (err) {
    console.error(`บันทึกไม่สำเร็จ [Firestore]: ${path}`, err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete individual customer from Firestore
 */
export async function deleteCustomerFromCloud(customerId: string): Promise<string> {
  const path = `customers/${customerId}`;
  try {
    await deleteDoc(doc(db, 'customers', customerId));
    console.log(`ลบแล้ว [Firestore]: ${path}`);
    return path;
  } catch (err) {
    console.error(`ลบไม่สำเร็จ [Firestore]: ${path}`, err);
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Sync settings to Firestore
 */
export async function syncSettingsToCloud(settings: ShopSettings): Promise<string> {
  const path = 'settings/current';
  try {
    await setDoc(doc(db, 'settings', 'current'), settings);
    console.log(`บันทึกแล้ว [Firestore]: ${path}`, settings);
    return path;
  } catch (err) {
    console.error(`บันทึกไม่สำเร็จ [Firestore]: ${path}`, err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Sync individual secondhand buy-in to Firestore
 */
export async function syncSecondhandToCloud(item: SecondhandBuyIn): Promise<string> {
  const path = `secondhand_buyins/${item.id}`;
  try {
    await setDoc(doc(db, 'secondhand_buyins', item.id), item);
    console.log(`บันทึกแล้ว [Firestore]: ${path}`, item);
    return path;
  } catch (err) {
    console.error(`บันทึกไม่สำเร็จ [Firestore]: ${path}`, err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Initialize Firebase Firestore as the Single Source of Truth
 * 1. Checks connection
 * 2. Fetches existing data from Firestore and immediately loads it to UI
 * 3. Only if Firestore is completely empty on first launch, seeds initial records
 * 4. Binds real-time onSnapshot listeners once to keep all clients in sync
 */
export function initFirebaseSync(callbacks: {
  onContractsUpdated: (contracts: PawnContract[]) => void;
  onCustomersUpdated: (customers: Customer[]) => void;
  onSettingsUpdated: (settings: ShopSettings) => void;
  onSecondhandUpdated?: (items: SecondhandBuyIn[]) => void;
  onStatusChanged: (status: SyncStatus, message?: string) => void;
  initialLocalContracts: PawnContract[];
  initialLocalCustomers: Customer[];
  initialLocalSettings: ShopSettings;
  initialLocalSecondhand?: SecondhandBuyIn[];
}): () => void {
  const {
    onContractsUpdated,
    onCustomersUpdated,
    onSettingsUpdated,
    onSecondhandUpdated,
    onStatusChanged,
    initialLocalContracts,
    initialLocalCustomers,
    initialLocalSettings,
    initialLocalSecondhand = [],
  } = callbacks;

  let unsubscribeContracts: (() => void) | null = null;
  let unsubscribeCustomers: (() => void) | null = null;
  let unsubscribeSettings: (() => void) | null = null;
  let unsubscribeSecondhand: (() => void) | null = null;

  async function start() {
    onStatusChanged('connecting', 'กำลังเชื่อมต่อกับ Firebase Firestore...');
    const isOnline = await testConnection();

    if (!isOnline) {
      onStatusChanged('offline', 'Firebase ออฟไลน์ กำลังใช้งานแคชข้อมูลในเครื่อง');
      return;
    }

    try {
      // =====================================================================
      // 1. CONTRACTS: Fetch from Firestore first. Never overwrite remote data!
      // =====================================================================
      const contractsSnap = await getDocs(collection(db, 'contracts')).catch((err) => {
        handleFirestoreError(err, OperationType.LIST, 'contracts');
      });

      if (contractsSnap && !contractsSnap.empty) {
        const loadedContracts: PawnContract[] = [];
        contractsSnap.forEach((d) => loadedContracts.push(d.data() as PawnContract));
        saveContracts(loadedContracts);
        onContractsUpdated(loadedContracts);
        console.log(`โหลดข้อมูลสัญญาจาก Firebase Firestore สำเร็จ: ${loadedContracts.length} รายการ (Path: contracts)`);
      } else if (contractsSnap && contractsSnap.empty && initialLocalContracts.length > 0) {
        onStatusChanged('syncing', 'กำลังอัปโหลดข้อมูลเริ่มต้นไปยัง Firebase Cloud...');
        console.log('Firebase contracts ว่างเปล่า กำลังอัปโหลดข้อมูลเริ่มต้น...');
        for (const c of initialLocalContracts) {
          await setDoc(doc(db, 'contracts', c.id), c);
          console.log(`บันทึกข้อมูลเริ่มต้นแล้ว [Firestore]: contracts/${c.id}`);
        }
      }

      // =====================================================================
      // 2. CUSTOMERS: Fetch from Firestore first
      // =====================================================================
      const customersSnap = await getDocs(collection(db, 'customers')).catch((err) => {
        handleFirestoreError(err, OperationType.LIST, 'customers');
      });

      if (customersSnap && !customersSnap.empty) {
        const loadedCustomers: Customer[] = [];
        customersSnap.forEach((d) => loadedCustomers.push(d.data() as Customer));
        saveCustomers(loadedCustomers);
        onCustomersUpdated(loadedCustomers);
        console.log(`โหลดข้อมูลลูกค้าจาก Firebase Firestore สำเร็จ: ${loadedCustomers.length} รายการ (Path: customers)`);
      } else if (customersSnap && customersSnap.empty && initialLocalCustomers.length > 0) {
        console.log('Firebase customers ว่างเปล่า กำลังอัปโหลดข้อมูลเริ่มต้น...');
        for (const cust of initialLocalCustomers) {
          await setDoc(doc(db, 'customers', cust.id), cust);
          console.log(`บันทึกข้อมูลเริ่มต้นแล้ว [Firestore]: customers/${cust.id}`);
        }
      }

      // =====================================================================
      // 3. SETTINGS: Fetch from Firestore first
      // =====================================================================
      const settingsSnap = await getDocs(collection(db, 'settings')).catch((err) => {
        handleFirestoreError(err, OperationType.LIST, 'settings');
      });

      if (settingsSnap && !settingsSnap.empty) {
        const settingDoc = settingsSnap.docs.find((d) => d.id === 'current');
        if (settingDoc) {
          const loadedSettings = settingDoc.data() as ShopSettings;
          saveSettings(loadedSettings);
          onSettingsUpdated(loadedSettings);
          console.log('โหลดการตั้งค่าร้านจาก Firebase Firestore สำเร็จ (Path: settings/current)');
        }
      } else if (settingsSnap && settingsSnap.empty) {
        await setDoc(doc(db, 'settings', 'current'), initialLocalSettings);
        console.log('บันทึกข้อมูลเริ่มต้นแล้ว [Firestore]: settings/current');
      }

      // =====================================================================
      // 4. SECONDHAND BUY-INS: Fetch from Firestore first
      // =====================================================================
      const secondhandSnap = await getDocs(collection(db, 'secondhand_buyins')).catch((err) => {
        handleFirestoreError(err, OperationType.LIST, 'secondhand_buyins');
      });

      if (secondhandSnap && !secondhandSnap.empty) {
        const loadedSecondhand: SecondhandBuyIn[] = [];
        secondhandSnap.forEach((d) => loadedSecondhand.push(d.data() as SecondhandBuyIn));
        saveSecondhandBuyIns(loadedSecondhand);
        if (onSecondhandUpdated) onSecondhandUpdated(loadedSecondhand);
        console.log(`โหลดข้อมูลสินค้ามือสองจาก Firebase Firestore สำเร็จ: ${loadedSecondhand.length} รายการ (Path: secondhand_buyins)`);
      } else if (secondhandSnap && secondhandSnap.empty && initialLocalSecondhand.length > 0) {
        for (const item of initialLocalSecondhand) {
          await setDoc(doc(db, 'secondhand_buyins', item.id), item);
          console.log(`บันทึกข้อมูลเริ่มต้นแล้ว [Firestore]: secondhand_buyins/${item.id}`);
        }
      }

      onStatusChanged('connected', 'เชื่อมต่อ Firebase Firestore สำเร็จ (เรียลไทม์คลาวด์)');

      // =====================================================================
      // 5. ATTACH REAL-TIME LISTENERS (Single listener setup per collection)
      // =====================================================================
      unsubscribeContracts = onSnapshot(
        collection(db, 'contracts'),
        (snapshot) => {
          const list: PawnContract[] = [];
          snapshot.forEach((d) => list.push(d.data() as PawnContract));
          saveContracts(list);
          onContractsUpdated(list);
          console.log(`[Firestore Listener] อัปเดตข้อมูลสัญญาเรียลไทม์: ${list.length} รายการ`);
        },
        (error) => {
          console.error('Contracts snapshot error', error);
          onStatusChanged('error', 'ข้อผิดพลาดการซิงค์สัญญา');
        }
      );

      unsubscribeCustomers = onSnapshot(
        collection(db, 'customers'),
        (snapshot) => {
          const list: Customer[] = [];
          snapshot.forEach((d) => list.push(d.data() as Customer));
          saveCustomers(list);
          onCustomersUpdated(list);
          console.log(`[Firestore Listener] อัปเดตข้อมูลลูกค้าเรียลไทม์: ${list.length} รายการ`);
        },
        (error) => {
          console.error('Customers snapshot error', error);
        }
      );

      unsubscribeSettings = onSnapshot(
        collection(db, 'settings'),
        (snapshot) => {
          snapshot.forEach((d) => {
            if (d.id === 'current') {
              const s = d.data() as ShopSettings;
              saveSettings(s);
              onSettingsUpdated(s);
              console.log('[Firestore Listener] อัปเดตการตั้งค่าร้านค้าเรียลไทม์');
            }
          });
        },
        (error) => {
          console.error('Settings snapshot error', error);
        }
      );

      if (onSecondhandUpdated) {
        unsubscribeSecondhand = onSnapshot(
          collection(db, 'secondhand_buyins'),
          (snapshot) => {
            const list: SecondhandBuyIn[] = [];
            snapshot.forEach((d) => list.push(d.data() as SecondhandBuyIn));
            saveSecondhandBuyIns(list);
            onSecondhandUpdated(list);
            console.log(`[Firestore Listener] อัปเดตสินค้ามือสองเรียลไทม์: ${list.length} รายการ`);
          },
          (error) => {
            console.error('Secondhand snapshot error', error);
          }
        );
      }
    } catch (err) {
      console.error('Error during initial Firebase sync', err);
      onStatusChanged('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ Firebase');
    }
  }

  start();

  return () => {
    if (unsubscribeContracts) unsubscribeContracts();
    if (unsubscribeCustomers) unsubscribeCustomers();
    if (unsubscribeSettings) unsubscribeSettings();
    if (unsubscribeSecondhand) unsubscribeSecondhand();
  };
}
