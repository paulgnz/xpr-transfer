import type { TransferHistoryItem } from '../../types';
import { formatRelativeTime, truncateAddress, formatAmount, getExplorerTxUrl } from '../../utils/format';
import { networks } from '../../config/networks';
import { useWalletStore } from '../../stores/walletStore';

interface TransactionRowProps {
  transaction: TransferHistoryItem;
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const network = useWalletStore((state) => state.network);
  const explorerUrl = networks[network].explorerUrl;

  const isSent = transaction.direction === 'sent';

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
            isSent
              ? 'bg-error/10 text-error'
              : 'bg-success/10 text-success'
          }`}
        >
          {isSent ? '-' : '+'}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text">
            {isSent ? 'Sent to ' : 'Received from '}
            <span className="font-mono">
              {truncateAddress(isSent ? transaction.to : transaction.from, 4)}
            </span>
          </span>
          <span className="text-xs text-text-muted">
            {formatRelativeTime(transaction.timestamp)}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span
          className={`text-sm font-medium ${
            isSent ? 'text-error' : 'text-success'
          }`}
        >
          {isSent ? '-' : '+'}
          {formatAmount(transaction.amount)} {transaction.symbol}
        </span>
        <a
          href={getExplorerTxUrl(transaction.id, explorerUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-secondary hover:underline"
        >
          View
        </a>
      </div>
    </div>
  );
}
