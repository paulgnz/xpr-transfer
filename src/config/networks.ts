export type NetworkType = 'mainnet' | 'testnet';

export interface NetworkConfig {
  chainId: string;
  endpoints: string[];
  hyperion: string;
  lightApi: string;
  explorerUrl: string;
  chainInfoUrl: string;
  tokenInfoUrl: string;
}

export const networks: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    chainId: '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',
    endpoints: [
      'https://proton.eoscafeblock.com',
      'https://api.protonnz.com',
      'https://proton.cryptolions.io',
    ],
    hyperion: 'https://api-xprnetwork-main.saltant.io',
    lightApi: 'https://proton.light-api.net',
    explorerUrl: 'https://explorer.xprnetwork.org',
    chainInfoUrl: 'https://raw.githubusercontent.com/ProtonProtocol/chain-info/main/mainnet.json',
    tokenInfoUrl: 'https://app.metalx.com/mainnet-coins.json',
  },
  testnet: {
    chainId: '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd',
    endpoints: ['https://testnet.rockerone.io'],
    hyperion: 'https://api-xprnetwork-test.saltant.io',
    lightApi: 'https://proton-testnet.light-api.net',
    explorerUrl: 'https://testnet.explorer.xprnetwork.org',
    chainInfoUrl: 'https://raw.githubusercontent.com/ProtonProtocol/chain-info/main/testnet.json',
    tokenInfoUrl: 'https://app.metalx.com/mainnet-coins.json',
  },
};

export const DEFAULT_NETWORK: NetworkType = 'mainnet';
