import type { LinkSession } from '@proton/web-sdk';
import type { TokenConfig, TransferResult } from '../types';

export function formatAmount(amount: string, precision: number): string {
  const num = parseFloat(amount);
  if (isNaN(num)) {
    throw new Error('Invalid amount');
  }
  return num.toFixed(precision);
}

export function formatQuantity(amount: string, token: TokenConfig): string {
  const formattedAmount = formatAmount(amount, token.precision);
  return `${formattedAmount} ${token.symbol}`;
}

export function validateRecipient(recipient: string): boolean {
  if (!recipient || recipient.length === 0) {
    return false;
  }
  if (recipient.length > 12) {
    return false;
  }
  const validChars = /^[a-z1-5.]+$/;
  return validChars.test(recipient);
}

export function validateAmount(amount: string, precision: number): boolean {
  if (!amount || amount.length === 0) {
    return false;
  }
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return false;
  }
  const parts = amount.split('.');
  if (parts.length === 2 && parts[1].length > precision) {
    return false;
  }
  return true;
}

export async function transfer(
  session: LinkSession,
  to: string,
  amount: string,
  token: TokenConfig,
  memo: string = ''
): Promise<TransferResult> {
  if (!validateRecipient(to)) {
    throw new Error('Invalid recipient account name');
  }

  if (!validateAmount(amount, token.precision)) {
    throw new Error('Invalid transfer amount');
  }

  const from = session.auth.actor.toString();
  const quantity = formatQuantity(amount, token);

  const action = {
    account: token.contract,
    name: 'transfer',
    authorization: [
      {
        actor: session.auth.actor,
        permission: session.auth.permission,
      },
    ],
    data: {
      from,
      to,
      quantity,
      memo,
    },
  };

  const result = await session.transact(
    { actions: [action] },
    { broadcast: true }
  );

  if (!result.processed?.id) {
    throw new Error('Transaction failed - no transaction ID returned');
  }

  return {
    transactionId: result.processed.id,
    blockNum: result.processed.block_num,
  };
}
