import { useTotalBalance, useIsLoadingBalances } from '../../stores/balanceStore';
import { useIsConnected } from '../../stores/walletStore';
import { formatUsdValue } from '../../services/balances';
import { NetworkToggle } from './NetworkToggle';
import { ConnectButton } from './ConnectButton';

interface WalletHeaderProps {
  onSend: () => void;
  onReceive: () => void;
}

export function WalletHeader({ onSend, onReceive }: WalletHeaderProps) {
  const isConnected = useIsConnected();
  const totalBalance = useTotalBalance();
  const isLoading = useIsLoadingBalances();

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white pb-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4">
          <NetworkToggle />
          <ConnectButton />
        </div>

        {/* Balance display */}
        {isConnected && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 mb-1">Tokens balance</p>
            <h2 className="text-4xl font-bold">
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                formatUsdValue(totalBalance)
              )}
            </h2>
          </div>
        )}

        {/* Action buttons */}
        {isConnected && (
          <div className="flex justify-center gap-6 mt-4">
            <ActionButton icon="↗" label="Send" onClick={onSend} />
            <ActionButton icon="↓" label="Receive" onClick={onReceive} />
            <ActionButton icon="$" label="Buy" onClick={() => window.open('https://www.metalx.com', '_blank')} />
            <ActionButton icon="⇄" label="Swap" onClick={() => window.open('https://www.metalx.com/swap', '_blank')} />
          </div>
        )}

        {/* Not connected state */}
        {!isConnected && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">XPR Transfer</h2>
            <p className="text-gray-400">Connect your wallet to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
    >
      <div className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-lg transition-colors">
        {icon}
      </div>
      <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
        {label}
      </span>
    </button>
  );
}
