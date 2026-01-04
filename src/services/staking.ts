import type { LinkSession } from '@proton/web-sdk';
import type { TransferResult } from '../types';

export interface StakeResult extends TransferResult {}

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
