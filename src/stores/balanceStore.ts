import { create } from 'zustand';
import { fetchAccountBalances, type TokenBalance, calculateUsdValue } from '../services/balances';
import { fetchTokenMetadata, fetchTokenPrices } from '../services/tokens';
import type { NetworkType } from '../config/networks';

export interface TokenWithBalance {
  contract: string;
  symbol: string;
  name: string;
  logo: string;
  balance: number;
  decimals: number;
  price: number;
  usdValue: number;
}

interface BalanceState {
  tokens: TokenWithBalance[];
  totalUsdValue: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface BalanceActions {
  fetchBalances: (account: string, network: NetworkType) => Promise<void>;
  clearBalances: () => void;
}

type BalanceStore = BalanceState & BalanceActions;

const initialState: BalanceState = {
  tokens: [],
  totalUsdValue: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const useBalanceStore = create<BalanceStore>()((set) => ({
  ...initialState,

  fetchBalances: async (account: string, network: NetworkType) => {
    set({ isLoading: true, error: null });

    try {
      // Fetch token metadata and balances in parallel
      const [tokenMetadata, balances] = await Promise.all([
        fetchTokenMetadata(network),
        fetchAccountBalances(account, network),
      ]);

      // Fetch prices
      const prices = await fetchTokenPrices(tokenMetadata);

      // Create a map of balances by contract:symbol
      const balanceMap = new Map<string, TokenBalance>();
      balances.forEach((b) => {
        balanceMap.set(`${b.contract}:${b.symbol}`, b);
      });

      // Merge token metadata with balances
      const tokensWithBalance: TokenWithBalance[] = [];

      // First add tokens that have balances
      balances.forEach((balance) => {
        const key = `${balance.contract}:${balance.symbol}`;
        const metadata = tokenMetadata.find(
          (t) => t.contract === balance.contract && t.symbol === balance.symbol
        );

        const price = prices.get(key) || 0;
        const balanceAmount = parseFloat(balance.amount) || 0;
        const usdValue = calculateUsdValue(balanceAmount, price);

        tokensWithBalance.push({
          contract: balance.contract,
          symbol: balance.symbol,
          name: metadata?.name || balance.symbol,
          logo: metadata?.logo || '',
          balance: balanceAmount,
          decimals: balance.decimals,
          price,
          usdValue,
        });
      });

      // Sort by USD value (highest first)
      tokensWithBalance.sort((a, b) => b.usdValue - a.usdValue);

      // Calculate total USD value
      const totalUsdValue = tokensWithBalance.reduce((sum, t) => sum + t.usdValue, 0);

      set({
        tokens: tokensWithBalance,
        totalUsdValue,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balances',
      });
    }
  },

  clearBalances: () => {
    set(initialState);
  },
}));

export const useTokenBalances = () => useBalanceStore((state) => state.tokens);
export const useTotalBalance = () => useBalanceStore((state) => state.totalUsdValue);
export const useIsLoadingBalances = () => useBalanceStore((state) => state.isLoading);
