interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  symbol?: string;
  disabled?: boolean;
  error?: string;
}

export function AmountInput({ value, onChange, symbol, disabled, error }: AmountInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-muted">Amount</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || /^\d*\.?\d*$/.test(val)) {
              onChange(val);
            }
          }}
          placeholder="0.00"
          disabled={disabled}
          className={`w-full px-4 py-3 bg-surface border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-16 ${
            error ? 'border-error' : 'border-border'
          }`}
        />
        {symbol && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">
            {symbol}
          </span>
        )}
      </div>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
