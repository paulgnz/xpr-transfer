import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { TransferForm } from './components/transfer/TransferForm';
import { TransactionList } from './components/history/TransactionList';
import { useWalletStore } from './stores/walletStore';

function App() {
  const restoreSession = useWalletStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <Layout>
      <div className="space-y-6">
        <TransferForm />
        <TransactionList />
      </div>
    </Layout>
  );
}

export default App;
