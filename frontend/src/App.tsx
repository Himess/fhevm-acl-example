import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from './config/wagmi';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#7c3aed',
          accentColorForeground: 'white',
          borderRadius: 'medium',
        })}>
          <div className="app">
            <Header />
            <main className="main">
              <Dashboard />
            </main>
            <footer className="footer">
              <p>
                <strong>Zama Bounty Track</strong> — User Decryption Delegation Demo
              </p>
              <p>
                <a href="https://github.com/Himess/fhevm-acl-example" target="_blank" rel="noopener noreferrer">
                  View Source on GitHub
                </a>
                {' · '}
                <a href="https://docs.zama.ai/fhevm" target="_blank" rel="noopener noreferrer">
                  FHEVM Docs
                </a>
              </p>
            </footer>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
