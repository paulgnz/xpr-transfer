import type { LinkSession } from '@proton/web-sdk';
import type { TransferResult } from '../types';
import { networks, type NetworkType } from '../config/networks';

export interface Producer {
  owner: string;
  total_votes: string;
  producer_key: string;
  is_active: number;
  url: string;
  unpaid_blocks: number;
  location: number;
}

export interface VoterInfo {
  producers: string[];
  proxy: string;
  staked: number;
}

export interface VoteResult extends TransferResult {}

/**
 * Fetch list of block producers
 */
export async function fetchProducers(network: NetworkType): Promise<Producer[]> {
  const config = networks[network];
  const endpoint = config.endpoints[0];

  try {
    const response = await fetch(`${endpoint}/v1/chain/get_producers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: true,
        limit: 100,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch producers');
    }

    const data = await response.json();
    return data.rows || [];
  } catch (error) {
    console.error('Failed to fetch producers:', error);
    return [];
  }
}

/**
 * Fetch current voter info for an account
 */
export async function fetchVoterInfo(
  account: string,
  network: NetworkType
): Promise<VoterInfo | null> {
  const config = networks[network];

  try {
    const response = await fetch(
      `${config.hyperion}/v2/state/get_account?account=${account}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch account');
    }

    const data = await response.json();
    const voterInfo = data.account?.voter_info;

    if (!voterInfo) {
      return null;
    }

    return {
      producers: voterInfo.producers || [],
      proxy: voterInfo.proxy || '',
      staked: typeof voterInfo.staked === 'string'
        ? parseInt(voterInfo.staked, 10) / 10000
        : (voterInfo.staked || 0) / 10000,
    };
  } catch (error) {
    console.error('Failed to fetch voter info:', error);
    return null;
  }
}

/**
 * Vote for block producers
 * Uses the eosio::voteproducer action
 * Producers must be sorted alphabetically
 */
export async function voteProducers(
  session: LinkSession,
  producers: string[]
): Promise<VoteResult> {
  const voter = session.auth.actor.toString();

  // Sort producers alphabetically (required by the contract)
  const sortedProducers = [...producers].sort();

  const action = {
    account: 'eosio',
    name: 'voteproducer',
    authorization: [
      {
        actor: session.auth.actor,
        permission: session.auth.permission,
      },
    ],
    data: {
      voter,
      proxy: '',
      producers: sortedProducers,
    },
  };

  const result = await session.transact(
    { actions: [action] },
    { broadcast: true }
  );

  if (!result.processed?.id) {
    throw new Error('Vote transaction failed - no transaction ID returned');
  }

  return {
    transactionId: result.processed.id,
    blockNum: result.processed.block_num,
  };
}

/**
 * Format vote count for display
 */
export function formatVotes(votes: string): string {
  const num = parseFloat(votes);
  if (isNaN(num) || num === 0) return '0';

  // Votes are in a very large format, need to normalize
  const normalized = num / 1e16;

  if (normalized >= 1_000_000) {
    return `${(normalized / 1_000_000).toFixed(2)}M`;
  }
  if (normalized >= 1_000) {
    return `${(normalized / 1_000).toFixed(2)}K`;
  }

  return normalized.toFixed(2);
}
