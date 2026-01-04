import { useState } from 'react';
import { useAccountName } from '../../stores/walletStore';

export function ReceiveContent() {
  const accountName = useAccountName();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (accountName) {
      await navigator.clipboard.writeText(accountName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!accountName) return null;

  return (
    <div className="flex flex-col items-center py-6">
      {/* QR Code placeholder */}
      <div className="w-48 h-48 bg-white rounded-xl p-4 mb-6">
        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center">
          QR Code<br />(Coming soon)
        </div>
      </div>

      {/* Account name */}
      <p className="text-sm text-text-muted mb-2">Your XPR Network address</p>
      <div className="flex items-center gap-2 bg-background px-4 py-3 rounded-lg">
        <span className="font-mono text-text">{accountName}</span>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-sm bg-primary hover:bg-primary-hover rounded-md transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-text-muted mt-4 text-center max-w-sm">
        Send only XPR Network tokens to this address. Sending other assets may result in permanent loss.
      </p>
    </div>
  );
}
