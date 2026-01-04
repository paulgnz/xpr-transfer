import { useState, useEffect } from 'react';
import { useWalletStore, useAccountName } from '../../stores/walletStore';
import {
  fetchProducers,
  fetchVoterInfo,
  voteProducers,
  formatVotes,
  type Producer,
} from '../../services/voting';

interface VoteContentProps {
  onSuccess?: () => void;
}

export function VoteContent({ onSuccess }: VoteContentProps) {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [selectedProducers, setSelectedProducers] = useState<Set<string>>(new Set());
  const [currentVotes, setCurrentVotes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const session = useWalletStore((state) => state.session);
  const network = useWalletStore((state) => state.network);
  const accountName = useAccountName();

  // Fetch producers and current votes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [producerList, voterInfo] = await Promise.all([
          fetchProducers(network),
          accountName ? fetchVoterInfo(accountName, network) : null,
        ]);

        // Filter to only active producers
        const activeProducers = producerList.filter((p) => p.is_active === 1);
        setProducers(activeProducers);

        if (voterInfo) {
          setCurrentVotes(voterInfo.producers);
          setSelectedProducers(new Set(voterInfo.producers));
        }
      } catch (err) {
        setError('Failed to load producers');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [network, accountName]);

  const handleToggleProducer = (owner: string) => {
    setSelectedProducers((prev) => {
      const next = new Set(prev);
      if (next.has(owner)) {
        next.delete(owner);
      } else {
        // Max 30 producers
        if (next.size >= 30) {
          setError('Maximum 30 producers can be selected');
          return prev;
        }
        next.add(owner);
      }
      setError(null);
      return next;
    });
  };

  const handleVote = async () => {
    if (!session) return;

    setIsVoting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await voteProducers(session, Array.from(selectedProducers));
      setSuccess(`Vote successful! TX: ${result.transactionId.slice(0, 8)}...`);
      setCurrentVotes(Array.from(selectedProducers));
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleSelectAll = () => {
    // Select top 30 producers
    const top30 = producers.slice(0, 30).map((p) => p.owner);
    setSelectedProducers(new Set(top30));
  };

  const handleClearAll = () => {
    setSelectedProducers(new Set());
  };

  // Filter producers by search
  const filteredProducers = producers.filter((p) =>
    p.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if selection has changed from current votes
  const hasChanges =
    selectedProducers.size !== currentVotes.length ||
    !currentVotes.every((p) => selectedProducers.has(p));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-text-muted text-sm">Loading producers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-background rounded-lg p-3">
        <p className="text-sm text-text-muted">
          Vote for up to 30 block producers. Your vote weight is based on your staked XPR.
        </p>
      </div>

      {/* Selection summary */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text">
          Selected: <span className="font-medium">{selectedProducers.size}/30</span>
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs text-primary hover:text-primary-hover"
          >
            Select Top 30
          </button>
          <span className="text-text-muted">|</span>
          <button
            onClick={handleClearAll}
            className="text-xs text-primary hover:text-primary-hover"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search producers..."
        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text text-sm focus:outline-none focus:border-primary"
      />

      {/* Producer list */}
      <div className="max-h-[300px] overflow-y-auto space-y-1">
        {filteredProducers.map((producer) => (
          <ProducerRow
            key={producer.owner}
            producer={producer}
            rank={producers.indexOf(producer) + 1}
            isSelected={selectedProducers.has(producer.owner)}
            isCurrentVote={currentVotes.includes(producer.owner)}
            onToggle={() => handleToggleProducer(producer.owner)}
          />
        ))}
        {filteredProducers.length === 0 && (
          <p className="text-center py-4 text-text-muted text-sm">
            No producers found
          </p>
        )}
      </div>

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

      {/* Vote button */}
      <button
        onClick={handleVote}
        disabled={isVoting || !hasChanges || selectedProducers.size === 0}
        className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
      >
        {isVoting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Voting...
          </span>
        ) : (
          `Vote for ${selectedProducers.size} Producer${selectedProducers.size !== 1 ? 's' : ''}`
        )}
      </button>

      {!hasChanges && currentVotes.length > 0 && (
        <p className="text-xs text-text-muted text-center">
          Your current votes are already submitted
        </p>
      )}
    </div>
  );
}

interface ProducerRowProps {
  producer: Producer;
  rank: number;
  isSelected: boolean;
  isCurrentVote: boolean;
  onToggle: () => void;
}

function ProducerRow({ producer, rank, isSelected, isCurrentVote, onToggle }: ProducerRowProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isSelected
          ? 'bg-primary/20 border border-primary/40'
          : 'bg-background hover:bg-surface-hover border border-transparent'
      }`}
    >
      {/* Rank */}
      <span className="w-6 text-sm text-text-muted font-mono">
        #{rank}
      </span>

      {/* Checkbox */}
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
          isSelected
            ? 'bg-primary border-primary'
            : 'border-gray-500'
        }`}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {/* Producer info */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">{producer.owner}</span>
          {isCurrentVote && (
            <span className="text-xs bg-success/20 text-success px-1.5 py-0.5 rounded">
              Voted
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted">
          {formatVotes(producer.total_votes)} votes
        </span>
      </div>
    </button>
  );
}
