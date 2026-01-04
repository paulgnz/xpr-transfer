import { useState } from 'react';
import { useWalletStore, useIsConnected } from '../../stores/walletStore';
import { transfer, validateRecipient, validateAmount } from '../../services/transfer';
import { networks } from '../../config/networks';
import { getExplorerTxUrl } from '../../utils/format';
import { TokenSelect } from './TokenSelect';
import { AmountInput } from './AmountInput';
import type { TokenConfig, TransferResult } from '../../types';

export function TransferForm() {
  const { session, network } = useWalletStore();
  const isConnected = useIsConnected();

  const [token, setToken] = useState<TokenConfig | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransferResult | null>(null);

  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    let valid = true;

    if (!validateRecipient(recipient)) {
      setRecipientError('Invalid account name (1-12 chars, a-z, 1-5, .)');
      valid = false;
    } else {
      setRecipientError(null);
    }

    if (!token) {
      valid = false;
    } else if (!validateAmount(amount, token.precision)) {
      setAmountError(`Invalid amount (max ${token.precision} decimal places)`);
      valid = false;
    } else {
      setAmountError(null);
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!session || !token) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const txResult = await transfer(session, recipient, amount, token, memo);
      setResult(txResult);
      setRecipient('');
      setAmount('');
      setMemo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-surface rounded-xl p-8 text-center">
        <p className="text-text-muted">Connect your wallet to send tokens</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-text">Send Tokens</h2>

      <TokenSelect value={token} onChange={setToken} disabled={isSubmitting} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-muted">Recipient</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.toLowerCase())}
          placeholder="Account name"
          disabled={isSubmitting}
          className={`w-full px-4 py-3 bg-background border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 font-mono ${
            recipientError ? 'border-error' : 'border-border'
          }`}
        />
        {recipientError && (
          <span className="text-xs text-error">{recipientError}</span>
        )}
      </div>

      <AmountInput
        value={amount}
        onChange={setAmount}
        symbol={token?.symbol}
        disabled={isSubmitting}
        error={amountError || undefined}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-muted">
          Memo <span className="text-text-muted/60">(optional)</span>
        </label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Optional message"
          disabled={isSubmitting}
          maxLength={256}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
        />
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
          <p className="text-sm text-success">Transfer successful!</p>
          <a
            href={getExplorerTxUrl(result.transactionId, networks[network].explorerUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-secondary hover:underline font-mono"
          >
            View transaction
          </a>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !token}
        className="w-full py-3 bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
