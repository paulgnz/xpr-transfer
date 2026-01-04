import { useState } from 'react';
import { useAccountName } from '../../stores/walletStore';

const SUPPORTED_TOKENS = [
  { symbol: 'XPR', name: 'XPR Network', icon: '💜' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'USDC', name: 'USD Coin', icon: '$' },
];

export function BuyContent() {
  const accountName = useAccountName();
  const [selectedToken, setSelectedToken] = useState('XPR');

  const handleBuyWithMetalPay = () => {
    // Metal Pay deep link with XPR Network wallet address
    const metalPayUrl = `https://app.metalpay.com/buy?asset=${selectedToken}&address=${accountName || ''}`;
    window.open(metalPayUrl, '_blank');
  };

  const handleBuyOnMetalX = () => {
    window.open('https://app.metalx.com/trade', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Token selection */}
      <div>
        <label className="text-sm font-medium text-text-muted mb-2 block">
          Select token to buy
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_TOKENS.map((token) => (
            <button
              key={token.symbol}
              onClick={() => setSelectedToken(token.symbol)}
              className={`p-3 rounded-lg border transition-colors ${
                selectedToken === token.symbol
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{token.icon}</span>
                <div className="text-left">
                  <p className="font-medium text-text">{token.symbol}</p>
                  <p className="text-xs text-text-muted">{token.name}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Destination address */}
      {accountName && (
        <div>
          <label className="text-sm font-medium text-text-muted mb-2 block">
            Delivery address
          </label>
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="font-mono text-sm text-text">{accountName}</p>
            <p className="text-xs text-text-muted mt-1">
              Tokens will be sent to your connected wallet
            </p>
          </div>
        </div>
      )}

      {/* Buy options */}
      <div className="space-y-3">
        <button
          onClick={handleBuyWithMetalPay}
          className="w-full py-3 bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>Buy with Metal Pay</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Card / Bank</span>
        </button>

        <button
          onClick={handleBuyOnMetalX}
          className="w-full py-3 bg-surface hover:bg-surface-hover border border-border rounded-lg font-medium transition-colors"
        >
          Trade on MetalX Exchange
        </button>
      </div>

      {/* Info */}
      <div className="text-xs text-text-muted space-y-2 pt-4 border-t border-border">
        <p>
          <strong>Metal Pay</strong> - Buy crypto with debit/credit card or bank transfer.
          Available in US, Australia & New Zealand.
        </p>
        <p>
          <strong>MetalX</strong> - Trade crypto with other XPR Network tokens.
          Requires existing crypto balance.
        </p>
      </div>

      {/* Metal Pay Connect badge */}
      <div className="flex items-center justify-center gap-2 text-text-muted text-xs">
        <span>Powered by</span>
        <a
          href="https://www.metalpay.com/metal-pay-connect"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:underline"
        >
          Metal Pay Connect
        </a>
      </div>
    </div>
  );
}
