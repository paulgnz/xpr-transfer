import { useWalletStore, useAccountName, useIsConnected } from '../../stores/walletStore';
import { truncateAddress } from '../../utils/format';

export function ConnectButton() {
  const { connect, disconnect, isConnecting, error, clearError } = useWalletStore();
  const accountName = useAccountName();
  const isConnected = useIsConnected();

  if (isConnecting) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-surface rounded-lg text-text-muted cursor-not-allowed"
      >
        Connecting...
      </button>
    );
  }

  if (isConnected && accountName) {
    return (
      <div className="flex items-center gap-2">
        <span className="px-3 py-2 bg-surface rounded-lg text-sm font-mono">
          {truncateAddress(accountName, 4)}
        </span>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-surface hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => {
          clearError();
          connect();
        }}
        className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors"
      >
        Connect Wallet
      </button>
      {error && (
        <span className="text-xs text-error">{error}</span>
      )}
    </div>
  );
}
