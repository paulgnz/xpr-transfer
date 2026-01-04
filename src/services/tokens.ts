import { networks, type NetworkType } from '../config/networks';

export interface TokenMetadata {
  name: string;
  symbol: string;
  contract: string;
  precision: number;
  logo: string;
  price: number;
  coingeckoId?: string;
}

interface MetalXCoin {
  name: string;
  coin: string;
  xtokenSymbol: string;
  xtokenPrecision: number;
  xtokenContract: string;
  coingeckoId?: string;
  image?: string;
}

interface CoinGeckoPrice {
  [id: string]: {
    usd: number;
  };
}

let tokenMetadataCache: Map<string, TokenMetadata> = new Map();
let priceCache: Map<string, number> = new Map();
let lastPriceFetch = 0;
const PRICE_CACHE_TTL = 60000; // 1 minute

export async function fetchTokenMetadata(network: NetworkType): Promise<TokenMetadata[]> {
  const config = networks[network];

  try {
    const response = await fetch(config.tokenInfoUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch token info');
    }

    const coins: MetalXCoin[] = await response.json();

    const tokens: TokenMetadata[] = coins
      .filter((coin) => coin.xtokenContract && coin.xtokenSymbol)
      .map((coin) => ({
        name: coin.name,
        symbol: coin.xtokenSymbol,
        contract: coin.xtokenContract,
        precision: coin.xtokenPrecision,
        logo: coin.image || `https://www.metalx.com/images/coins/${coin.coin.toLowerCase()}.png`,
        price: 0,
        coingeckoId: coin.coingeckoId,
      }));

    // Add XPR if not in list
    const hasXPR = tokens.some((t) => t.symbol === 'XPR');
    if (!hasXPR) {
      tokens.unshift({
        name: 'XPR Network',
        symbol: 'XPR',
        contract: 'eosio.token',
        precision: 4,
        logo: 'https://www.metalx.com/images/coins/xpr.png',
        price: 0,
        coingeckoId: 'proton',
      });
    }

    // Cache tokens
    tokens.forEach((token) => {
      const key = `${token.contract}:${token.symbol}`;
      tokenMetadataCache.set(key, token);
    });

    return tokens;
  } catch (error) {
    console.error('Failed to fetch token metadata:', error);
    return getDefaultTokens();
  }
}

export async function fetchTokenPrices(tokens: TokenMetadata[]): Promise<Map<string, number>> {
  const now = Date.now();
  if (now - lastPriceFetch < PRICE_CACHE_TTL && priceCache.size > 0) {
    return priceCache;
  }

  const coingeckoIds = tokens
    .filter((t) => t.coingeckoId)
    .map((t) => t.coingeckoId)
    .filter((id, index, self) => self.indexOf(id) === index);

  if (coingeckoIds.length === 0) {
    return priceCache;
  }

  try {
    const ids = coingeckoIds.join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch prices');
    }

    const prices: CoinGeckoPrice = await response.json();

    tokens.forEach((token) => {
      if (token.coingeckoId && prices[token.coingeckoId]) {
        const key = `${token.contract}:${token.symbol}`;
        priceCache.set(key, prices[token.coingeckoId].usd);
      }
    });

    lastPriceFetch = now;
    return priceCache;
  } catch (error) {
    console.error('Failed to fetch token prices:', error);
    return priceCache;
  }
}

export function getTokenMetadata(contract: string, symbol: string): TokenMetadata | undefined {
  return tokenMetadataCache.get(`${contract}:${symbol}`);
}

export function getTokenPrice(contract: string, symbol: string): number {
  return priceCache.get(`${contract}:${symbol}`) || 0;
}

function getDefaultTokens(): TokenMetadata[] {
  return [
    {
      name: 'XPR Network',
      symbol: 'XPR',
      contract: 'eosio.token',
      precision: 4,
      logo: 'https://www.metalx.com/images/coins/xpr.png',
      price: 0,
      coingeckoId: 'proton',
    },
    {
      name: 'USD Coin',
      symbol: 'XUSDC',
      contract: 'xtokens',
      precision: 6,
      logo: 'https://www.metalx.com/images/coins/usdc.png',
      price: 1,
      coingeckoId: 'usd-coin',
    },
    {
      name: 'Bitcoin',
      symbol: 'XBTC',
      contract: 'xtokens',
      precision: 8,
      logo: 'https://www.metalx.com/images/coins/btc.png',
      price: 0,
      coingeckoId: 'bitcoin',
    },
    {
      name: 'Ethereum',
      symbol: 'XETH',
      contract: 'xtokens',
      precision: 8,
      logo: 'https://www.metalx.com/images/coins/eth.png',
      price: 0,
      coingeckoId: 'ethereum',
    },
  ];
}
