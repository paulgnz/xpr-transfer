import { useState, useEffect } from 'react';
import { useTokenBalances, useIsLoadingBalances, type TokenWithBalance } from '../../stores/balanceStore';
import { useNFTStore, useNFTs } from '../../stores/nftStore';
import { useWalletStore, useIsConnected, useAccountName } from '../../stores/walletStore';
import { formatBalance, formatUsdValue } from '../../services/balances';
import { NFTGrid } from '../nft/NFTGrid';

interface WalletTabsProps {
  onTokenSelect?: (token: TokenWithBalance) => void;
}

type TabType = 'tokens' | 'nfts';

export function WalletTabs({ onTokenSelect }: WalletTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('tokens');
  const isConnected = useIsConnected();
  const accountName = useAccountName();
  const network = useWalletStore((state) => state.network);

  const tokens = useTokenBalances();
  const isLoadingTokens = useIsLoadingBalances();

  const nfts = useNFTs();
  const fetchUserNFTs = useNFTStore((state) => state.fetchUserNFTs);
  const clearNFTs = useNFTStore((state) => state.clearNFTs);

  // Fetch NFTs when tab is selected
  useEffect(() => {
    if (activeTab === 'nfts' && isConnected && accountName && nfts.length === 0) {
      fetchUserNFTs(accountName, network);
    }
  }, [activeTab, isConnected, accountName, network, nfts.length, fetchUserNFTs]);

  // Clear NFTs when disconnected
  useEffect(() => {
    if (!isConnected) {
      clearNFTs();
    }
  }, [isConnected, clearNFTs]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-surface rounded-t-3xl -mt-4 pt-6 min-h-[50vh]">
      <div className="px-4">
        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'tokens'
                ? 'text-text border-b-2 border-primary'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Tokens
          </button>
          <button
            onClick={() => setActiveTab('nfts')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'nfts'
                ? 'text-text border-b-2 border-primary'
                : 'text-text-muted hover:text-text'
            }`}
          >
            NFTs
          </button>
        </div>

        {/* Content */}
        {activeTab === 'tokens' ? (
          <TokensContent
            tokens={tokens}
            isLoading={isLoadingTokens}
            onTokenSelect={onTokenSelect}
          />
        ) : (
          <NFTsContent nftCount={nfts.length} />
        )}
      </div>
    </div>
  );
}

interface TokensContentProps {
  tokens: TokenWithBalance[];
  isLoading: boolean;
  onTokenSelect?: (token: TokenWithBalance) => void;
}

function TokensContent({ tokens, isLoading, onTokenSelect }: TokensContentProps) {
  if (isLoading && tokens.length === 0) {
    return (
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
    );
  }

  if (!isLoading && tokens.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p>No tokens found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text">Tokens</h3>
      </div>
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
  );
}

interface TokenRowProps {
  token: TokenWithBalance;
  onClick?: () => void;
}

function TokenRow({ token, onClick }: TokenRowProps) {
  return (
    <button
      onClick={token.isStaked ? undefined : onClick}
      className={`w-full flex items-center gap-4 py-3 px-2 rounded-lg transition-colors ${
        token.isStaked ? 'cursor-default' : 'hover:bg-surface-hover'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 relative">
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
        {token.isStaked && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs">
            🔒
          </div>
        )}
      </div>

      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className="font-medium text-text">{token.name}</p>
          {token.isStaked && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
              Staked
            </span>
          )}
        </div>
        <p className="text-sm text-text-muted">
          {token.price > 0 ? `$${token.price.toFixed(token.price < 0.01 ? 8 : 2)}` : '-'}
        </p>
      </div>

      <div className="text-right">
        <p className="font-medium text-text">{formatUsdValue(token.usdValue)}</p>
        <p className="text-sm text-text-muted">
          {formatBalance(token.balance, token.decimals)} {token.symbol}
        </p>
      </div>
    </button>
  );
}

interface NFTsContentProps {
  nftCount: number;
}

function NFTsContent({ nftCount }: NFTsContentProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text">NFTs</h3>
        {nftCount > 0 && (
          <span className="text-sm text-text-muted">{nftCount} items</span>
        )}
      </div>
      <NFTGrid />
    </div>
  );
}
