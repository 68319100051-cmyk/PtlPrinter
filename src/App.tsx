/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { Workstation } from './components/Workstation';
import { NewContractModal } from './components/NewContractModal';
import { InterestPaymentModal } from './components/InterestPaymentModal';
import { RedemptionModal } from './components/RedemptionModal';
import { PrintTicketModal } from './components/PrintTicketModal';
import { CustomerModal } from './components/CustomerModal';
import { ReportsView } from './components/ReportsView';
import { SettingsModal } from './components/SettingsModal';
import { BackupArchiveModal } from './components/BackupArchiveModal';
import { SecurityAuthModal } from './components/SecurityAuthModal';
import { EditContractModal } from './components/EditContractModal';
import { SecondhandView } from './components/SecondhandView';
import { BuyInLaptopModal } from './components/BuyInLaptopModal';
import { PrintBuyInAgreementModal } from './components/PrintBuyInAgreementModal';
import { CustomerTagPrintModal } from './components/CustomerTagPrintModal';
import { CustomerDossierModal } from './components/CustomerDossierModal';
import { QuickScannerModal } from './components/QuickScannerModal';
import { ConvertForfeitedModal } from './components/ConvertForfeitedModal';
import {
  PawnContract,
  Customer,
  ShopSettings,
  UserAccount,
  InterestPayment
} from './types/pawn';
import { SecondhandBuyIn } from './types/buyIn';
import {
  getContracts,
  saveContracts,
  getArchivedContracts,
  getCustomers,
  saveCustomers,
  getSettings,
  saveSettings,
  getUsers,
  saveUsers,
  getCurrentUser,
  setCurrentUser,
  getSecondhandBuyIns,
  saveSecondhandBuyIns
} from './utils/storage';
import {
  initFirebaseSync,
  syncContractToCloud,
  syncCustomerToCloud,
  syncSettingsToCloud,
  syncSecondhandToCloud,
  SyncStatus
} from './services/firebaseSync';

