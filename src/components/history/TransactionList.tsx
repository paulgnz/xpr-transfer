import { useEffect, useState, useCallback } from 'react';
import { useWalletStore, useAccountName, useIsConnected } from '../../stores/walletStore';
import { fetchTransferHistory } from '../../services/history';
import { TransactionRow } from './TransactionRow';
import type { TransferHistoryItem } from '../../types';

const PAGE_SIZE = 10;

export function TransactionList() {
  const network = useWalletStore((state) => state.network);
  const accountName = useAccountName();
  const isConnected = useIsConnected();

  const [transactions, setTransactions] = useState<TransferHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async (pageNum: number) => {
    if (!accountName) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchTransferHistory(accountName, network, {
        limit: PAGE_SIZE,
        skip: pageNum * PAGE_SIZE,
      });
      setTransactions(result.transfers);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [accountName, network]);

  useEffect(() => {
    if (isConnected && accountName) {
      setPage(0);
      loadTransactions(0);
    } else {
      setTransactions([]);
      setTotal(0);
    }
  }, [isConnected, accountName, network, loadTransactions]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadTransactions(newPage);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-surface rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text">Transaction History</h2>
        <button
          onClick={() => loadTransactions(page)}
          disabled={isLoading}
          className="text-sm text-secondary hover:underline disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {isLoading && transactions.length === 0 && (
        <div className="py-8 text-center text-text-muted">Loading...</div>
      )}

      {error && (
        <div className="py-4 text-center text-error text-sm">{error}</div>
      )}

      {!isLoading && !error && transactions.length === 0 && (
        <div className="py-8 text-center text-text-muted">
          No transactions found
        </div>
      )}

      {transactions.length > 0 && (
        <>
          <div className={isLoading ? 'opacity-50' : ''}>
            {transactions.map((tx) => (
              <TransactionRow key={`${tx.id}-${tx.from}-${tx.to}`} transaction={tx} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0 || isLoading}
                className="px-3 py-1.5 text-sm bg-background rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-text-muted">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1 || isLoading}
                className="px-3 py-1.5 text-sm bg-background rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
