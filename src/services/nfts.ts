import type { NetworkType } from '../config/networks';

const ATOMIC_API = {
  mainnet: 'https://aa-xprnetwork-main.saltant.io',
  testnet: 'https://aa-xprnetwork-test.saltant.io',
};

export interface NFTAsset {
  asset_id: string;
  collection: {
    collection_name: string;
    name: string;
    img: string;
    author: string;
  };
  schema: {
    schema_name: string;
  };
  template: {
    template_id: string;
  } | null;
  name: string;
  owner: string;
  data: {
    name?: string;
    img?: string;
    image?: string;
    video?: string;
    description?: string;
    [key: string]: unknown;
  };
  immutable_data: {
    name?: string;
    img?: string;
    image?: string;
    video?: string;
    description?: string;
    [key: string]: unknown;
  };
  minted_at_time: string;
}

interface AtomicAssetsResponse {
  success: boolean;
  data: NFTAsset[];
  query_time: number;
}

export interface NFTDisplay {
  id: string;
  name: string;
  collectionName: string;
  collectionDisplayName: string;
  image: string;
  video?: string;
  owner: string;
  mintedAt: string;
}

function getAssetImage(asset: NFTAsset): string {
  const data = { ...asset.immutable_data, ...asset.data };
  const imagePath = data.img || data.image || '';

  if (!imagePath) {
    return '';
  }

  // Handle IPFS URLs
  if (imagePath.startsWith('Qm') || imagePath.startsWith('bafy')) {
    return `https://ipfs.io/ipfs/${imagePath}`;
  }

  // Handle full URLs
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  return `https://ipfs.io/ipfs/${imagePath}`;
}

function getAssetVideo(asset: NFTAsset): string | undefined {
  const data = { ...asset.immutable_data, ...asset.data };
  const videoPath = data.video;

  if (!videoPath) {
    return undefined;
  }

  if (typeof videoPath !== 'string') {
    return undefined;
  }

  if (videoPath.startsWith('Qm') || videoPath.startsWith('bafy')) {
    return `https://ipfs.io/ipfs/${videoPath}`;
  }

  if (videoPath.startsWith('http')) {
    return videoPath;
  }

  return `https://ipfs.io/ipfs/${videoPath}`;
}

function mapAssetToDisplay(asset: NFTAsset): NFTDisplay {
  const data = { ...asset.immutable_data, ...asset.data };

  return {
    id: asset.asset_id,
    name: data.name || asset.name || `#${asset.asset_id}`,
    collectionName: asset.collection.collection_name,
    collectionDisplayName: asset.collection.name || asset.collection.collection_name,
    image: getAssetImage(asset),
    video: getAssetVideo(asset),
    owner: asset.owner,
    mintedAt: asset.minted_at_time,
  };
}

export async function fetchNFTs(
  account: string,
  network: NetworkType,
  options: {
    limit?: number;
    page?: number;
    collection?: string;
  } = {}
): Promise<{ nfts: NFTDisplay[]; total: number }> {
  const { limit = 20, page = 1, collection } = options;
  const baseUrl = ATOMIC_API[network];

  const params = new URLSearchParams({
    owner: account,
    page: page.toString(),
    limit: limit.toString(),
    order: 'desc',
    sort: 'asset_id',
  });

  if (collection) {
    params.append('collection_name', collection);
  }

  const url = `${baseUrl}/atomicassets/v1/assets?${params}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
    }

    const data: AtomicAssetsResponse = await response.json();

    if (!data.success) {
      throw new Error('AtomicAssets API returned error');
    }

    const nfts = data.data.map(mapAssetToDisplay);

    return {
      nfts,
      total: nfts.length, // API doesn't return total count in this endpoint
    };
  } catch (error) {
    console.error('Failed to fetch NFTs:', error);
    return { nfts: [], total: 0 };
  }
}

export async function fetchCollections(
  account: string,
  network: NetworkType
): Promise<string[]> {
  const baseUrl = ATOMIC_API[network];
  const url = `${baseUrl}/atomicassets/v1/accounts/${account}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.success || !data.data?.collections) {
      return [];
    }

    return data.data.collections.map((c: { collection: { collection_name: string } }) =>
      c.collection.collection_name
    );
  } catch {
    return [];
  }
}

export function getMarketplaceUrl(assetId: string, network: NetworkType): string {
  if (network === 'testnet') {
    return `https://testnet.nfts.xprnetwork.org/asset/${assetId}`;
  }
  return `https://soon.market/asset/${assetId}`;
}
