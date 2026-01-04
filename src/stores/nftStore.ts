import { create } from 'zustand';
import { fetchNFTs, fetchCollections, type NFTDisplay } from '../services/nfts';
import type { NetworkType } from '../config/networks';

interface NFTState {
  nfts: NFTDisplay[];
  collections: string[];
  selectedCollection: string | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

interface NFTActions {
  fetchUserNFTs: (account: string, network: NetworkType) => Promise<void>;
  loadMore: (account: string, network: NetworkType) => Promise<void>;
  setCollection: (collection: string | null) => void;
  clearNFTs: () => void;
}

type NFTStore = NFTState & NFTActions;

const PAGE_SIZE = 20;

const initialState: NFTState = {
  nfts: [],
  collections: [],
  selectedCollection: null,
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true,
};

export const useNFTStore = create<NFTStore>()((set, get) => ({
  ...initialState,

  fetchUserNFTs: async (account: string, network: NetworkType) => {
    set({ isLoading: true, error: null, page: 1 });

    try {
      const [nftResult, collections] = await Promise.all([
        fetchNFTs(account, network, { limit: PAGE_SIZE, page: 1 }),
        fetchCollections(account, network),
      ]);

      set({
        nfts: nftResult.nfts,
        collections,
        isLoading: false,
        hasMore: nftResult.nfts.length === PAGE_SIZE,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch NFTs',
      });
    }
  },

  loadMore: async (account: string, network: NetworkType) => {
    const { isLoading, hasMore, page, selectedCollection, nfts } = get();

    if (isLoading || !hasMore) return;

    set({ isLoading: true });

    try {
      const nextPage = page + 1;
      const result = await fetchNFTs(account, network, {
        limit: PAGE_SIZE,
        page: nextPage,
        collection: selectedCollection || undefined,
      });

      set({
        nfts: [...nfts, ...result.nfts],
        page: nextPage,
        isLoading: false,
        hasMore: result.nfts.length === PAGE_SIZE,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load more NFTs',
      });
    }
  },

  setCollection: (collection: string | null) => {
    set({ selectedCollection: collection, nfts: [], page: 1, hasMore: true });
  },

  clearNFTs: () => {
    set(initialState);
  },
}));

export const useNFTs = () => useNFTStore((state) => state.nfts);
export const useNFTCollections = () => useNFTStore((state) => state.collections);
export const useIsLoadingNFTs = () => useNFTStore((state) => state.isLoading);
