import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Zap,
  Wifi,
  WifiOff,
  Play,
  Calendar,
  FileText,
  ArrowRight,
  RotateCcw,
  Info
} from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning';
  fn?: string;
}

interface DelegationInfo {
  delegate: string;
  expiry: Date;
  isActive: boolean;
}

export function Dashboard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  // State
  const [delegateAddress, setDelegateAddress] = useState('');
  const [delegationDays, setDelegationDays] = useState(30);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastId, setToastId] = useState(0);

  // Demo state
  const [hasStoredData, setHasStoredData] = useState(false);
  const [storedValue, setStoredValue] = useState(75000);
  const [delegation, setDelegation] = useState<DelegationInfo | null>(null);

  // Network info
  const networkName = chainId === 9000 ? 'Zama Devnet' : chainId === 8009 ? 'Zama Testnet' : chainId === 11155111 ? 'Sepolia' : 'Demo Mode';

  // Toast helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning', fn?: string) => {
    const id = toastId + 1;
    setToastId(id);
    setToasts(prev => [...prev, { id, message, type, fn }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Demo actions
  const handleStoreData = () => {
    if (storedValue <= 0) {
      showToast('Enter a valid amount', 'warning');
      return;
    }
    setHasStoredData(true);
    showToast('Encrypted data stored on-chain!', 'success', 'TFHE.asEuint64()');
  };

  const handleDelegate = () => {
    if (!delegateAddress) {
      showToast('Enter delegate address', 'warning');
      return;
    }
    if (!delegateAddress.startsWith('0x')) {
      showToast('Address must start with 0x', 'warning');
      return;
    }
    const expiry = new Date(Date.now() + delegationDays * 24 * 60 * 60 * 1000);
    setDelegation({
      delegate: delegateAddress.length > 15
        ? `${delegateAddress.slice(0, 6)}...${delegateAddress.slice(-4)}`
        : delegateAddress,
      expiry,
      isActive: true
    });
    setDelegateAddress('');
    showToast(`Delegated for ${delegationDays} days!`, 'success', 'TFHE.delegateUserDecryption()');
  };

  const handleRevoke = () => {
    setDelegation(null);
    showToast('Delegation revoked!', 'success', 'TFHE.revokeUserDecryptionDelegation()');
  };

  const handleCheckExpiry = () => {
    if (delegation) {
      const daysLeft = Math.ceil((delegation.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      showToast(`Expires: ${delegation.expiry.toLocaleDateString()} (${daysLeft} days left)`, 'info', 'TFHE.getDelegatedUserDecryptionExpirationDate()');
    } else {
      showToast('No active delegation', 'warning');
    }
  };

  const handleCheckActive = () => {
    if (delegation?.isActive) {
      showToast('Delegation is ACTIVE', 'success', 'TFHE.isDelegatedForUserDecryption()');
    } else {
      showToast('No active delegation', 'warning');
    }
  };

  const loadDemo = () => {
    setHasStoredData(true);
    setStoredValue(75000);
    setDelegation({
      delegate: '0x9999...1234',
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true
    });
    showToast('Demo loaded: Alice with active delegation to accountant', 'success');
  };

  const resetDemo = () => {
    setHasStoredData(false);
    setStoredValue(75000);
    setDelegation(null);
    setDelegateAddress('');
    setDelegationDays(30);
    showToast('Demo reset', 'info');
  };

  // Calculate days remaining
  const daysRemaining = delegation
    ? Math.max(0, Math.ceil((delegation.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="dashboard">
      {/* Network Bar */}
      <div className="network-bar">
        <div className="network-status">
          {isConnected ? (
            <>
              <Wifi size={16} className="connected" />
              <span>{networkName}</span>
            </>
          ) : (
            <>
              <WifiOff size={16} className="disconnected" />
              <span>{networkName}</span>
            </>
          )}
        </div>
        <div className="mode-badge">
          <Zap size={14} />
          Interactive Demo
        </div>
        <div className="demo-buttons">
          <button className="demo-btn" onClick={loadDemo}>
            <Play size={14} />
            Load Demo
          </button>
          {(hasStoredData || delegation) && (
            <button className="reset-btn" onClick={resetDemo}>
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={16} />}
            {toast.type === 'info' && <Info size={16} />}
            {toast.type === 'warning' && <XCircle size={16} />}
            <div className="toast-content">
              <span>{toast.message}</span>
              {toast.fn && <small>{toast.fn}</small>}
            </div>
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-badge">FHEVM Feature Demo</div>
        <h2>User Decryption Delegation</h2>
        <p>Time-limited, revocable access to your encrypted data</p>
      </div>

      {/* The 4 Functions */}
      <div className="functions-grid">
        <div className={`function-card ${delegation ? 'used' : ''}`}>
          <div className="fn-number">1</div>
          <code>delegateUserDecryption()</code>
          <span>Grant time-limited access</span>
        </div>
        <div className="function-card">
          <div className="fn-number">2</div>
          <code>revokeUserDecryption...()</code>
          <span>Revoke access early</span>
        </div>
        <div className="function-card">
          <div className="fn-number">3</div>
          <code>getDelegated...Date()</code>
          <span>Check when it expires</span>
        </div>
        <div className="function-card">
          <div className="fn-number">4</div>
          <code>isDelegatedFor...()</code>
          <span>Check if active</span>
        </div>
      </div>

      {/* Tax Season Flow */}
      <div className="flow-section">
        <h3><FileText size={20} /> Tax Season Scenario</h3>
        <div className="flow-diagram">
          <div className={`flow-step ${hasStoredData ? 'completed' : ''}`}>
            <div className="step-icon alice">
              <Lock size={20} />
            </div>
            <span>Alice stores encrypted salary</span>
          </div>
          <ArrowRight size={24} className="flow-arrow" />
          <div className={`flow-step ${delegation ? 'completed' : ''}`}>
            <div className="step-icon delegate">
              <UserCheck size={20} />
            </div>
            <span>Delegates to accountant (30 days)</span>
          </div>
          <ArrowRight size={24} className="flow-arrow" />
          <div className="flow-step">
            <div className="step-icon accountant">
              <Unlock size={20} />
            </div>
            <span>Accountant decrypts & files taxes</span>
          </div>
          <ArrowRight size={24} className="flow-arrow" />
          <div className="flow-step">
            <div className="step-icon revoke">
              <UserX size={20} />
            </div>
            <span>Alice revokes or access expires</span>
          </div>
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="demo-section">
        <h3><Shield size={20} /> Interactive Demo</h3>

        {/* Step 1: Store Data */}
        <div className={`demo-card ${hasStoredData ? 'completed' : ''}`}>
          <div className="demo-header">
            <span className="step-badge">Step 1</span>
            <h4>Store Encrypted Data</h4>
            {hasStoredData && <CheckCircle size={18} className="step-check" />}
          </div>
          {!hasStoredData ? (
            <div className="demo-action">
              <p>First, store your encrypted salary on-chain</p>
              <div className="input-row">
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={storedValue}
                    onChange={(e) => setStoredValue(Number(e.target.value))}
                    placeholder="75000"
                    min="1"
                  />
                </div>
                <button className="action-btn primary" onClick={handleStoreData}>
                  <Lock size={16} />
                  Store Encrypted
                </button>
              </div>
            </div>
          ) : (
            <div className="demo-complete">
              <CheckCircle size={20} className="success" />
              <span>Data stored: <strong>${storedValue.toLocaleString()}</strong> (encrypted on-chain)</span>
            </div>
          )}
        </div>

        {/* Step 2: Delegate */}
        <div className={`demo-card ${!hasStoredData ? 'disabled' : ''} ${delegation ? 'completed' : ''}`}>
          <div className="demo-header">
            <span className="step-badge">Step 2</span>
            <h4>Delegate Decryption Rights</h4>
            {delegation && <CheckCircle size={18} className="step-check" />}
          </div>
          {!delegation ? (
            <div className="demo-action">
              <p>Allow your accountant to decrypt your salary for tax filing</p>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Accountant address (0x...)"
                  value={delegateAddress}
                  onChange={(e) => setDelegateAddress(e.target.value)}
                  disabled={!hasStoredData}
                />
                <div className="slider-row">
                  <label>
                    <Calendar size={14} />
                    Duration: <strong>{delegationDays} days</strong>
                    <span className="slider-hint">
                      (expires {new Date(Date.now() + delegationDays * 24 * 60 * 60 * 1000).toLocaleDateString()})
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="365"
                    value={delegationDays}
                    onChange={(e) => setDelegationDays(Number(e.target.value))}
                    disabled={!hasStoredData}
                  />
                </div>
              </div>
              <button
                className="action-btn primary full"
                onClick={handleDelegate}
                disabled={!hasStoredData}
              >
                <UserCheck size={16} />
                Delegate Access
              </button>
            </div>
          ) : (
            <div className="demo-complete">
              <CheckCircle size={20} className="success" />
              <span>Delegated to <strong>{delegation.delegate}</strong> for {daysRemaining} days</span>
            </div>
          )}
        </div>

        {/* Delegation Status */}
        {delegation && (
          <div className="delegation-status-card">
            <div className="status-header">
              <CheckCircle size={20} className="active" />
              <h4>Active Delegation</h4>
              <span className="days-badge">{daysRemaining} days left</span>
            </div>
            <div className="status-details">
              <div className="status-row">
                <span>Delegate:</span>
                <code>{delegation.delegate}</code>
              </div>
              <div className="status-row">
                <span>Expires:</span>
                <span className="expiry">{delegation.expiry.toLocaleDateString()}</span>
              </div>
              <div className="status-row">
                <span>Status:</span>
                <span className="active-badge">ACTIVE</span>
              </div>
            </div>
            <div className="status-actions">
              <button className="action-btn secondary" onClick={handleCheckExpiry}>
                <Clock size={16} />
                Check Expiry
              </button>
              <button className="action-btn secondary" onClick={handleCheckActive}>
                <CheckCircle size={16} />
                Check Active
              </button>
              <button className="action-btn danger" onClick={handleRevoke}>
                <XCircle size={16} />
                Revoke Access
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Why This Matters */}
      <div className="benefits-section">
        <h3>Why User Decryption Delegation?</h3>
        <div className="benefits-grid">
          <div className="benefit-card">
            <Clock size={24} />
            <h4>Time-Limited</h4>
            <p>Auto-expires after specified date</p>
          </div>
          <div className="benefit-card">
            <Shield size={24} />
            <h4>User-Controlled</h4>
            <p>Only you can delegate your data</p>
          </div>
          <div className="benefit-card">
            <XCircle size={24} />
            <h4>Revocable</h4>
            <p>Cancel anytime before expiry</p>
          </div>
          <div className="benefit-card">
            <Lock size={24} />
            <h4>Contract-Scoped</h4>
            <p>Only for specific contract data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
