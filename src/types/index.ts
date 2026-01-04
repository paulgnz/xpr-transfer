import type { Link, LinkSession } from '@proton/web-sdk';
import type { NetworkType } from '../config/networks';

export interface TokenConfig {
  contract: string;
  symbol: string;
  precision: number;
  name: string;
}

export interface WalletState {
  session: LinkSession | null;
  link: Link | null;
  network: NetworkType;
  isConnecting: boolean;
  error: string | null;
}

export interface WalletActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setNetwork: (network: NetworkType) => void;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export type WalletStore = WalletState & WalletActions;

export interface TransferParams {
  to: string;
  amount: string;
  token: TokenConfig;
  memo?: string;
}

export interface TransferResult {
  transactionId: string;
  blockNum: number;
}

export interface TransactionAction {
  timestamp: string;
  block_num: number;
  trx_id: string;
  act: {
    account: string;
    name: string;
    authorization: Array<{ actor: string; permission: string }>;
    data: {
      from: string;
      to: string;
      quantity: string;
      memo: string;
    };
  };
}

export interface HistoryResponse {
  actions: TransactionAction[];
  total: {
    value: number;
    relation: string;
  };
}

export interface TransferHistoryItem {
  id: string;
  timestamp: string;
  blockNum: number;
  from: string;
  to: string;
  amount: string;
  symbol: string;
  memo: string;
  direction: 'sent' | 'received';
}
