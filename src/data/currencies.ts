import { Currency, CurrencyCode } from '../types';

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', defaultRateToBase: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', defaultRateToBase: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', defaultRateToBase: 0.78 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', defaultRateToBase: 155.0 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', defaultRateToBase: 1.38 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', defaultRateToBase: 1.52 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', defaultRateToBase: 84.5 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', defaultRateToBase: 0.88 },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', flag: '🇸🇬', defaultRateToBase: 1.35 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', defaultRateToBase: 3.67 },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽', defaultRateToBase: 18.2 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', defaultRateToBase: 5.45 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷', defaultRateToBase: 1380.0 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭', defaultRateToBase: 36.5 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', defaultRateToBase: 1.65 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪', defaultRateToBase: 10.8 },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴', defaultRateToBase: 10.9 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', defaultRateToBase: 18.1 },
];

export const getCurrencyDetails = (code: CurrencyCode | string): Currency => {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  if (found) return found;
  return {
    code: (code as CurrencyCode) || 'USD',
    symbol: '$',
    name: code || 'USD',
    flag: '🌐',
    defaultRateToBase: 1.0,
  };
};

/**
 * Calculates conversion factor from foreign currency to base currency.
 * Returns how many Base Currency units 1 Foreign Currency unit is worth.
 */
export const getExchangeRate = (
  foreignCurrency: CurrencyCode,
  baseCurrency: CurrencyCode,
  customRates?: Record<string, number>
): number => {
  if (foreignCurrency === baseCurrency) return 1.0;

  // Check if group has a custom direct rate override specified
  if (customRates && customRates[`${foreignCurrency}_${baseCurrency}`]) {
    return customRates[`${foreignCurrency}_${baseCurrency}`];
  }

  // Calculate using default USD base rates or custom rate mapping
  const foreignObj = getCurrencyDetails(foreignCurrency);
  const baseObj = getCurrencyDetails(baseCurrency);

  const foreignUsdRate = customRates?.[foreignCurrency] ?? foreignObj.defaultRateToBase;
  const baseUsdRate = customRates?.[baseCurrency] ?? baseObj.defaultRateToBase;

  if (foreignUsdRate === 0 || baseUsdRate === 0) return 1.0;

  // Foreign -> USD -> Base
  return baseUsdRate / foreignUsdRate;
};
