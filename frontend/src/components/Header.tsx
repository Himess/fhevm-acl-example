import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield } from 'lucide-react';

export function Header() {
  return (
    <header className="header">
      <div className="logo">
        <Shield size={32} />
        <div>
          <h1>Confidential Salary</h1>
          <span className="tagline">FHEVM ACL Demo - All 11 Functions</span>
        </div>
      </div>
      <ConnectButton />
    </header>
  );
}
