import { useEffect, useState } from 'react';
import { useWalletStore, useAccountName, useIsConnected } from './stores/walletStore';
import { useBalanceStore, type TokenWithBalance } from './stores/balanceStore';
import { WalletHeader } from './components/wallet/WalletHeader';
import { WalletTabs } from './components/wallet/WalletTabs';
import { Modal } from './components/wallet/Modal';
import { SendForm } from './components/transfer/SendForm';
import { ReceiveContent } from './components/wallet/ReceiveModal';
import { BuyContent } from './components/wallet/BuyContent';
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
  const [showBuyModal, setShowBuyModal] = useState(false);
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
    <div className="min-h-screen bg-background-dark flex justify-center">
      {/* Mobile-width container */}
      <div className="w-full max-w-[430px] min-h-screen bg-background shadow-2xl">
        <WalletHeader
          onSend={() => {
            setSelectedToken(null);
            setShowSendModal(true);
          }}
          onReceive={() => setShowReceiveModal(true)}
          onBuy={() => setShowBuyModal(true)}
        />

        <WalletTabs onTokenSelect={handleTokenSelect} />

        {/* History link for connected users */}
        {isConnected && (
          <div className="px-4 py-4">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="w-full py-3 text-center text-secondary hover:underline text-sm"
            >
              View Transaction History
            </button>
          </div>
        )}
      </div>

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

      {/* Buy Modal */}
      <Modal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        title="Buy Crypto"
      >
        <BuyContent />
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
