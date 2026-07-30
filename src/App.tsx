import React, { useState, useEffect } from 'react';
import { Expense, Group, ScannedReceiptData, Settlement } from './types';
import { INITIAL_EXPENSES, INITIAL_GROUPS, INITIAL_SETTLEMENTS } from './data/mockData';
import { MobileFrame } from './components/MobileFrame';
import { BottomNav, TabType } from './components/BottomNav';
import { GroupSelector } from './components/GroupSelector';
import { DashboardTab } from './components/DashboardTab';
import { ExpensesTab } from './components/ExpensesTab';
import { BalancesTab } from './components/BalancesTab';
import { ExchangeRatesModal } from './components/ExchangeRatesModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
import { VoiceExpenseModal } from './components/VoiceExpenseModal';
import { SettleUpModal } from './components/SettleUpModal';
import { GroupMembersModal } from './components/GroupMembersModal';
import { ExportShareModal } from './components/ExportShareModal';
import { ExpenseDetailDrawer } from './components/ExpenseDetailDrawer';
import { BackgroundSyncBanner } from './components/BackgroundSyncBanner';
import { initServiceWorker, queuePendingSyncItem } from './utils/syncManager';

export default function App() {
  // LocalStorage state management with fallback to mock data
  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('splitmate_groups');
    return saved ? JSON.parse(saved) : INITIAL_GROUPS;
  });

  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    const saved = localStorage.getItem('splitmate_active_group_id');
    return saved || INITIAL_GROUPS[0].id;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('splitmate_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [settlements, setSettlements] = useState<Settlement[]>(() => {
    const saved = localStorage.getItem('splitmate_settlements');
    return saved ? JSON.parse(saved) : INITIAL_SETTLEMENTS;
  });

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Modal & Drawer states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);

  const [isScanReceiptOpen, setIsScanReceiptOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [settleFromId, setSettleFromId] = useState<string | undefined>(undefined);
  const [settleToId, setSettleToId] = useState<string | undefined>(undefined);
  const [settleAmount, setSettleAmount] = useState<number | undefined>(undefined);

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedExpenseDetail, setSelectedExpenseDetail] = useState<Expense | null>(null);

  // Initialize Service Worker with Background Sync support
  useEffect(() => {
    initServiceWorker();
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('splitmate_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('splitmate_active_group_id', activeGroupId);
  }, [activeGroupId]);

  useEffect(() => {
    localStorage.setItem('splitmate_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('splitmate_settlements', JSON.stringify(settlements));
  }, [settlements]);

  // Active Group
  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  // Active Group Expenses
  const groupExpenses = expenses.filter((e) => e.groupId === activeGroup.id);
  const groupSettlements = settlements.filter((s) => s.groupId === activeGroup.id);

  // Handle Save Expense
  const handleSaveExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    if (editingExpense) {
      // Edit existing
      const updatedExp = { ...expenseData, id: editingExpense.id, createdAt: editingExpense.createdAt };
      setExpenses(
        expenses.map((exp) => (exp.id === editingExpense.id ? updatedExp : exp))
      );
      queuePendingSyncItem('EDIT_EXPENSE', updatedExp);
      setEditingExpense(undefined);
    } else {
      // Create new
      const newExp: Expense = {
        ...expenseData,
        id: `exp_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setExpenses([newExp, ...expenses]);
      queuePendingSyncItem('ADD_EXPENSE', newExp);
    }
    setIsAddExpenseOpen(false);
  };

  // Handle Delete Expense
  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter((e) => e.id !== expenseId));
    queuePendingSyncItem('DELETE_EXPENSE', { id: expenseId });
    if (selectedExpenseDetail?.id === expenseId) {
      setSelectedExpenseDetail(null);
    }
  };

  // Handle Save Settlement
  const handleSaveSettlement = (settlementData: Omit<Settlement, 'id'>) => {
    const newSettlement: Settlement = {
      ...settlementData,
      id: `settle_${Date.now()}`,
    };
    setSettlements([newSettlement, ...settlements]);
    queuePendingSyncItem('ADD_SETTLEMENT', newSettlement);
    setIsSettleUpOpen(false);
  };

  // Handle Group Update
  const handleUpdateGroup = (updatedGroup: Group) => {
    setGroups(groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
  };

  // Handle Custom Exchange Rates Update
  const handleUpdateGroupRates = (customExchangeRates: Record<string, number>) => {
    const updated = { ...activeGroup, customExchangeRates };
    handleUpdateGroup(updated);
  };

  // Handle Create New Group
  const handleCreateNewGroup = () => {
    const newGroupId = `g_${Date.now()}`;
    const newG: Group = {
      id: newGroupId,
      name: `New Group ${groups.length + 1}`,
      description: 'Group expenses & bill splitting',
      baseCurrency: 'USD',
      customExchangeRates: {},
      members: activeGroup.members.slice(0, 4),
      createdAt: new Date().toISOString(),
      icon: '🌴',
    };
    setGroups([...groups, newG]);
    setActiveGroupId(newGroupId);
  };

  // Handle Scanned Receipt Transfer to Add Expense Modal
  const handleUseScannedData = (scannedData: ScannedReceiptData, imageBase64?: string) => {
    setIsScanReceiptOpen(false);

    // Build partial expense object
    const partial: Partial<Expense> = {
      title: scannedData.title,
      category: scannedData.category,
      originalAmount: scannedData.totalAmount,
      originalCurrency: scannedData.currency,
      date: scannedData.date ? new Date(scannedData.date).toISOString() : new Date().toISOString(),
      receiptImageUrl: imageBase64,
      notes: scannedData.lineItems.map((item) => `${item.name}: ${item.price}`).join(', '),
    };

    setEditingExpense(undefined);
    // Pre-fill Add Expense modal
    setEditingExpense(partial as any);
    setIsAddExpenseOpen(true);
  };

  return (
    <MobileFrame>
      {/* Background Sync Banner */}
      <BackgroundSyncBanner />

      {/* Top Header / Group Selector */}
      <GroupSelector
        groups={groups}
        activeGroup={activeGroup}
        onSelectGroup={(id) => setActiveGroupId(id)}
        onOpenCreateGroup={handleCreateNewGroup}
        onOpenMembersModal={() => setIsMembersModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Main Tab Views */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-900">
        {activeTab === 'dashboard' && (
          <DashboardTab
            group={activeGroup}
            expenses={groupExpenses}
            settlements={groupSettlements}
            onOpenAddExpense={() => {
              setEditingExpense(undefined);
              setIsAddExpenseOpen(true);
            }}
            onOpenScanReceipt={() => setIsScanReceiptOpen(true)}
            onOpenVoiceExpense={() => setIsVoiceModalOpen(true)}
            onOpenSettleUp={(fromId, toId, amt) => {
              setSettleFromId(fromId);
              setSettleToId(toId);
              setSettleAmount(amt);
              setIsSettleUpOpen(true);
            }}
            onOpenMembers={() => setIsMembersModalOpen(true)}
            onSelectExpense={(exp) => setSelectedExpenseDetail(exp)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            group={activeGroup}
            expenses={groupExpenses}
            onOpenAddExpense={() => {
              setEditingExpense(undefined);
              setIsAddExpenseOpen(true);
            }}
            onOpenScanReceipt={() => setIsScanReceiptOpen(true)}
            onOpenVoiceExpense={() => setIsVoiceModalOpen(true)}
            onSelectExpense={(exp) => setSelectedExpenseDetail(exp)}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'scan' && (
          <div className="flex-1 p-4">
            <ReceiptScannerModal
              group={activeGroup}
              onClose={() => setActiveTab('dashboard')}
              onUseScannedData={handleUseScannedData}
            />
          </div>
        )}

        {activeTab === 'balances' && (
          <BalancesTab
            group={activeGroup}
            expenses={groupExpenses}
            settlements={groupSettlements}
            onOpenSettleUp={(fromId, toId, amt) => {
              setSettleFromId(fromId);
              setSettleToId(toId);
              setSettleAmount(amt);
              setIsSettleUpOpen(true);
            }}
          />
        )}

        {activeTab === 'rates' && (
          <ExchangeRatesModal group={activeGroup} onUpdateGroupRates={handleUpdateGroupRates} />
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        onOpenVoiceExpense={() => setIsVoiceModalOpen(true)}
      />

      {/* Modals */}
      {isAddExpenseOpen && (
        <AddExpenseModal
          group={activeGroup}
          initialData={editingExpense}
          onClose={() => {
            setIsAddExpenseOpen(false);
            setEditingExpense(undefined);
          }}
          onSaveExpense={handleSaveExpense}
        />
      )}

      {isVoiceModalOpen && (
        <VoiceExpenseModal
          group={activeGroup}
          onClose={() => setIsVoiceModalOpen(false)}
          onSaveExpense={(data) => {
            handleSaveExpense(data);
            setIsVoiceModalOpen(false);
          }}
          onEditInFullModal={(partial) => {
            setIsVoiceModalOpen(false);
            setEditingExpense(partial as any);
            setIsAddExpenseOpen(true);
          }}
        />
      )}

      {isScanReceiptOpen && activeTab !== 'scan' && (
        <ReceiptScannerModal
          group={activeGroup}
          onClose={() => setIsScanReceiptOpen(false)}
          onUseScannedData={handleUseScannedData}
        />
      )}

      {isSettleUpOpen && (
        <SettleUpModal
          group={activeGroup}
          initialFromId={settleFromId}
          initialToId={settleToId}
          initialAmount={settleAmount}
          onClose={() => setIsSettleUpOpen(false)}
          onSaveSettlement={handleSaveSettlement}
        />
      )}

      {isMembersModalOpen && (
        <GroupMembersModal
          group={activeGroup}
          onClose={() => setIsMembersModalOpen(false)}
          onUpdateGroup={handleUpdateGroup}
        />
      )}

      {isShareModalOpen && (
        <ExportShareModal
          group={activeGroup}
          expenses={groupExpenses}
          settlements={groupSettlements}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {selectedExpenseDetail && (
        <ExpenseDetailDrawer
          expense={selectedExpenseDetail}
          group={activeGroup}
          onClose={() => setSelectedExpenseDetail(null)}
          onEditExpense={(exp) => {
            setSelectedExpenseDetail(null);
            setEditingExpense(exp);
            setIsAddExpenseOpen(true);
          }}
          onDeleteExpense={(id) => {
            handleDeleteExpense(id);
            setSelectedExpenseDetail(null);
          }}
        />
      )}
    </MobileFrame>
  );
}
