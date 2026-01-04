import { networks, type NetworkType } from '../config/networks';
import type { HistoryResponse, TransferHistoryItem, TransactionAction } from '../types';
import tokens from '../config/tokens.json';

function parseQuantity(quantity: string): { amount: string; symbol: string } {
  const parts = quantity.split(' ');
  if (parts.length !== 2) {
    return { amount: quantity, symbol: '' };
  }
  return { amount: parts[0], symbol: parts[1] };
}

function mapActionToHistoryItem(
  action: TransactionAction,
  account: string
): TransferHistoryItem {
  const { amount, symbol } = parseQuantity(action.act.data.quantity);
  const direction = action.act.data.from === account ? 'sent' : 'received';

  return {
    id: action.trx_id,
    timestamp: action.timestamp,
    blockNum: action.block_num,
    from: action.act.data.from,
    to: action.act.data.to,
    amount,
    symbol,
    memo: action.act.data.memo || '',
    direction,
  };
}

function buildFilterString(): string {
  const contracts = [...new Set(tokens.map((t) => t.contract))];
  return contracts.map((c) => `${c}:transfer`).join(',');
}

export async function fetchTransferHistory(
  account: string,
  network: NetworkType,
  options: {
    limit?: number;
    skip?: number;
  } = {}
): Promise<{ transfers: TransferHistoryItem[]; total: number }> {
  const { limit = 20, skip = 0 } = options;
  const config = networks[network];
  const filter = buildFilterString();

  const params = new URLSearchParams({
    account,
    filter,
    limit: limit.toString(),
    skip: skip.toString(),
    sort: 'desc',
  });

  const url = `${config.hyperion}/v2/history/get_actions?${params}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch transaction history: ${response.statusText}`);
  }

  const data: HistoryResponse = await response.json();

  const transfers = data.actions
    .filter((action) => action.act.name === 'transfer' && action.act.data)
    .map((action) => mapActionToHistoryItem(action, account));

  return {
    transfers,
    total: data.total?.value || 0,
  };
}

export async function fetchTransaction(
  transactionId: string,
  network: NetworkType
): Promise<TransactionAction[]> {
  const config = networks[network];
  const url = `${config.hyperion}/v2/history/get_transaction?id=${transactionId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch transaction: ${response.statusText}`);
  }

  const data = await response.json();
  return data.actions || [];
}
