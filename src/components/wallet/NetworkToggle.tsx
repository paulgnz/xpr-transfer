import { useWalletStore } from '../../stores/walletStore';
import type { NetworkType } from '../../config/networks';

export function NetworkToggle() {
  const { network, setNetwork } = useWalletStore();

  const handleToggle = (newNetwork: NetworkType) => {
    if (newNetwork !== network) {
      setNetwork(newNetwork);
    }
  };

  return (
    <div className="flex bg-surface rounded-lg p-1">
      <button
        onClick={() => handleToggle('mainnet')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          network === 'mainnet'
            ? 'bg-primary text-white'
            : 'text-text-muted hover:text-text'
        }`}
      >
        Mainnet
      </button>
      <button
        onClick={() => handleToggle('testnet')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          network === 'testnet'
            ? 'bg-secondary text-white'
            : 'text-text-muted hover:text-text'
        }`}
      >
        Testnet
      </button>
    </div>
  );
}
