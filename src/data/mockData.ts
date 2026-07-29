import { Expense, Group, Member, Settlement } from '../types';

export const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', color: '#6366F1', isCurrentUser: true, email: 'alex@example.com' },
  { id: 'm2', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200', color: '#EC4899', email: 'sarah@example.com' },
  { id: 'm3', name: 'Jordan Taylor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', color: '#10B981', email: 'jordan@example.com' },
  { id: 'm4', name: 'Maya Patel', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', color: '#F59E0B', email: 'maya@example.com' },
  { id: 'm5', name: 'Carlos Gomez', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', color: '#8B5CF6', email: 'carlos@example.com' },
  { id: 'm6', name: 'Emily Zhang', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200', color: '#06B6D4', email: 'emily@example.com' },
  { id: 'm7', name: 'Kenji Sato', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200', color: '#EF4444', email: 'kenji@example.com' },
];

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Tokyo Trip 2026',
    description: '10 days in Shibuya, Kyoto & Osaka with 7 friends',
    baseCurrency: 'USD',
    customExchangeRates: {
      JPY: 155.0,
      EUR: 0.92,
      GBP: 0.78,
    },
    members: INITIAL_MEMBERS,
    createdAt: '2026-07-15T10:00:00Z',
    icon: '✈️',
  },
  {
    id: 'g2',
    name: 'Apartment 4B Roommates',
    description: 'Shared monthly rent, utilities & household items',
    baseCurrency: 'USD',
    customExchangeRates: {},
    members: INITIAL_MEMBERS.slice(0, 4),
    createdAt: '2026-06-01T10:00:00Z',
    icon: '🏠',
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e1',
    groupId: 'g1',
    title: 'Izakaya Welcome Dinner in Shinjuku',
    category: 'dining',
    originalAmount: 38750,
    originalCurrency: 'JPY',
    exchangeRateUsed: 1 / 155.0, // 1 JPY = 0.00645 USD
    baseAmount: 250.0,
    date: '2026-07-20T19:30:00Z',
    payers: [{ memberId: 'm1', amount: 38750 }], // Alex paid all
    splitType: 'equal',
    splits: [
      { memberId: 'm1', amount: 5535.71 },
      { memberId: 'm2', amount: 5535.71 },
      { memberId: 'm3', amount: 5535.71 },
      { memberId: 'm4', amount: 5535.71 },
      { memberId: 'm5', amount: 5535.71 },
      { memberId: 'm6', amount: 5535.71 },
      { memberId: 'm7', amount: 5535.71 },
    ],
    notes: 'Yakitori, draft beer, highballs and sashimi set',
    createdAt: '2026-07-20T21:00:00Z',
  },
  {
    id: 'e2',
    groupId: 'g1',
    title: 'Shinkansen Bullet Train Tickets (Tokyo to Kyoto)',
    category: 'transport',
    originalAmount: 92400,
    originalCurrency: 'JPY',
    exchangeRateUsed: 1 / 155.0,
    baseAmount: 596.13,
    date: '2026-07-22T08:15:00Z',
    payers: [{ memberId: 'm2', amount: 92400 }], // Sarah paid
    splitType: 'equal',
    splits: [
      { memberId: 'm1', amount: 13200 },
      { memberId: 'm2', amount: 13200 },
      { memberId: 'm3', amount: 13200 },
      { memberId: 'm4', amount: 13200 },
      { memberId: 'm5', amount: 13200 },
      { memberId: 'm6', amount: 13200 },
      { memberId: 'm7', amount: 13200 },
    ],
    notes: 'Reserved seats on Nozomi Express',
    createdAt: '2026-07-22T09:00:00Z',
  },
  {
    id: 'e3',
    groupId: 'g1',
    title: 'Kyoto Ryokan Villa Accommodation',
    category: 'accommodation',
    originalAmount: 1200,
    originalCurrency: 'USD',
    exchangeRateUsed: 1.0,
    baseAmount: 1200.0,
    date: '2026-07-23T15:00:00Z',
    payers: [
      { memberId: 'm3', amount: 700 }, // Jordan paid $700
      { memberId: 'm4', amount: 500 }, // Maya paid $500
    ],
    splitType: 'equal',
    splits: [
      { memberId: 'm1', amount: 171.43 },
      { memberId: 'm2', amount: 171.43 },
      { memberId: 'm3', amount: 171.43 },
      { memberId: 'm4', amount: 171.43 },
      { memberId: 'm5', amount: 171.43 },
      { memberId: 'm6', amount: 171.43 },
      { memberId: 'm7', amount: 171.43 },
    ],
    notes: 'Traditional Japanese villa with private garden & matcha set',
    createdAt: '2026-07-23T16:00:00Z',
  },
  {
    id: 'e4',
    groupId: 'g1',
    title: '7-Eleven Snacks & Drinks',
    category: 'groceries',
    originalAmount: 7750,
    originalCurrency: 'JPY',
    exchangeRateUsed: 1 / 155.0,
    baseAmount: 50.0,
    date: '2026-07-24T11:00:00Z',
    payers: [{ memberId: 'm5', amount: 7750 }], // Carlos paid
    splitType: 'unequal',
    splits: [
      { memberId: 'm1', amount: 1550 },
      { memberId: 'm2', amount: 1550 },
      { memberId: 'm3', amount: 1550 },
      { memberId: 'm5', amount: 3100 }, // Carlos had extra items
    ],
    notes: 'Egg sandwiches, iced matcha, pork buns',
    createdAt: '2026-07-24T11:30:00Z',
  }
];

export const INITIAL_SETTLEMENTS: Settlement[] = [
  {
    id: 's1',
    groupId: 'g1',
    fromMemberId: 'm1',
    toMemberId: 'm2',
    amount: 100,
    currency: 'USD',
    exchangeRateUsed: 1.0,
    baseAmount: 100,
    date: '2026-07-23T18:00:00Z',
    notes: 'Venmo payback for Shinkansen train ticket',
  },
];
