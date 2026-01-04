import { ConnectButton } from '../wallet/ConnectButton';
import { NetworkToggle } from '../wallet/NetworkToggle';

export function Header() {
  return (
    <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-text">XPR Transfer</h1>
          <NetworkToggle />
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
