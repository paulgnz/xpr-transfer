import { useState, useEffect } from 'react';
import { useWalletStore } from '../../stores/walletStore';
import { useTokenBalances, type TokenWithBalance } from '../../stores/balanceStore';
import { transfer, validateRecipient, validateAmount } from '../../services/transfer';
import { networks } from '../../config/networks';
import { getExplorerTxUrl } from '../../utils/format';
import { formatBalance, formatUsdValue } from '../../services/balances';
import type { TransferResult } from '../../types';

interface SendFormProps {
  initialToken?: TokenWithBalance | null;
  onSuccess?: () => void;
}

export function SendForm({ initialToken, onSuccess }: SendFormProps) {
  const { session, network } = useWalletStore();
  const tokens = useTokenBalances();

  const [selectedToken, setSelectedToken] = useState<TokenWithBalance | null>(initialToken || null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransferResult | null>(null);

  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    if (initialToken) {
      setSelectedToken(initialToken);
    }
  }, [initialToken]);

  const validateForm = (): boolean => {
    let valid = true;

    if (!validateRecipient(recipient)) {
      setRecipientError('Invalid account name (1-12 chars, a-z, 1-5, .)');
      valid = false;
    } else {
      setRecipientError(null);
    }

    if (!selectedToken) {
      valid = false;
    } else if (!validateAmount(amount, selectedToken.decimals)) {
      setAmountError(`Invalid amount (max ${selectedToken.decimals} decimal places)`);
      valid = false;
    } else {
      const amountNum = parseFloat(amount);
      if (amountNum > selectedToken.balance) {
        setAmountError('Insufficient balance');
        valid = false;
      } else {
        setAmountError(null);
      }
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!session || !selectedToken) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const tokenConfig = {
        contract: selectedToken.contract,
        symbol: selectedToken.symbol,
        precision: selectedToken.decimals,
        name: selectedToken.name,
      };
      const txResult = await transfer(session, recipient, amount, tokenConfig, memo);
      setResult(txResult);
      setRecipient('');
      setAmount('');
      setMemo('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaxClick = () => {
    if (selectedToken) {
      setAmount(selectedToken.balance.toString());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Token selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-muted">Token</label>
        <select
          value={selectedToken ? `${selectedToken.contract}:${selectedToken.symbol}` : ''}
          onChange={(e) => {
            const token = tokens.find(
              (t) => `${t.contract}:${t.symbol}` === e.target.value
            );
            setSelectedToken(token || null);
          }}
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
        >
          <option value="">Select a token</option>
          {tokens.map((token) => (
            <option
              key={`${token.contract}:${token.symbol}`}
              value={`${token.contract}:${token.symbol}`}
            >
              {token.symbol} - {formatBalance(token.balance, token.decimals)} available
            </option>
          ))}
        </select>
      </div>

      {/* Recipient */}
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

      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-text-muted">Amount</label>
          {selectedToken && (
            <button
              type="button"
              onClick={handleMaxClick}
              className="text-xs text-secondary hover:underline"
            >
              Max: {formatBalance(selectedToken.balance, selectedToken.decimals)}
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setAmount(val);
              }
            }}
            placeholder="0.00"
            disabled={isSubmitting}
            className={`w-full px-4 py-3 bg-background border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 pr-16 ${
              amountError ? 'border-error' : 'border-border'
            }`}
          />
          {selectedToken && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">
              {selectedToken.symbol}
            </span>
          )}
        </div>
        {amountError && <span className="text-xs text-error">{amountError}</span>}
        {selectedToken && amount && !amountError && (
          <span className="text-xs text-text-muted">
            ≈ {formatUsdValue(parseFloat(amount) * selectedToken.price)}
          </span>
        )}
      </div>

      {/* Memo */}
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

      {/* Error */}
      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Success */}
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

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !selectedToken}
        className="w-full py-3 bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
