export type NetworkType = 'mainnet' | 'testnet';

export interface NetworkConfig {
  chainId: string;
  endpoints: string[];
  hyperion: string;
  explorerUrl: string;
}

export const networks: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    chainId: '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',
    endpoints: ['https://proton.eoscafeblock.com'],
    hyperion: 'https://api-xprnetwork-main.saltant.io',
    explorerUrl: 'https://explorer.xprnetwork.org',
  },
  testnet: {
    chainId: '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd',
    endpoints: ['https://testnet.rockerone.io'],
    hyperion: 'https://testnet.api.protondex.com',
    explorerUrl: 'https://testnet.explorer.xprnetwork.org',
  },
};

export const DEFAULT_NETWORK: NetworkType = 'mainnet';
