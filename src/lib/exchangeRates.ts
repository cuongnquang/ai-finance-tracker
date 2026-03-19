export type ExchangeRates = Record<string, number>;

export async function fetchExchangeRates(base: string = 'USD'): Promise<ExchangeRates> {
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    if (!res.ok) throw new Error('Failed to fetch rates');
    const data = await res.json();
    return data.rates;
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    return {};
  }
}

export function convertAmount(amount: number, from: string, to: string, rates: ExchangeRates): number {
  if (from === to || !rates[to]) return amount;
  const rate = rates[to] / rates[from];
  return Math.round(amount * rate * 100) / 100;
}

// Get symbol for currency
import { CURRENCIES, type Currency } from './currencies';

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c: Currency) => c.code === code)?.symbol || code;
}
