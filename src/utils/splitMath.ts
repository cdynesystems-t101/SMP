import { Expense, Group, Member, Settlement, SimplifiedDebt } from '../types';
import { getExchangeRate } from '../data/currencies';

export interface MemberBalanceSummary {
  member: Member;
  totalPaidBase: number;
  totalOwedBase: number;
  netBalanceBase: number; // positive = owed to member, negative = owes group
}

/**
 * Calculates net balances in group base currency for every group member.
 * Runs 100% offline without external server dependencies.
 */
export const calculateGroupBalances = (
  group: Group,
  expenses: Expense[],
  settlements: Settlement[]
): MemberBalanceSummary[] => {
  const memberMap = new Map<string, MemberBalanceSummary>();

  // Initialize balance sheet for all group members (up to 20 members)
  group.members.forEach((m) => {
    memberMap.set(m.id, {
      member: m,
      totalPaidBase: 0,
      totalOwedBase: 0,
      netBalanceBase: 0,
    });
  });

  // 1. Process Expenses
  expenses.forEach((expense) => {
    if (expense.groupId !== group.id) return;

    const rate = expense.exchangeRateUsed || getExchangeRate(expense.originalCurrency, group.baseCurrency, group.customExchangeRates);

    // Add paid amounts
    expense.payers.forEach((payer) => {
      const entry = memberMap.get(payer.memberId);
      if (entry) {
        const paidInBase = payer.amount * rate;
        entry.totalPaidBase += paidInBase;
      }
    });

    // Add owed split amounts
    expense.splits.forEach((split) => {
      const entry = memberMap.get(split.memberId);
      if (entry) {
        const owedInBase = split.amount * rate;
        entry.totalOwedBase += owedInBase;
      }
    });
  });

  // 2. Process Direct Settlements
  settlements.forEach((settlement) => {
    if (settlement.groupId !== group.id) return;

    const rate = settlement.exchangeRateUsed || getExchangeRate(settlement.currency, group.baseCurrency, group.customExchangeRates);
    const amountInBase = settlement.amount * rate;

    // Sender paid money (reduces their debt / increases their credit)
    const sender = memberMap.get(settlement.fromMemberId);
    if (sender) {
      sender.totalPaidBase += amountInBase;
    }

    // Receiver received money (reduces their credit)
    const receiver = memberMap.get(settlement.toMemberId);
    if (receiver) {
      receiver.totalOwedBase += amountInBase;
    }
  });

  // 3. Compute Net Balances
  const summaries: MemberBalanceSummary[] = [];
  memberMap.forEach((summary) => {
    summary.netBalanceBase = Math.round((summary.totalPaidBase - summary.totalOwedBase) * 100) / 100;
    summary.totalPaidBase = Math.round(summary.totalPaidBase * 100) / 100;
    summary.totalOwedBase = Math.round(summary.totalOwedBase * 100) / 100;
    summaries.push(summary);
  });

  return summaries;
};

/**
 * Greedy Debt Simplification Algorithm (Min Cash Flow).
 * Reduces N*N pairwise debts down to at most N-1 simple direct payments.
 */
export const simplifyGroupDebts = (
  balances: MemberBalanceSummary[]
): SimplifiedDebt[] => {
  const debtors: { memberId: string; amountOwed: number }[] = [];
  const creditors: { memberId: string; amountOwedToMe: number }[] = [];

  balances.forEach((b) => {
    if (b.netBalanceBase < -0.009) {
      debtors.push({ memberId: b.member.id, amountOwed: Math.abs(b.netBalanceBase) });
    } else if (b.netBalanceBase > 0.009) {
      creditors.push({ memberId: b.member.id, amountOwedToMe: b.netBalanceBase });
    }
  });

  // Sort descending by amount
  debtors.sort((a, b) => b.amountOwed - a.amountOwed);
  creditors.sort((a, b) => b.amountOwedToMe - a.amountOwedToMe);

  const simplified: SimplifiedDebt[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const transfer = Math.min(debtor.amountOwed, creditor.amountOwedToMe);
    const roundedTransfer = Math.round(transfer * 100) / 100;

    if (roundedTransfer > 0) {
      simplified.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amount: roundedTransfer,
      });
    }

    debtor.amountOwed -= transfer;
    creditor.amountOwedToMe -= transfer;

    if (debtor.amountOwed < 0.009) i++;
    if (creditor.amountOwedToMe < 0.009) j++;
  }

  return simplified;
};

/**
 * Helper to calculate equal splits among selected members
 */
export const calculateEqualSplits = (
  totalAmount: number,
  selectedMemberIds: string[]
) => {
  if (selectedMemberIds.length === 0 || totalAmount <= 0) return [];

  const sharePerPerson = Math.floor((totalAmount / selectedMemberIds.length) * 100) / 100;
  let remainder = Math.round((totalAmount - sharePerPerson * selectedMemberIds.length) * 100) / 100;

  return selectedMemberIds.map((id, index) => {
    let amount = sharePerPerson;
    if (remainder > 0.001) {
      amount += 0.01;
      remainder = Math.round((remainder - 0.01) * 100) / 100;
    }
    return {
      memberId: id,
      amount: Math.round(amount * 100) / 100,
    };
  });
};
