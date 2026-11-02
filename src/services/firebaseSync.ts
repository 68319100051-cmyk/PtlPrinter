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
import { saveContracts, saveCustomers, saveSettings, saveArchivedContracts } from '../utils/storage';

export type SyncStatus = 'connecting' | 'connected' | 'offline' | 'syncing' | 'error';

/**
 * Sync individual contract to Firestore
 */
export async function syncContractToCloud(contract: PawnContract): Promise<void> {
  const path = `contracts/${contract.id}`;
  try {
    await setDoc(doc(db, 'contracts', contract.id), contract);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Sync individual customer to Firestore
 */
export async function syncCustomerToCloud(customer: Customer): Promise<void> {
  const path = `customers/${customer.id}`;
  try {
    await setDoc(doc(db, 'customers', customer.id), customer);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Sync settings to Firestore
 */
export async function syncSettingsToCloud(settings: ShopSettings): Promise<void> {
  const path = 'settings/current';
  try {
    await setDoc(doc(db, 'settings', 'current'), settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Initialize 2-way real-time synchronization with Firestore
 */
export function initFirebaseSync(callbacks: {
  onContractsUpdated: (contracts: PawnContract[]) => void;
  onCustomersUpdated: (customers: Customer[]) => void;
  onSettingsUpdated: (settings: ShopSettings) => void;
  onStatusChanged: (status: SyncStatus, message?: string) => void;
  initialLocalContracts: PawnContract[];
  initialLocalCustomers: Customer[];
  initialLocalSettings: ShopSettings;
}): () => void {
  const {
    onContractsUpdated,
    onCustomersUpdated,
    onSettingsUpdated,
    onStatusChanged,
    initialLocalContracts,
    initialLocalCustomers,
    initialLocalSettings,
  } = callbacks;

  let unsubscribeContracts: (() => void) | null = null;
  let unsubscribeCustomers: (() => void) | null = null;
  let unsubscribeSettings: (() => void) | null = null;

  async function start() {
    onStatusChanged('connecting', 'กำลังเชื่อมต่อกับ Firebase Firestore...');
    const isOnline = await testConnection();

    if (!isOnline) {
      onStatusChanged('offline', 'Firebase ออฟไลน์ กำลังใช้งานแคชข้อมูลในเครื่อง');
      return;
    }

    try {
      // 1. Check if contracts exist in Firestore; if empty, seed initial data to cloud
      const contractsSnap = await getDocs(collection(db, 'contracts')).catch(err => {
        handleFirestoreError(err, OperationType.GET, 'contracts');
      });

      if (contractsSnap.empty && initialLocalContracts.length > 0) {
        onStatusChanged('syncing', 'กำลังอัปโหลดข้อมูลเริ่มต้นไปยัง Firebase Cloud...');
        for (const c of initialLocalContracts) {
          await setDoc(doc(db, 'contracts', c.id), c);
        }
      }

      // Check customers in Firestore
      const customersSnap = await getDocs(collection(db, 'customers')).catch(err => {
        handleFirestoreError(err, OperationType.GET, 'customers');
      });

      if (customersSnap.empty && initialLocalCustomers.length > 0) {
        for (const cust of initialLocalCustomers) {
          await setDoc(doc(db, 'customers', cust.id), cust);
        }
      }

      // Check settings in Firestore
      const settingsSnap = await getDocs(collection(db, 'settings')).catch(err => {
        handleFirestoreError(err, OperationType.GET, 'settings');
      });

      if (settingsSnap.empty) {
        await setDoc(doc(db, 'settings', 'current'), initialLocalSettings);
      }

      onStatusChanged('connected', 'เชื่อมต่อ Firebase Firestore สำเร็จ (เรียลไทม์คลาวด์)');

      // 2. Setup real-time listeners
      unsubscribeContracts = onSnapshot(
        collection(db, 'contracts'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: PawnContract[] = [];
            snapshot.forEach((d) => list.push(d.data() as PawnContract));
            saveContracts(list);
            onContractsUpdated(list);
          }
        },
        (error) => {
          console.error('Contracts snapshot error', error);
          onStatusChanged('error', 'ข้อผิดพลาดการซิงค์สัญญา');
        }
      );

      unsubscribeCustomers = onSnapshot(
        collection(db, 'customers'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Customer[] = [];
            snapshot.forEach((d) => list.push(d.data() as Customer));
            saveCustomers(list);
            onCustomersUpdated(list);
          }
        },
        (error) => {
          console.error('Customers snapshot error', error);
        }
      );

      unsubscribeSettings = onSnapshot(
        collection(db, 'settings'),
        (snapshot) => {
          if (!snapshot.empty) {
            snapshot.forEach((d) => {
              if (d.id === 'current') {
                const s = d.data() as ShopSettings;
                saveSettings(s);
                onSettingsUpdated(s);
              }
            });
          }
        },
        (error) => {
          console.error('Settings snapshot error', error);
        }
      );
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
  };
}
