export type CurrencyCode = 
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' 
  | 'INR' | 'CHF' | 'SGD' | 'AED' | 'MXN' | 'BRL' 
  | 'KRW' | 'THB' | 'NZD' | 'SEK' | 'NOK' | 'ZAR';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  defaultRateToBase: number; // Rate relative to USD (USD = 1.0)
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  color: string;
  email?: string;
  isCurrentUser?: boolean;
}

export type SplitType = 'equal' | 'unequal' | 'percentage' | 'shares' | 'itemized';

export interface Payer {
  memberId: string;
  amount: number; // in expense's original currency
}

export interface LineItem {
  id: string;
  name: string;
  price: number;
  assignedMemberIds: string[];
}

export interface ExpenseSplit {
  memberId: string;
  amount: number; // calculated share in expense's original currency
  percentage?: number;
  shares?: number;
}

export type ExpenseCategory = 
  | 'dining' 
  | 'groceries' 
  | 'transport' 
  | 'accommodation' 
  | 'entertainment' 
  | 'shopping' 
  | 'utilities' 
  | 'other';

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  category: ExpenseCategory;
  originalAmount: number;
  originalCurrency: CurrencyCode;
  exchangeRateUsed: number; // originalCurrency -> group base currency multiplier
  baseAmount: number; // amount converted into group base currency
  date: string; // ISO string
  payers: Payer[];
  splitType: SplitType;
  splits: ExpenseSplit[];
  lineItems?: LineItem[];
  receiptImageUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number; // in original currency
  currency: CurrencyCode;
  exchangeRateUsed: number;
  baseAmount: number; // in group base currency
  date: string;
  notes?: string;
}

export interface SimplifiedDebt {
  fromMemberId: string;
  toMemberId: string;
  amount: number; // in group base currency
}

export interface Group {
  id: string;
  name: string;
  description: string;
  baseCurrency: CurrencyCode;
  // Custom exchange rates map relative to Base Currency (e.g. { "JPY": 152.5, "EUR": 0.92 })
  // where 1 BaseCurrency = rate CustomCurrency OR rate = BaseCurrency per 1 CustomCurrency
  customExchangeRates: Record<string, number>;
  members: Member[]; // Up to 20 users
  createdAt: string;
  icon: string;
}

export interface ScannedReceiptData {
  title: string;
  date?: string;
  totalAmount: number;
  currency: CurrencyCode;
  taxAmount?: number;
  tipAmount?: number;
  category: ExpenseCategory;
  lineItems: Array<{
    name: string;
    price: number;
    qty?: number;
  }>;
}
