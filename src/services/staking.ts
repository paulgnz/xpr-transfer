import type { LinkSession } from '@proton/web-sdk';
import type { TransferResult } from '../types';
import { networks, type NetworkType } from '../config/networks';

export interface StakeResult extends TransferResult {}

export interface ClaimableRewards {
  amount: number;
  lastClaim: string;
}

export interface StakingAPY {
  apy: number; // Annual percentage yield as decimal (e.g., 0.05 = 5%)
  apyPercent: number; // APY as percentage (e.g., 5.0)
}

/**
 * Fetch current staking APY from the global4 table
 */
export async function fetchStakingAPY(
  network: NetworkType
): Promise<StakingAPY | null> {
  const config = networks[network];
  const endpoint = config.endpoints[0];

  try {
    const response = await fetch(`${endpoint}/v1/chain/get_table_rows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: true,
        code: 'eosio',
        scope: 'eosio',
        table: 'global4',
        limit: 1,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch APY');
    }

    const data = await response.json();

    if (data.rows && data.rows.length > 0) {
      const row = data.rows[0];

      // The APY is typically stored as continuous_rate or similar field
      // Convert from continuous rate to APY if needed
      let apy = 0;

      if (row.continuous_rate !== undefined) {
        // continuous_rate is typically a decimal like "0.04879016416"
        apy = parseFloat(row.continuous_rate) || 0;
      } else if (row.voter_xpr_inflation !== undefined) {
        // Alternative field name
        apy = parseFloat(row.voter_xpr_inflation) || 0;
      }

      return {
        apy,
        apyPercent: apy * 100,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch staking APY:', error);
    return null;
  }
}

/**
 * Fetch claimable staking rewards for an account
 */
export async function fetchClaimableRewards(
  account: string,
  network: NetworkType
): Promise<ClaimableRewards | null> {
  const config = networks[network];
  const endpoint = config.endpoints[0];

  try {
    const response = await fetch(`${endpoint}/v1/chain/get_table_rows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: true,
        code: 'eosio',
        scope: 'eosio',
        table: 'votersxpr',
        lower_bound: account,
        upper_bound: account,
        limit: 1,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch rewards');
    }

    const data = await response.json();

    if (data.rows && data.rows.length > 0) {
      const row = data.rows[0];

      // Verify this is the correct account
      if (row.owner !== account) {
        return null;
      }

      // claimamount is a raw integer, divide by 10000 for 4 decimal places
      const rawAmount = parseInt(row.claimamount, 10) || 0;
      const amount = rawAmount / 10000;

      return {
        amount,
        lastClaim: row.lastclaim || '',
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch claimable rewards:', error);
    return null;
  }
}

export function formatXprQuantity(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    throw new Error('Invalid amount');
  }
  return `${num.toFixed(4)} XPR`;
}

export function validateStakeAmount(amount: string, availableBalance: number): boolean {
  if (!amount || amount.length === 0) {
    return false;
  }
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return false;
  }
  if (num > availableBalance) {
    return false;
  }
  return true;
}

/**
 * Stake XPR tokens
 * Uses the eosio::stakexpr action
 */
export async function stakeXPR(
  session: LinkSession,
  amount: string
): Promise<StakeResult> {
  const account = session.auth.actor.toString();
  const quantity = formatXprQuantity(amount);

  const action = {
    account: 'eosio',
    name: 'stakexpr',
    authorization: [
      {
        actor: session.auth.actor,
        permission: session.auth.permission,
      },
    ],
    data: {
      from: account,
      receiver: account,
      stake_xpr_quantity: quantity,
    },
  };

  const result = await session.transact(
    { actions: [action] },
    { broadcast: true }
  );

  if (!result.processed?.id) {
    throw new Error('Stake transaction failed - no transaction ID returned');
  }

  return {
    transactionId: result.processed.id,
    blockNum: result.processed.block_num,
  };
}

/**
 * Unstake XPR tokens
 * Uses the eosio::unstakexpr action
 * Note: Unstaked tokens have a 24-hour waiting period before they can be claimed
 */
export async function unstakeXPR(
  session: LinkSession,
  amount: string
): Promise<StakeResult> {
  const account = session.auth.actor.toString();
  const quantity = formatXprQuantity(amount);

  const action = {
    account: 'eosio',
    name: 'unstakexpr',
    authorization: [
      {
        actor: session.auth.actor,
        permission: session.auth.permission,
      },
    ],
    data: {
      from: account,
      receiver: account,
      unstake_xpr_quantity: quantity,
    },
  };

  const result = await session.transact(
    { actions: [action] },
    { broadcast: true }
  );

  if (!result.processed?.id) {
    throw new Error('Unstake transaction failed - no transaction ID returned');
  }

  return {
    transactionId: result.processed.id,
    blockNum: result.processed.block_num,
  };
}

/**
 * Claim refund after unstaking period
 * Uses the eosio::refund action
 */
export async function claimRefund(
  session: LinkSession
): Promise<StakeResult> {
  const account = session.auth.actor.toString();

  const action = {
    account: 'eosio',
    name: 'refund',
    authorization: [
      {
        actor: session.auth.actor,
        permission: session.auth.permission,
      },
    ],
    data: {
      owner: account,
    },
  };

  const result = await session.transact(
    { actions: [action] },
    { broadcast: true }
  );

  if (!result.processed?.id) {
    throw new Error('Refund claim failed - no transaction ID returned');
  }

  return {
    transactionId: result.processed.id,
    blockNum: result.processed.block_num,
  };
}

/**
 * Claim short staking rewards
 * Uses the eosio::voterclaim action
 */
export async function claimStakingRewards(
  session: LinkSession
): Promise<StakeResult> {
  const account = session.auth.actor.toString();

  const action = {
    account: 'eosio',
    name: 'voterclaim',
    authorization: [
      {
        actor: session.auth.actor,
        permission: session.auth.permission,
      },
    ],
    data: {
      owner: account,
    },
  };

  const result = await session.transact(
    { actions: [action] },
    { broadcast: true }
  );

  if (!result.processed?.id) {
    throw new Error('Rewards claim failed - no transaction ID returned');
  }

  return {
    transactionId: result.processed.id,
    blockNum: result.processed.block_num,
  };
}
