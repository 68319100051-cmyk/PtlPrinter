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
  const [activePrintMode, setActivePrintMode] = useState<'slip' | 'half_a4' | 'full_contract' | 'interest_receipt' | 'redeem_receipt'>('half_a4');
  const [activeReceipt, setActiveReceipt] = useState<InterestPayment | undefined>(undefined);
  const [activeBuyIn, setActiveBuyIn] = useState<SecondhandBuyIn | null>(null);
  const [dossierCustomer, setDossierCustomer] = useState<Customer | null>(null);
  const [tagCustomer, setTagCustomer] = useState<Customer | null>(null);
  const [tagRelatedContract, setTagRelatedContract] = useState<PawnContract | null>(null);
  const [tagRelatedBuyIn, setTagRelatedBuyIn] = useState<SecondhandBuyIn | null>(null);
  const [preselectedCustomer, setPreselectedCustomer] = useState<Customer | null>(null);

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
  const handleSaveNewBuyIn = (newBuyIn: SecondhandBuyIn, newCustomer?: Customer) => {
    if (newCustomer) {
      const updatedCustomers = [newCustomer, ...customers];
      setCustomers(updatedCustomers);
      saveCustomers(updatedCustomers);
      syncCustomerToCloud(newCustomer).catch(console.error);
    }

    const updated = [newBuyIn, ...secondhandBuyIns];
    setSecondhandBuyIns(updated);
    saveSecondhandBuyIns(updated);
    syncSecondhandToCloud(newBuyIn).catch(console.error);

    // Offer to print legal buy-in agreement immediately
    setActiveBuyIn(newBuyIn);
    setIsPrintBuyInOpen(true);
  };

  const handleUpdateBuyIn = (updatedBuyIn: SecondhandBuyIn) => {
    const updated = secondhandBuyIns.map(item => item.id === updatedBuyIn.id ? updatedBuyIn : item);
    setSecondhandBuyIns(updated);
    saveSecondhandBuyIns(updated);
    syncSecondhandToCloud(updatedBuyIn).catch(console.error);
  };

  // 1. Create New Contract
  const handleSaveNewContract = (newContract: PawnContract, newCustomer?: Customer) => {
    if (newCustomer) {
      const updatedCustomers = [newCustomer, ...customers];
      setCustomers(updatedCustomers);
      saveCustomers(updatedCustomers);
      syncCustomerToCloud(newCustomer).catch(console.error);
    }

    const updatedContracts = [newContract, ...contracts];
    setContracts(updatedContracts);
    saveContracts(updatedContracts);
    syncContractToCloud(newContract).catch(console.error);

    // Prompt to print immediately
    setActiveContract(newContract);
    setActivePrintMode('half_a4');
    setIsPrintOpen(true);
  };

  // 2. Interest Payment
  const handlePaymentSuccess = (updatedContract: PawnContract, newPayment: InterestPayment) => {
    const updated = contracts.map(c => c.id === updatedContract.id ? updatedContract : c);
    setContracts(updated);
    saveContracts(updated);
    syncContractToCloud(updatedContract).catch(console.error);

    // Offer to print receipt
    setActiveContract(updatedContract);
    setActiveReceipt(newPayment);
    setActivePrintMode('interest_receipt');
    setIsPrintOpen(true);
  };

  // 3. Redeem Contract
  const handleRedeemSuccess = (updatedContract: PawnContract) => {
    const updated = contracts.map(c => c.id === updatedContract.id ? updatedContract : c);
    setContracts(updated);
    saveContracts(updated);
    syncContractToCloud(updatedContract).catch(console.error);

    // Offer to print release receipt
    setActiveContract(updatedContract);
    setActivePrintMode('redeem_receipt');
    setIsPrintOpen(true);
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
      onAuthorized: (authorizerName, reason) => {
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
        const updated = contracts.map(c => c.id === targetContract.id ? updatedContract : c);
        setContracts(updated);
        saveContracts(updated);
        syncContractToCloud(updatedContract).catch(console.error);
      },
    });
    setIsSecurityOpen(true);
  };

  // 6. Save edited contract
  const handleSaveEditedContract = (updatedContract: PawnContract) => {
    const updated = contracts.map(c => c.id === updatedContract.id ? updatedContract : c);
    setContracts(updated);
    saveContracts(updated);
    syncContractToCloud(updatedContract).catch(console.error);
    setActiveContract(updatedContract);
  };

  // 7. Save Settings
  const handleSaveSettings = (newSettings: ShopSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    syncSettingsToCloud(newSettings).catch(console.error);
  };

  const handleSaveUsers = (newUsers: UserAccount[]) => {
    setUsers(newUsers);
    saveUsers(newUsers);
  };

  // 8. Save Customer from CustomerModal
  const handleSaveCustomer = (newOrUpdatedCust: Customer) => {
    const exists = customers.some(c => c.id === newOrUpdatedCust.id);
    let updated: Customer[];
    if (exists) {
      updated = customers.map(c => c.id === newOrUpdatedCust.id ? newOrUpdatedCust : c);
    } else {
      updated = [newOrUpdatedCust, ...customers];
    }
    setCustomers(updated);
    saveCustomers(updated);
    syncCustomerToCloud(newOrUpdatedCust).catch(console.error);
  };

  return (
    <div className="h-screen max-h-screen w-full max-w-full flex flex-col font-sans bg-slate-100 overflow-hidden">
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
      <main className="flex-1 min-h-0 p-2 sm:p-3 max-w-[1720px] mx-auto w-full flex flex-col overflow-hidden">
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
    </div>
  );
}
