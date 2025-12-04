import { ConnectButton } from '@rainbow-me/rainbowkit';
import { KeyRound } from 'lucide-react';

export function Header() {
  return (
    <header className="header">
      <div className="logo">
        <KeyRound size={32} />
        <div>
          <h1>User Decryption Delegation</h1>
          <span className="tagline">FHEVM Feature Demo</span>
        </div>
      </div>
      <ConnectButton />
    </header>
  );
}
