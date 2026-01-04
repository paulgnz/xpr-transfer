import { useTokenBalances, useIsLoadingBalances, type TokenWithBalance } from '../../stores/balanceStore';
import { useIsConnected } from '../../stores/walletStore';
import { formatBalance, formatUsdValue } from '../../services/balances';

interface TokenListProps {
  onTokenSelect?: (token: TokenWithBalance) => void;
}

export function TokenList({ onTokenSelect }: TokenListProps) {
  const isConnected = useIsConnected();
  const tokens = useTokenBalances();
  const isLoading = useIsLoadingBalances();

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-surface rounded-t-3xl -mt-4 pt-6 min-h-[50vh]">
      <div className="px-4">
        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          <button className="px-6 py-3 text-sm font-medium text-text border-b-2 border-primary">
            Tokens
          </button>
          <button className="px-6 py-3 text-sm font-medium text-text-muted hover:text-text">
            NFTs
          </button>
        </div>

        {/* Token list header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text">Tokens</h3>
          <button className="text-text-muted hover:text-text">
            <span className="text-xl">⋯</span>
          </button>
        </div>

        {/* Loading state */}
        {isLoading && tokens.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 py-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-16" />
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-700 rounded w-20 mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && tokens.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <p>No tokens found</p>
          </div>
        )}

        {/* Token list */}
        <div className="space-y-1">
          {tokens.map((token) => (
            <TokenRow
              key={`${token.contract}:${token.symbol}`}
              token={token}
              onClick={() => onTokenSelect?.(token)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TokenRowProps {
  token: TokenWithBalance;
  onClick?: () => void;
}

function TokenRow({ token, onClick }: TokenRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 py-3 px-2 hover:bg-surface-hover rounded-lg transition-colors"
    >
      {/* Token logo */}
      <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
        {token.logo ? (
          <img
            src={token.logo}
            alt={token.symbol}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-text-muted">
            {token.symbol.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Token info */}
      <div className="flex-1 text-left">
        <p className="font-medium text-text">{token.name}</p>
        <p className="text-sm text-text-muted">
          {token.price > 0 ? `$${token.price.toFixed(token.price < 0.01 ? 8 : 2)}` : '-'}
        </p>
      </div>

      {/* Balance */}
      <div className="text-right">
        <p className="font-medium text-text">{formatUsdValue(token.usdValue)}</p>
        <p className="text-sm text-text-muted">
          {formatBalance(token.balance, token.decimals)} {token.symbol}
        </p>
      </div>
    </button>
  );
}