export default function App() {
  const [contracts, setContracts] = useState<PawnContract[]>(() => getContracts());
  const [archivedContracts, setArchivedContracts] = useState<PawnContract[]>(() => getArchivedContracts());
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [settings, setSettings] = useState<ShopSettings>(() => getSettings());
  const [users, setUsers] = useState<UserAccount[]>(() => getUsers());
  const [currentUser, setCurUser] = useState<UserAccount>(() => getCurrentUser());
  const [secondhandBuyIns, setSecondhandBuyIns] = useState<SecondhandBuyIn[]>(() => getSecondhandBuyIns());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');

  // Toast notification for user confirmation
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'workstation' | 'secondhand' | 'customers' | 'reports' | 'backup' | 'settings'>('workstation');

  // Initialize Firebase Real-Time Synchronization
  useEffect(() => {
    const unsubscribe = initFirebaseSync({
      initialLocalContracts: contracts,
      initialLocalCustomers: customers,
      initialLocalSettings: settings,
      initialLocalSecondhand: secondhandBuyIns,
      onContractsUpdated: (cloudContracts) => {
        setContracts(cloudContracts);
      },
      onCustomersUpdated: (cloudCustomers) => {
        setCustomers(cloudCustomers);
      },
      onSettingsUpdated: (cloudSettings) => {
        setSettings(cloudSettings);
      },
      onSecondhandUpdated: (cloudSecondhand) => {
        setSecondhandBuyIns(cloudSecondhand);
      },
      onStatusChanged: (status) => {
        setSyncStatus(status);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Detect direct QR code scan from external smartphone camera (?customer=... or ?c=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const targetCustId = urlParams.get('customer') || urlParams.get('c');
    const targetContractNo = urlParams.get('contract') || urlParams.get('contractNo');

    if (targetCustId && customers.length > 0) {
      const cleanTarget = targetCustId.trim().toLowerCase();
      const matched = customers.find(c =>
        c.id.toLowerCase() === cleanTarget ||
        c.citizenId === targetCustId ||
        c.id.toLowerCase().endsWith(cleanTarget) ||
        c.citizenId.endsWith(cleanTarget) ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(cleanTarget)
      );

      if (matched) {
        setDossierCustomer(matched);
        if (targetContractNo && contracts.length > 0) {
          const matchedContract = contracts.find(con =>
            con.contractNumber.toLowerCase() === targetContractNo.toLowerCase() ||
            con.id === targetContractNo
          );
          if (matchedContract) {
            setActiveContract(matchedContract);
          }
        }
        setIsCustomerDossierOpen(true);
      }
    }
  }, [customers, contracts]);

  // Modals state
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [isInterestOpen, setIsInterestOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBuyInLaptopOpen, setIsBuyInLaptopOpen] = useState(false);
  const [isPrintBuyInOpen, setIsPrintBuyInOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCustomerDossierOpen, setIsCustomerDossierOpen] = useState(false);
  const [isCustomerTagPrintOpen, setIsCustomerTagPrintOpen] = useState(false);

  // Active items for modals
  const [activeContract, setActiveContract] = useState<PawnContract | null>(null);
  const [activePrintMode, setActivePrintMode] = useState<'slip' | 'half_a4' | 'a5_ticket' | 'full_contract' | 'interest_receipt' | 'a5_interest_receipt' | 'redeem_receipt' | 'a5_redeem_receipt'>('a5_ticket');
  const [activeReceipt, setActiveReceipt] = useState<InterestPayment | undefined>(undefined);
  const [activeBuyIn, setActiveBuyIn] = useState<SecondhandBuyIn | null>(null);
  const [dossierCustomer, setDossierCustomer] = useState<Customer | null>(null);
  const [tagCustomer, setTagCustomer] = useState<Customer | null>(null);
  const [tagRelatedContract, setTagRelatedContract] = useState<PawnContract | null>(null);
  const [tagRelatedBuyIn, setTagRelatedBuyIn] = useState<SecondhandBuyIn | null>(null);
  const [preselectedCustomer, setPreselectedCustomer] = useState<Customer | null>(null);
  const [convertForfeitContract, setConvertForfeitContract] = useState<PawnContract | null>(null);

  // Security gatekeeper state
  const [securityAction, setSecurityAction] = useState<{
    actionTitle: string;
    actionDescription: string;
    onAuthorized: (authorizerName: string, reason: string) => void;
  } | null>(null);

  // Authorized edit session state
  const [editSession, setEditSession] = useState<{
    contract: PawnContract;
    authorizerName: string;
    auditReason: string;
  } | null>(null);

  // Sync to localStorage
  const refreshAllData = () => {
    setContracts(getContracts());
    setArchivedContracts(getArchivedContracts());
    setCustomers(getCustomers());
    setSecondhandBuyIns(getSecondhandBuyIns());
    setSettings(getSettings());
    setUsers(getUsers());
  };

  const handleUserChange = (u: UserAccount) => {
    setCurUser(u);
    setCurrentUser(u);
  };

  // Secondhand Notebook Buy-in handlers
  const handleSaveNewBuyIn = async (newBuyIn: SecondhandBuyIn, newCustomer?: Customer) => {
    try {
      if (newCustomer) {
        await syncCustomerToCloud(newCustomer);
        const updatedCustomers = [newCustomer, ...customers.filter(c => c.id !== newCustomer.id)];
        setCustomers(updatedCustomers);
        saveCustomers(updatedCustomers);
        console.log(`บันทึกแล้ว [Firestore]: customers/${newCustomer.id}`, newCustomer);
      }

      await syncSecondhandToCloud(newBuyIn);
      const updated = [newBuyIn, ...secondhandBuyIns.filter(i => i.id !== newBuyIn.id)];
      setSecondhandBuyIns(updated);
      saveSecondhandBuyIns(updated);
      console.log(`บันทึกแล้ว [Firestore]: secondhand_buyins/${newBuyIn.id}`, newBuyIn);
      showToast(`บันทึกแล้ว [Firestore]: รับซื้อสินค้ามือสอง ${newBuyIn.buyInNumber}`);

      // Offer to print legal buy-in agreement immediately
      setActiveBuyIn(newBuyIn);
      setIsPrintBuyInOpen(true);
    } catch (error) {
      console.error('Error saving buy-in to Firebase:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`❌ เกิดข้อผิดพลาดในการบันทึกสินค้ามือสองลง Firebase:\n${msg}`);
      showToast(`บันทึกล้มเหลว: ${msg}`, 'error');
    }
  };

  const handleUpdateBuyIn = async (updatedBuyIn: SecondhandBuyIn) => {
    try {
      await syncSecondhandToCloud(updatedBuyIn);
      const updated = secondhandBuyIns.map(item => item.id === updatedBuyIn.id ? updatedBuyIn : item);
      setSecondhandBuyIns(updated);
      saveSecondhandBuyIns(updated);
      console.log(`บันทึกแล้ว [Firestore]: secondhand_buyins/${updatedBuyIn.id}`, updatedBuyIn);
      showToast(`บันทึกแล้ว [Firestore]: อัปเดตสินค้ามือสอง ${updatedBuyIn.buyInNumber}`);
    } catch (error) {
      console.error('Error updating buy-in in Firebase:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`❌ เกิดข้อผิดพลาดในการอัปเดตสินค้ามือสองลง Firebase:\n${msg}`);
      showToast(`อัปเดตล้มเหลว: ${msg}`, 'error');
    }
  };

  // 1. Create New Contract
  const handleSaveNewContract = async (newContract: PawnContract, newCustomer?: Customer) => {
    try {
      if (newCustomer) {
        await syncCustomerToCloud(newCustomer);
        const updatedCustomers = [newCustomer, ...customers.filter(c => c.id !== newCustomer.id)];
        setCustomers(updatedCustomers);
        saveCustomers(updatedCustomers);
        console.log(`บันทึกแล้ว [Firestore]: customers/${newCustomer.id}`, newCustomer);
      }

      await syncContractToCloud(newContract);
      const updatedContracts = [newContract, ...contracts.filter(c => c.id !== newContract.id)];
      setContracts(updatedContracts);
      saveContracts(updatedContracts);
      console.log(`บันทึกแล้ว [Firestore]: contracts/${newContract.id}`, newContract);
      showToast(`บันทึกแล้ว [Firestore]: สัญญาเลขที่ ${newContract.contractNumber}`);

      // Prompt to print immediately
      setActiveContract(newContract);
      setActivePrintMode('half_a4');
      setIsPrintOpen(true);
    } catch (error) {
      console.error('Error saving contract to Firebase:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`❌ เกิดข้อผิดพลาดในการบันทึกสัญญาลง Firebase:\n${msg}`);
      showToast(`บันทึกสัญญาล้มเหลว: ${msg}`, 'error');
    }
  };

  // 2. Interest Payment
  const handlePaymentSuccess = async (updatedContract: PawnContract, newPayment: InterestPayment) => {
    try {
      await syncContractToCloud(updatedContract);
      const updated = contracts.map(c => c.id === updatedContract.id ? updatedContract : c);
      setContracts(updated);
      saveContracts(updated);
      console.log(`บันทึกแล้ว [Firestore]: contracts/${updatedContract.id} (ต่อดอกเบี้ย)`, updatedContract);
      showToast(`บันทึกแล้ว [Firestore]: ต่อดอกเบี้ยสัญญา ${updatedContract.contractNumber}`);

      // Offer to print receipt
      setActiveContract(updatedContract);
      setActiveReceipt(newPayment);
      setActivePrintMode('interest_receipt');
      setIsPrintOpen(true);
    } catch (error) {
      console.error('Error saving payment to Firebase:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`❌ เกิดข้อผิดพลาดในการบันทึกการต่อดอกเบี้ยลง Firebase:\n${msg}`);
      showToast(`บันทึกต่อดอกเบี้ยล้มเหลว: ${msg}`, 'error');
    }
  };

  // 3. Redeem Contract
  const handleRedeemSuccess = async (updatedContract: PawnContract) => {
    try {
      await syncContractToCloud(updatedContract);
      const updated = contracts.map(c => c.id === updatedContract.id ? updatedContract : c);
      setContracts(updated);
      saveContracts(updated);
      console.log(`บันทึกแล้ว [Firestore]: contracts/${updatedContract.id} (ไถ่ถอน)`, updatedContract);
      showToast(`บันทึกแล้ว [Firestore]: ไถ่ถอนสัญญา ${updatedContract.contractNumber}`);

      // Offer to print release receipt
      setActiveContract(updatedContract);
      setActivePrintMode('redeem_receipt');
      setIsPrintOpen(true);
    } catch (error) {
      console.error('Error saving redemption to Firebase:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`❌ เกิดข้อผิดพลาดในการบันทึกการไถ่ถอนลง Firebase:\n${msg}`);
      showToast(`บันทึกไถ่ถอนล้มเหลว: ${msg}`, 'error');
    }
  };

  // 4. Request edit locked contract (requires manager/admin authorization)
  const handleRequestEditContract = (targetContract: PawnContract) => {
    setSecurityAction({
      actionTitle: `ขอแก้ไขสาระสัญญา ${targetContract.contractNumber}`,
      actionDescription: `รายการทรัพย์สิน: ${targetContract.item.name} (เงินต้น ${targetContract.loanAmount.toLocaleString()} บาท)`,
      onAuthorized: (authorizerName, reason) => {
        setEditSession({
          contract: targetContract,
          authorizerName,
          auditReason: reason,
        });
        setIsEditOpen(true);
      },
    });
    setIsSecurityOpen(true);
  };

  // 5. Forfeit item (ยึดหลุดจำนำ)
  const handleForfeitContract = (targetContract: PawnContract) => {
    setSecurityAction({
      actionTitle: `อนุมัติยึดทรัพย์สินหลุดจำนำ ${targetContract.contractNumber}`,
      actionDescription: `ทรัพย์สิน ${targetContract.item.name} สัญญาเกินกำหนดและพ้นระยะผ่อนผันแล้ว`,
      onAuthorized: async (authorizerName, reason) => {
        const updatedContract: PawnContract = {
          ...targetContract,
          status: 'forfeited',
          forfeitedDate: new Date().toISOString(),
          amendmentLogs: [
            ...targetContract.amendmentLogs,
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              authorizedBy: authorizerName,
              reason,
              changesSummary: `อนุมัติยึดทรัพย์สินหลุดจำนำโดย ${authorizerName}`,
            },
          ],
        };
        try {
          await syncContractToCloud(updatedContract);
          const updated = contracts.map(c => c.id === targetContract.id ? updatedContract : c);
          setContracts(updated);
          saveContracts(updated);
          console.log(`บันทึกแล้ว [Firestore]: contracts/${updatedContract.id} (หลุดจำนำ)`, updatedContract);
          showToast(`บันทึกแล้ว [Firestore]: ยึดทรัพย์สิน ${updatedContract.contractNumber}`);
        } catch (error) {
          console.error('Error saving forfeited contract:', error);
          const msg = error instanceof Error ? error.message : String(error);
          alert(`❌ เกิดข้อผิดพลาดในการบันทึกสถานะหลุดจำนำลง Firebase:\n${msg}`);
          showToast(`บันทึกล้มเหลว: ${msg}`, 'error');
        }
      },
    });
    setIsSecurityOpen(true);
  };

  // Convert forfeited pawn into secondhand inventory
  const handleConfirmConvertForfeited = async (updatedContract: PawnContract, newBuyIn: SecondhandBuyIn) => {
    try {
      await syncContractToCloud(updatedContract);
      await syncSecondhandToCloud(newBuyIn);

      const updatedContracts = contracts.map(c => c.id === updatedContract.id ? updatedContract : c);
      setContracts(updatedContracts);
      saveContracts(updatedContracts);

      const updatedBuyIns = [newBuyIn, ...secondhandBuyIns];
      setSecondhandBuyIns(updatedBuyIns);
      saveSecondhandBuyIns(updatedBuyIns);

      console.log(`บันทึกแล้ว [Firestore]: contracts/${updatedContract.id} & secondhand_buyins/${newBuyIn.id}`);
      showToast(`บันทึกแล้ว [Firestore]: แปลงเป็นสินค้ามือสอง ${newBuyIn.buyInNumber}`);

      if (activeContract?.id === updatedContract.id) {
        setActiveContract(updatedContract);
      }
    } catch (error) {
      console.error('Error converting forfeited item:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`❌ เกิดข้อผิดพลาดในการแปลงสินค้าลง Firebase:\n${msg}`);
      showToast(`แปลงสินค้าล้มเหลว: ${msg}`, 'error');
    }
  };

  // 6. Save edited contract
  const handleSaveEditedContract = async (updatedContract: PawnContract) => {
    try {
      await syncContractToCloud(updatedContract);
      const updated = contracts.map(c => c.id === updatedContract.id ? updatedContract : c);
      setContracts(updated);
      saveContracts(updated);
      console.log(`บันทึกแล้ว [Firestore]: contracts/${updatedContract.id} (แก้ไขสาระสัญญา)`, updatedContract);
      showToast(`บันทึกแล้ว [Firestore]: แก้ไขสัญญา ${updatedContract.contractNumber}`);
      setActiveContract(updatedContract);
    } catch (error) {
      console.error('Error saving edited contract to Firebase:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`❌ เกิดข้อผิดพลาดในการบันทึกการแก้ไขสัญญาลง Firebase:\n${msg}`);
      showToast(`แก้ไขสัญญาล้มเหลว: ${msg}`, 'error');
    }
  };

  // 7. Save Settings
  const handleSaveSettings = async (newSettings: ShopSettings) => {
    try {
      await syncSettingsToCloud(newSettings);
      setSettings(newSettings);
      saveSettings(newSettings);
      console.log(`บันทึกแล้ว [Firestore]: settings/current`, newSettings);
      showToast('บันทึกแล้ว [Firestore]: ตั้งค่าร้านค้า');
    } catch (error) {
      console.error('Error saving settings to Firebase:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`❌ เกิดข้อผิดพลาดในการบันทึกการตั้งค่าลง Firebase:\n${msg}`);
      showToast(`บันทึกการตั้งค่าล้มเหลว: ${msg}`, 'error');
    }
  };

  const handleSaveUsers = (newUsers: UserAccount[]) => {
    setUsers(newUsers);
    saveUsers(newUsers);
  };

  // 8. Save Customer from CustomerModal
  const handleSaveCustomer = async (newOrUpdatedCust: Customer) => {
    try {
      await syncCustomerToCloud(newOrUpdatedCust);
      const exists = customers.some(c => c.id === newOrUpdatedCust.id);
      let updated: Customer[];
      if (exists) {
        updated = customers.map(c => c.id === newOrUpdatedCust.id ? newOrUpdatedCust : c);
      } else {
        updated = [newOrUpdatedCust, ...customers];
      }
      setCustomers(updated);
      saveCustomers(updated);
      console.log(`บันทึกแล้ว [Firestore]: customers/${newOrUpdatedCust.id}`, newOrUpdatedCust);
      showToast(`บันทึกแล้ว [Firestore]: ข้อมูลลูกค้า ${newOrUpdatedCust.firstName} ${newOrUpdatedCust.lastName}`);
    } catch (error) {
      console.error('Error saving customer to Firebase:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`❌ เกิดข้อผิดพลาดในการบันทึกข้อมูลลูกค้าลง Firebase:\n${msg}`);
      showToast(`บันทึกข้อมูลลูกค้าล้มเหลว: ${msg}`, 'error');
    }
  };

  return (
    <div className="h-screen max-h-screen w-full max-w-full flex flex-col font-sans bg-slate-100 overflow-hidden print:h-auto print:max-h-none print:overflow-visible print:block print:bg-white">
      {/* Top Bar Navigation */}
      <TopNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'customers') {
            setIsCustomerModalOpen(true);
          } else if (tab === 'backup') {
            setIsBackupOpen(true);
          } else if (tab === 'settings') {
            setIsSettingsOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenNewContract={() => {
          setPreselectedCustomer(null);
          setIsNewContractOpen(true);
        }}
        onOpenNewBuyIn={() => {
          setPreselectedCustomer(null);
          setIsBuyInLaptopOpen(true);
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
        secondhandCount={secondhandBuyIns.filter(i => i.status !== 'sold').length}
        currentUser={currentUser}
        allUsers={users}
        onChangeUser={handleUserChange}
        shopName={settings.shopName}
        logoUrl={settings.logoUrl}
        syncStatus={syncStatus}
      />

      {/* Main Content Area */}
      <main className={`flex-1 min-h-0 p-2 sm:p-3 max-w-[1720px] mx-auto w-full flex flex-col overflow-hidden ${isPrintOpen || isPrintBuyInOpen || isCustomerTagPrintOpen ? 'no-print' : ''}`}>
        {currentTab === 'workstation' && (
          <Workstation
            contracts={contracts}
            settings={settings}
            currentUser={currentUser}
            onOpenNewContract={() => {
              setPreselectedCustomer(null);
              setIsNewContractOpen(true);
            }}
            onOpenInterestModal={(contract) => {
              setActiveContract(contract);
              setIsInterestOpen(true);
            }}
            onOpenRedeemModal={(contract) => {
              setActiveContract(contract);
              setIsRedeemOpen(true);
            }}
            onOpenPrintModal={(contract, mode = 'half_a4') => {
              setActiveContract(contract);
              setActivePrintMode(mode);
              setActiveReceipt(undefined);
              setIsPrintOpen(true);
            }}
            onRequestEditContract={handleRequestEditContract}
            onForfeitContract={handleForfeitContract}
            onOpenConvertForfeited={(contract) => setConvertForfeitContract(contract)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenPrintCustomerTag={(contract) => {
              setTagCustomer(contract.customerSnapshot);
              setTagRelatedContract(contract);
              setTagRelatedBuyIn(null);
              setIsCustomerTagPrintOpen(true);
            }}
          />
        )}

        {currentTab === 'secondhand' && (
          <SecondhandView
            buyIns={secondhandBuyIns}
            settings={settings}
            currentUser={currentUser}
            onOpenNewBuyIn={() => {
              setPreselectedCustomer(null);
              setIsBuyInLaptopOpen(true);
            }}
            onPrintBuyIn={(item) => {
              setActiveBuyIn(item);
              setIsPrintBuyInOpen(true);
            }}
            onUpdateBuyIn={handleUpdateBuyIn}
            onOpenPrintTag={(sellerCust, item) => {
              setTagCustomer(sellerCust);
              setTagRelatedContract(null);
              setTagRelatedBuyIn(item || null);
              setIsCustomerTagPrintOpen(true);
            }}
          />
        )}

        {currentTab === 'reports' && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <ReportsView
              contracts={contracts}
              archivedContracts={archivedContracts}
              settings={settings}
            />
          </div>
        )}
      </main>

      {/* Slim Compact Bottom Status Bar */}
      <footer className="no-print shrink-0 py-1.5 px-4 sm:px-6 border-t border-slate-200 bg-white text-[11px] text-slate-500 flex justify-between items-center gap-2">
        <div className="truncate">
          <strong className="text-slate-700">{settings.shopName}</strong> · สาขา: {settings.branchName}
        </div>
        <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
          <span>โทร. {settings.phone}</span>
          <span>·</span>
          <span className="text-emerald-600 font-medium">● ระบบพร้อมใช้งาน (Ready)</span>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. New Contract Modal */}
      <NewContractModal
        isOpen={isNewContractOpen}
        onClose={() => {
          setIsNewContractOpen(false);
          setPreselectedCustomer(null);
        }}
        onSave={handleSaveNewContract}
        customers={customers}
        existingContracts={contracts}
        archivedContracts={archivedContracts}
        secondhandBuyIns={secondhandBuyIns}
        settings={settings}
        currentUser={currentUser}
        initialCustomer={preselectedCustomer}
      />

      {/* 2. Interest Payment Modal */}
      {activeContract && (
        <InterestPaymentModal
          isOpen={isInterestOpen}
          onClose={() => setIsInterestOpen(false)}
          contract={activeContract}
          settings={settings}
          currentUser={currentUser}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* 3. Redemption Modal */}
      {activeContract && (
        <RedemptionModal
          isOpen={isRedeemOpen}
          onClose={() => setIsRedeemOpen(false)}
          contract={activeContract}
          settings={settings}
          currentUser={currentUser}
          onRedeemSuccess={handleRedeemSuccess}
        />
      )}

      {/* 4. Print Ticket & Receipt Modal */}
      {activeContract && (
        <PrintTicketModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          contract={activeContract}
          settings={settings}
          defaultMode={activePrintMode}
          activeReceipt={activeReceipt}
        />
      )}

      {/* 5. AG Customer Intelligence Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        contracts={contracts}
        onSaveCustomer={handleSaveCustomer}
        onSelectContract={(targetContract, action) => {
          setActiveContract(targetContract);
          if (action === 'interest') setIsInterestOpen(true);
          else if (action === 'redeem') setIsRedeemOpen(true);
          else if (action === 'print') {
            setActivePrintMode('half_a4');
            setIsPrintOpen(true);
          }
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenPrintTag={(cust) => {
          setTagCustomer(cust);
          setTagRelatedContract(null);
          setTagRelatedBuyIn(null);
          setIsCustomerTagPrintOpen(true);
        }}
      />

      {/* 6. System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        users={users}
        onSaveSettings={handleSaveSettings}
        onSaveUsers={handleSaveUsers}
      />

      {/* 7. Backup & Archiving Modal */}
      <BackupArchiveModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        contracts={contracts}
        onDataChanged={refreshAllData}
      />

      {/* 8. Security Passcode Modal */}
      {securityAction && (
        <SecurityAuthModal
          isOpen={isSecurityOpen}
          onClose={() => {
            setIsSecurityOpen(false);
            setSecurityAction(null);
          }}
          onAuthorized={securityAction.onAuthorized}
          actionTitle={securityAction.actionTitle}
          actionDescription={securityAction.actionDescription}
          users={users}
          requiredRole="manager"
        />
      )}

      {/* 9. Authorized Edit Contract Modal */}
      {editSession && (
        <EditContractModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditSession(null);
          }}
          contract={editSession.contract}
          authorizerName={editSession.authorizerName}
          auditReason={editSession.auditReason}
          onSave={handleSaveEditedContract}
          existingContracts={contracts}
          archivedContracts={archivedContracts}
          secondhandBuyIns={secondhandBuyIns}
        />
      )}

      {/* 10. Secondhand Notebook Buy-in Modal */}
      <BuyInLaptopModal
        isOpen={isBuyInLaptopOpen}
        onClose={() => {
          setIsBuyInLaptopOpen(false);
          setPreselectedCustomer(null);
        }}
        onSave={handleSaveNewBuyIn}
        customers={customers}
        existingBuyIns={secondhandBuyIns}
        settings={settings}
        currentUser={currentUser}
        initialCustomer={preselectedCustomer}
      />

      {/* 11. Secondhand Buy-in Legal Agreement / Bill of Sale Print Modal */}
      {activeBuyIn && (
        <PrintBuyInAgreementModal
          isOpen={isPrintBuyInOpen}
          onClose={() => setIsPrintBuyInOpen(false)}
          buyIn={activeBuyIn}
          settings={settings}
        />
      )}

      {/* 12. Quick QR / Barcode Scanner Modal (สแกนจากสติกเกอร์ติดเครื่องลูกค้า) */}
      <QuickScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        customers={customers}
        contracts={contracts}
        buyIns={secondhandBuyIns}
        onSelectCustomer={(cust, contract, buyIn) => {
          setIsScannerOpen(false);
          setDossierCustomer(cust);
          if (contract) setActiveContract(contract);
          if (buyIn) setActiveBuyIn(buyIn);
          setIsCustomerDossierOpen(true);
        }}
      />

      {/* 13. Customer Dossier Modal (แสดงข้อมูลลูกค้าและเครื่องทั้งหมดหลังสแกน) */}
      {dossierCustomer && (
        <CustomerDossierModal
          isOpen={isCustomerDossierOpen}
          onClose={() => {
            setIsCustomerDossierOpen(false);
            setDossierCustomer(null);
          }}
          customer={dossierCustomer}
          contracts={contracts}
          buyIns={secondhandBuyIns}
          settings={settings}
          currentUser={currentUser}
          onOpenInterestModal={(contract) => {
            setActiveContract(contract);
            setIsInterestOpen(true);
          }}
          onOpenRedeemModal={(contract) => {
            setActiveContract(contract);
            setIsRedeemOpen(true);
          }}
          onOpenPrintContractModal={(contract) => {
            setActiveContract(contract);
            setActivePrintMode('half_a4');
            setIsPrintOpen(true);
          }}
          onOpenPrintCustomerTag={(cust, contract, buyIn) => {
            setTagCustomer(cust);
            setTagRelatedContract(contract || null);
            setTagRelatedBuyIn(buyIn || null);
            setIsCustomerTagPrintOpen(true);
          }}
          onOpenNewContractForCustomer={(cust) => {
            setPreselectedCustomer(cust);
            setIsNewContractOpen(true);
          }}
          onOpenNewBuyInForCustomer={(cust) => {
            setPreselectedCustomer(cust);
            setIsBuyInLaptopOpen(true);
          }}
          onOpenEditCustomer={(cust) => {
            setIsCustomerModalOpen(true);
          }}
        />
      )}

      {/* 14. Customer Machine Tag / QR Sticker Print Modal */}
      {tagCustomer && (
        <CustomerTagPrintModal
          isOpen={isCustomerTagPrintOpen}
          onClose={() => {
            setIsCustomerTagPrintOpen(false);
            setTagCustomer(null);
            setTagRelatedContract(null);
            setTagRelatedBuyIn(null);
          }}
          customer={tagCustomer}
          settings={settings}
          relatedContract={tagRelatedContract}
          relatedBuyIn={tagRelatedBuyIn}
        />
      )}

      {/* 15. Convert Forfeited Pawn into Secondhand Inventory Modal */}
      {convertForfeitContract && (
        <ConvertForfeitedModal
          isOpen={!!convertForfeitContract}
          onClose={() => setConvertForfeitContract(null)}
          contract={convertForfeitContract}
          currentUser={currentUser}
          existingBuyIns={secondhandBuyIns}
          onConfirmConvert={handleConfirmConvertForfeited}
          onNavigateToSecondhand={() => setCurrentTab('secondhand')}
        />
      )}

      {/* Toast Notification for Confirmation */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 no-print ${
            toast.type === 'success'
              ? 'bg-slate-900 text-emerald-300 border border-emerald-500/80 shadow-emerald-950/40'
              : 'bg-rose-950 text-rose-200 border border-rose-500 shadow-rose-950/40'
          }`}
        >
          <span className="text-base">{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-xs opacity-70 hover:opacity-100 cursor-pointer p-1 rounded"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
