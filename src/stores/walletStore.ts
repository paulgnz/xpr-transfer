import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LinkSession } from '@proton/web-sdk';
import { networks, DEFAULT_NETWORK, type NetworkType } from '../config/networks';
import { connectWallet, disconnectWallet, restoreSession, type WalletLink } from '../services/proton';

interface WalletState {
  session: LinkSession | null;
  link: WalletLink | null;
  network: NetworkType;
  isConnecting: boolean;
  error: string | null;
}

interface WalletActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setNetwork: (network: NetworkType) => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

type WalletStore = WalletState & WalletActions;

const initialState: WalletState = {
  session: null,
  link: null,
  network: DEFAULT_NETWORK,
  isConnecting: false,
  error: null,
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      connect: async () => {
        const { network, isConnecting } = get();
        if (isConnecting) return;

        set({ isConnecting: true, error: null });

        try {
          const connection = await connectWallet(network);
          set({
            session: connection.session,
            link: connection.link,
            isConnecting: false,
          });
        } catch (error) {
          set({
            isConnecting: false,
            error: error instanceof Error ? error.message : 'Failed to connect wallet',
          });
        }
      },

      disconnect: async () => {
        const { link, session, network } = get();
        const chainId = networks[network].chainId;
        await disconnectWallet(link, session, chainId);
        set({
          session: null,
          link: null,
          error: null,
        });
      },

      setNetwork: async (network: NetworkType) => {
        const { session, disconnect } = get();

        if (session) {
          await disconnect();
        }

        set({ network });
      },

      restoreSession: async () => {
        const { network, session } = get();
        if (session) return;

        set({ isConnecting: true });

        try {
          const connection = await restoreSession(network);
          if (connection) {
            set({
              session: connection.session,
              link: connection.link,
              isConnecting: false,
            });
          } else {
            set({ isConnecting: false });
          }
        } catch {
          set({ isConnecting: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'xpr-transfer-wallet',
      partialize: (state) => ({ network: state.network }),
    }
  )
);

export const useAccountName = (): string | null => {
  const session = useWalletStore((state) => state.session);
  if (!session?.auth?.actor) return null;
  return session.auth.actor.toString();
};

export const useIsConnected = (): boolean => {
  return useWalletStore((state) => state.session !== null);
};
