import type { TokenConfig } from '../../types';
import tokens from '../../config/tokens.json';

interface TokenSelectProps {
  value: TokenConfig | null;
  onChange: (token: TokenConfig) => void;
  disabled?: boolean;
}

export function TokenSelect({ value, onChange, disabled }: TokenSelectProps) {
  const tokenList = tokens as TokenConfig[];

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-muted">Token</label>
      <select
        value={value?.symbol || ''}
        onChange={(e) => {
          const token = tokenList.find((t) => t.symbol === e.target.value);
          if (token) onChange(token);
        }}
        disabled={disabled}
        className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select a token</option>
        {tokenList.map((token) => (
          <option key={`${token.contract}:${token.symbol}`} value={token.symbol}>
            {token.symbol} - {token.name}
          </option>
        ))}
      </select>
    </div>
  );
}
