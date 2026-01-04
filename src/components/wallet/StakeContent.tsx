import { useState } from 'react';
import { useWalletStore, useAccountName } from '../../stores/walletStore';
import { useTokenBalances } from '../../stores/balanceStore';
import { stakeXPR, unstakeXPR, claimRefund } from '../../services/staking';
import { formatBalance } from '../../services/balances';

type TabType = 'stake' | 'unstake';

interface StakeContentProps {
  onSuccess?: () => void;
}

export function StakeContent({ onSuccess }: StakeContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stake');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const session = useWalletStore((state) => state.session);
  const accountName = useAccountName();
  const tokens = useTokenBalances();

  // Find XPR balances
  const xprToken = tokens.find((t) => t.symbol === 'XPR' && !t.isStaked);
  const stakedXprToken = tokens.find((t) => t.symbol === 'XPR' && t.isStaked);

  const availableXpr = xprToken?.balance || 0;
  const stakedXpr = stakedXprToken?.balance || 0;

  const handleStake = async () => {
    if (!session || !amount) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await stakeXPR(session, amount);
      setSuccess(`Successfully staked ${amount} XPR! TX: ${result.transactionId.slice(0, 8)}...`);
      setAmount('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stake XPR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!session || !amount) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await unstakeXPR(session, amount);
      setSuccess(`Unstake initiated for ${amount} XPR! TX: ${result.transactionId.slice(0, 8)}...`);
      setAmount('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unstake XPR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRefund = async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await claimRefund(session);
      setSuccess(`Refund claimed! TX: ${result.transactionId.slice(0, 8)}...`);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No refund available or claim failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetMax = () => {
    if (activeTab === 'stake') {
      setAmount(availableXpr.toString());
    } else {
      setAmount(stakedXpr.toString());
    }
  };

  const maxAmount = activeTab === 'stake' ? availableXpr : stakedXpr;
  const isValidAmount = parseFloat(amount) > 0 && parseFloat(amount) <= maxAmount;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => {
            setActiveTab('stake');
            setAmount('');
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'stake'
              ? 'text-text border-b-2 border-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Stake
        </button>
        <button
          onClick={() => {
            setActiveTab('unstake');
            setAmount('');
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'unstake'
              ? 'text-text border-b-2 border-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Unstake
        </button>
      </div>

      {/* Balance info */}
      <div className="bg-background rounded-lg p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-muted">Available XPR</span>
          <span className="text-text font-medium">
            {formatBalance(availableXpr, 4)} XPR
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Staked XPR</span>
          <span className="text-text font-medium">
            {formatBalance(stakedXpr, 4)} XPR
          </span>
        </div>
      </div>

      {/* Amount input */}
      <div>
        <label className="block text-sm text-text-muted mb-2">
          Amount to {activeTab}
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0000"
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleSetMax}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary-hover"
          >
            MAX
          </button>
        </div>
        <p className="text-xs text-text-muted mt-1">
          Max: {formatBalance(maxAmount, 4)} XPR
        </p>
      </div>

      {/* Info box */}
      {activeTab === 'unstake' && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <p className="text-sm text-text">
            Unstaking has a 24-hour waiting period. After unstaking, use the "Claim Refund" button to receive your XPR.
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-3">
          <p className="text-sm text-success">{success}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={activeTab === 'stake' ? handleStake : handleUnstake}
          disabled={isLoading || !isValidAmount}
          className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Processing...
            </span>
          ) : activeTab === 'stake' ? (
            'Stake XPR'
          ) : (
            'Unstake XPR'
          )}
        </button>

        {activeTab === 'unstake' && (
          <button
            onClick={handleClaimRefund}
            disabled={isLoading}
            className="w-full py-3 bg-surface hover:bg-surface-hover border border-border rounded-lg font-medium transition-colors"
          >
            Claim Refund
          </button>
        )}
      </div>

      {/* Account info */}
      {accountName && (
        <p className="text-xs text-text-muted text-center">
          Connected as: {accountName}
        </p>
      )}
    </div>
  );
}
