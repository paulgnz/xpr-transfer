import { useEffect, useState } from 'react';
import { useWalletStore, useAccountName, useIsConnected } from './stores/walletStore';
import { useBalanceStore, type TokenWithBalance } from './stores/balanceStore';
import { WalletHeader } from './components/wallet/WalletHeader';
import { TokenList } from './components/wallet/TokenList';
import { Modal } from './components/wallet/Modal';
import { SendForm } from './components/transfer/SendForm';
import { ReceiveContent } from './components/wallet/ReceiveModal';
import { TransactionList } from './components/history/TransactionList';

function App() {
  const restoreSession = useWalletStore((state) => state.restoreSession);
  const network = useWalletStore((state) => state.network);
  const accountName = useAccountName();
  const isConnected = useIsConnected();
  const fetchBalances = useBalanceStore((state) => state.fetchBalances);
  const clearBalances = useBalanceStore((state) => state.clearBalances);

  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenWithBalance | null>(null);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isConnected && accountName) {
      fetchBalances(accountName, network);
    } else {
      clearBalances();
    }
  }, [isConnected, accountName, network, fetchBalances, clearBalances]);

  const handleTokenSelect = (token: TokenWithBalance) => {
    setSelectedToken(token);
    setShowSendModal(true);
  };

  const handleSendSuccess = () => {
    // Refresh balances after successful send
    if (accountName) {
      fetchBalances(accountName, network);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <WalletHeader
        onSend={() => {
          setSelectedToken(null);
          setShowSendModal(true);
        }}
        onReceive={() => setShowReceiveModal(true)}
      />

      <TokenList onTokenSelect={handleTokenSelect} />

      {/* History link for connected users */}
      {isConnected && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="w-full py-3 text-center text-secondary hover:underline text-sm"
          >
            View Transaction History
          </button>
        </div>
      )}

      {/* Send Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Tokens"
      >
        <SendForm initialToken={selectedToken} onSuccess={handleSendSuccess} />
      </Modal>

      {/* Receive Modal */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title="Receive"
      >
        <ReceiveContent />
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Transaction History"
      >
        <TransactionList />
      </Modal>
    </div>
  );
}

export default App;
