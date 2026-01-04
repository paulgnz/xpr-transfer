import { networks, type NetworkType } from '../config/networks';

export interface TokenBalance {
  contract: string;
  symbol: string;
  amount: string;
  decimals: number;
}

interface LightApiBalance {
  contract: string;
  amount: string;
  currency: string;
  decimals: string;
}

interface LightApiResponse {
  account_name: string;
  balances: LightApiBalance[];
}

export async function fetchAccountBalances(
  account: string,
  network: NetworkType
): Promise<TokenBalance[]> {
  const config = networks[network];

  try {
    const response = await fetch(
      `${config.lightApi}/api/balances/proton/${account}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch balances');
    }

    const data: LightApiResponse = await response.json();

    return data.balances.map((balance) => ({
      contract: balance.contract,
      symbol: balance.currency,
      amount: balance.amount,
      decimals: parseInt(balance.decimals, 10),
    }));
  } catch (error) {
    console.error('Failed to fetch account balances:', error);
    return [];
  }
}

export function parseBalance(amount: string, _decimals: number): number {
  return parseFloat(amount) || 0;
}

export function formatBalance(amount: number, decimals: number): string {
  if (amount === 0) return '0';

  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(2)}K`;
  }

  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(decimals, 4),
  });
}

export function calculateUsdValue(amount: number, price: number): number {
  return amount * price;
}

export function formatUsdValue(value: number): string {
  if (value === 0) return '$0.00';

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `$${value.toFixed(2)}`;
}
