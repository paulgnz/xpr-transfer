import { useNFTStore, useNFTs, useIsLoadingNFTs } from '../../stores/nftStore';
import { useWalletStore } from '../../stores/walletStore';
import { getMarketplaceUrl, type NFTDisplay } from '../../services/nfts';

export function NFTGrid() {
  const nfts = useNFTs();
  const isLoading = useIsLoadingNFTs();
  const network = useWalletStore((state) => state.network);
  const { hasMore, loadMore } = useNFTStore();
  const accountName = useWalletStore((state) => state.session?.auth?.actor?.toString());

  const handleLoadMore = () => {
    if (accountName) {
      loadMore(accountName, network);
    }
  };

  if (isLoading && nfts.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-700 rounded-xl" />
            <div className="mt-2 h-4 bg-gray-700 rounded w-3/4" />
            <div className="mt-1 h-3 bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!isLoading && nfts.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p className="text-4xl mb-4">🖼️</p>
        <p>No NFTs found</p>
        <a
          href="https://soon.market"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:underline text-sm mt-2 inline-block"
        >
          Browse NFT Marketplace →
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {nfts.map((nft) => (
          <NFTCard key={nft.id} nft={nft} network={network} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-surface-hover hover:bg-gray-600 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

interface NFTCardProps {
  nft: NFTDisplay;
  network: 'mainnet' | 'testnet';
}

function NFTCard({ nft, network }: NFTCardProps) {
  const marketplaceUrl = getMarketplaceUrl(nft.id, network);

  return (
    <a
      href={marketplaceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden relative">
        {nft.video ? (
          <video
            src={nft.video}
            poster={nft.image}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            muted
            loop
            playsInline
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
        ) : nft.image ? (
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374151" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%239CA3AF" font-size="12">NFT</text></svg>';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <span className="text-2xl">🖼️</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-sm font-medium">View NFT →</span>
        </div>
      </div>

      <div className="mt-2">
        <p className="font-medium text-text text-sm truncate group-hover:text-primary transition-colors">
          {nft.name}
        </p>
        <p className="text-xs text-text-muted truncate">{nft.collectionDisplayName}</p>
      </div>
    </a>
  );
}
