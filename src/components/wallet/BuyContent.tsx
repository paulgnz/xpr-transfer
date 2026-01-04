import { useEffect, useRef, useState } from 'react';
import { useAccountName } from '../../stores/walletStore';
import { MetalPayConnect } from 'metal-pay-connect-js';

interface SignatureResponse {
  apiKey: string;
  signature: string;
  nonce: string;
}

export function BuyContent() {
  const accountName = useAccountName();
  const containerRef = useRef<HTMLDivElement>(null);
  const metalPayRef = useRef<MetalPayConnect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initMetalPay = async () => {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch signature from our API route
        const response = await fetch('/api/metalpay-signature');

        if (!response.ok) {
          throw new Error('Failed to get Metal Pay credentials');
        }

        const { apiKey, signature, nonce }: SignatureResponse = await response.json();

        if (!mounted) return;

        // Destroy existing instance if any
        if (metalPayRef.current) {
          metalPayRef.current.destroy();
        }

        // Initialize Metal Pay Connect
        metalPayRef.current = new MetalPayConnect({
          el: containerRef.current,
          environment: 'prod',
          params: {
            apiKey,
            signature,
            nonce,
            // Pre-fill with XPR if user is connected
            ...(accountName && {
              destinationAddress: accountName,
              destinationNetwork: 'proton',
            }),
          },
        });

        setIsLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error('Metal Pay init error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Metal Pay');
        setIsLoading(false);
      }
    };

    initMetalPay();

    return () => {
      mounted = false;
      if (metalPayRef.current) {
        metalPayRef.current.destroy();
        metalPayRef.current = null;
      }
    };
  }, [accountName]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-center">
          <p className="text-error mb-2">{error}</p>
          <p className="text-sm text-text-muted">
            Try refreshing or use the alternative options below.
          </p>
        </div>
        <FallbackOptions accountName={accountName} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metal Pay Connect Container */}
      <div
        ref={containerRef}
        className="min-h-[400px] bg-background rounded-lg overflow-hidden"
      >
        {isLoading && (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-text-muted text-sm">Loading Metal Pay...</p>
            </div>
          </div>
        )}
      </div>

      {/* Alternative options */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs text-text-muted text-center mb-3">
          Or use these alternatives:
        </p>
        <div className="flex gap-2">
          <a
            href="https://app.metalx.com/trade"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 text-center text-sm bg-surface hover:bg-surface-hover border border-border rounded-lg transition-colors"
          >
            MetalX Exchange
          </a>
          <a
            href="https://www.metalpay.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 text-center text-sm bg-surface hover:bg-surface-hover border border-border rounded-lg transition-colors"
          >
            Metal Pay App
          </a>
        </div>
      </div>
    </div>
  );
}

interface FallbackOptionsProps {
  accountName: string | null;
}

function FallbackOptions({ accountName }: FallbackOptionsProps) {
  const handleBuyWithMetalPay = () => {
    const url = accountName
      ? `https://app.metalpay.com/buy?asset=XPR&address=${accountName}`
      : 'https://app.metalpay.com/buy?asset=XPR';
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleBuyWithMetalPay}
        className="w-full py-3 bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <span>Open Metal Pay</span>
      </button>

      <a
        href="https://app.metalx.com/trade"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 bg-surface hover:bg-surface-hover border border-border rounded-lg font-medium transition-colors block text-center"
      >
        Trade on MetalX Exchange
      </a>

      {accountName && (
        <div className="p-3 bg-background rounded-lg border border-border">
          <p className="text-xs text-text-muted mb-1">Your wallet address:</p>
          <p className="font-mono text-sm text-text">{accountName}</p>
        </div>
      )}
    </div>
  );
}
