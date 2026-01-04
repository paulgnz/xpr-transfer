import { useTotalBalance, useIsLoadingBalances } from '../../stores/balanceStore';
import { useIsConnected, useAccountName } from '../../stores/walletStore';
import { formatUsdValue } from '../../services/balances';
import { NetworkToggle } from './NetworkToggle';
import { ConnectButton } from './ConnectButton';

interface WalletHeaderProps {
  onSend: () => void;
  onReceive: () => void;
  onBuy: () => void;
  onStake: () => void;
  onVote: () => void;
}

export function WalletHeader({ onSend, onReceive, onBuy, onStake, onVote }: WalletHeaderProps) {
  const isConnected = useIsConnected();
  const accountName = useAccountName();
  const totalBalance = useTotalBalance();
  const isLoading = useIsLoadingBalances();

  const handleSwap = () => {
    window.open('https://app.metalx.com/dex/XPR_XMD?referrer=protonnz', '_blank');
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white pb-6">
      <div className="px-4">
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
            {accountName && (
              <p className="text-sm text-gray-500 mt-2 font-mono">{accountName}</p>
            )}
          </div>
        )}

        {/* Action buttons */}
        {isConnected && (
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            <ActionButton icon="↗" label="Send" onClick={onSend} />
            <ActionButton icon="↓" label="Receive" onClick={onReceive} />
            <ActionButton icon="$" label="Buy" onClick={onBuy} />
            <ActionButton icon="🔒" label="Stake" onClick={onStake} />
            <ActionButton icon="🗳" label="Vote" onClick={onVote} />
            <ActionButton icon="⇄" label="Swap" onClick={handleSwap} />
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
