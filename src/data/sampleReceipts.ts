import { ScannedReceiptData } from '../types';

export interface SampleReceipt {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  data: ScannedReceiptData;
}

export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'rec_tokyo',
    name: 'Shibuya Ramen Izakaya',
    subtitle: 'Tokyo, Japan • 18,400 JPY',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
    data: {
      title: 'Shibuya Ramen & Draft Izakaya',
      date: '2026-07-24',
      totalAmount: 18400,
      currency: 'JPY',
      taxAmount: 1672,
      tipAmount: 0,
      category: 'dining',
      lineItems: [
        { name: 'Tonkotsu Special Ramen x3', price: 4200 },
        { name: 'Spicy Miso Ramen x2', price: 2800 },
        { name: 'Pan-fried Pork Gyoza (12pcs)', price: 1600 },
        { name: 'Asahi Super Dry Draft Beer x5', price: 3750 },
        { name: 'Highball Whiskey x4', price: 3200 },
        { name: 'Edamame & Tsukemono', price: 1180 },
      ],
    },
  },
  {
    id: 'rec_paris',
    name: 'Bistro Le Marais',
    subtitle: 'Paris, France • €168.50',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    data: {
      title: 'Bistro Le Marais Paris',
      date: '2026-07-22',
      totalAmount: 168.5,
      currency: 'EUR',
      taxAmount: 15.3,
      tipAmount: 10.0,
      category: 'dining',
      lineItems: [
        { name: 'Steak Frites Sauce Bearnaise x2', price: 56.0 },
        { name: 'Duck Confit with Roast Potatoes', price: 26.5 },
        { name: 'French Onion Soup x3', price: 31.5 },
        { name: 'Bordeaux Red Wine Bottle', price: 38.0 },
        { name: 'Espresso & Creme Brulee x2', price: 16.5 },
      ],
    },
  },
  {
    id: 'rec_groceries',
    name: 'Organic Supermarket',
    subtitle: 'London, UK • £84.20',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
    data: {
      title: 'Whole Foods Market London',
      date: '2026-07-25',
      totalAmount: 84.2,
      currency: 'GBP',
      taxAmount: 6.2,
      tipAmount: 0,
      category: 'groceries',
      lineItems: [
        { name: 'Organic Artisan Bread & Pastries', price: 12.4 },
        { name: 'Fresh Fruit Basket & Berries', price: 18.5 },
        { name: 'Cheeses & Charcuterie Platter', price: 24.8 },
        { name: 'Sparkling Mineral Water (6x)', price: 9.5 },
        { name: 'Snack Mix & Chocolate Bars', price: 19.0 },
      ],
    },
  },
];
