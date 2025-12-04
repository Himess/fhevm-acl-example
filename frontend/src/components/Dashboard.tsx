import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONFIDENTIAL_SALARY_ABI, CONTRACT_ADDRESS } from '../config/contract';
import {
  Users,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Briefcase,
  Calculator,
  Lock,
  Unlock
} from 'lucide-react';

type Role = 'hr' | 'employee' | 'accountant';

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const [activeRole, setActiveRole] = useState<Role>('hr');
  const [delegateAddress, setDelegateAddress] = useState('');
  const [delegationDays, setDelegationDays] = useState(30);
  const [newEmployeeAddress, setNewEmployeeAddress] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');

  // Contract reads
  const { data: hrManager } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONFIDENTIAL_SALARY_ABI,
    functionName: 'hrManager',
  });

  const { data: employeeCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONFIDENTIAL_SALARY_ABI,
    functionName: 'getEmployeeCount',
  });

  const { data: isBudgetPublic } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONFIDENTIAL_SALARY_ABI,
    functionName: 'isBudgetPublic',
  });

  const { data: isUserEmployee } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONFIDENTIAL_SALARY_ABI,
    functionName: 'isEmployee',
    args: address ? [address] : undefined,
  });

  const { data: canAccessBudget } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONFIDENTIAL_SALARY_ABI,
    functionName: 'canAccessBudget',
  });

  // Contract writes
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isHR = address && hrManager && address.toLowerCase() === hrManager.toLowerCase();

  const handleRevealBudget = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONFIDENTIAL_SALARY_ABI,
      functionName: 'revealTotalBudget',
    });
  };

  const handleDelegate = () => {
    if (!delegateAddress) return;
    const expiry = BigInt(Math.floor(Date.now() / 1000) + delegationDays * 24 * 60 * 60);
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONFIDENTIAL_SALARY_ABI,
      functionName: 'delegateSalaryAccess',
      args: [delegateAddress as `0x${string}`, expiry],
    });
  };

  const handleRevoke = () => {
    if (!delegateAddress) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONFIDENTIAL_SALARY_ABI,
      functionName: 'revokeSalaryDelegation',
      args: [delegateAddress as `0x${string}`],
    });
  };

  if (!isConnected) {
    return (
      <div className="connect-prompt">
        <Lock size={48} />
        <h2>Connect Your Wallet</h2>
        <p>Connect your wallet to interact with the Confidential Salary contract</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Role Selector */}
      <div className="role-selector">
        <button
          className={`role-btn ${activeRole === 'hr' ? 'active' : ''}`}
          onClick={() => setActiveRole('hr')}
        >
          <Briefcase size={20} />
          HR Manager
          {isHR && <span className="badge">You</span>}
        </button>
        <button
          className={`role-btn ${activeRole === 'employee' ? 'active' : ''}`}
          onClick={() => setActiveRole('employee')}
        >
          <Users size={20} />
          Employee
          {isUserEmployee && <span className="badge">You</span>}
        </button>
        <button
          className={`role-btn ${activeRole === 'accountant' ? 'active' : ''}`}
          onClick={() => setActiveRole('accountant')}
        >
          <Calculator size={20} />
          Accountant
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <Users size={24} />
          <div className="stat-content">
            <span className="stat-value">{employeeCount?.toString() || '0'}</span>
            <span className="stat-label">Employees</span>
          </div>
        </div>
        <div className="stat-card">
          <Shield size={24} />
          <div className="stat-content">
            <span className="stat-value">{isBudgetPublic ? 'Public' : 'Private'}</span>
            <span className="stat-label">Budget Status</span>
          </div>
        </div>
        <div className="stat-card">
          <Lock size={24} />
          <div className="stat-content">
            <span className="stat-value">{canAccessBudget ? 'Yes' : 'No'}</span>
            <span className="stat-label">Budget Access</span>
          </div>
        </div>
      </div>

      {/* Role Panels */}
      {activeRole === 'hr' && (
        <div className="panel hr-panel">
          <h3><Briefcase size={20} /> HR Manager Panel</h3>

          <div className="action-card">
            <h4>Add New Employee</h4>
            <p className="description">Add an employee with encrypted salary (ACL #1, #2)</p>
            <div className="input-group">
              <input
                type="text"
                placeholder="Employee Address (0x...)"
                value={newEmployeeAddress}
                onChange={(e) => setNewEmployeeAddress(e.target.value)}
              />
              <input
                type="number"
                placeholder="Salary Amount"
                value={salaryAmount}
                onChange={(e) => setSalaryAmount(e.target.value)}
              />
            </div>
            <button className="action-btn" disabled>
              <UserPlus size={16} />
              Add Employee (requires FHEVM)
            </button>
          </div>

          <div className="action-card">
            <h4>Reveal Total Budget</h4>
            <p className="description">Make budget publicly decryptable (ACL #6)</p>
            <button
              className="action-btn danger"
              onClick={handleRevealBudget}
              disabled={isPending || isConfirming || isBudgetPublic === true}
            >
              {isBudgetPublic ? (
                <>
                  <Eye size={16} />
                  Already Public
                </>
              ) : (
                <>
                  <Unlock size={16} />
                  {isPending ? 'Confirming...' : 'Reveal Budget'}
                </>
              )}
            </button>
          </div>

          <div className="action-card">
            <h4>Grant Temporary Access</h4>
            <p className="description">Same-transaction access (ACL #3: allowTransient)</p>
            <div className="input-group">
              <input type="text" placeholder="Employee Address" />
              <input type="text" placeholder="Viewer Address" />
            </div>
            <button className="action-btn" disabled>
              <Clock size={16} />
              Grant Access (in-tx only)
            </button>
          </div>

          <div className="acl-info">
            <h4>ACL Functions Used:</h4>
            <ul>
              <li><CheckCircle size={14} /> FHE.allow() - Grant permanent access</li>
              <li><CheckCircle size={14} /> FHE.allowThis() - Contract self-access</li>
              <li><CheckCircle size={14} /> FHE.allowTransient() - Same-tx access</li>
              <li><CheckCircle size={14} /> FHE.makePubliclyDecryptable() - Reveal budget</li>
            </ul>
          </div>
        </div>
      )}

      {activeRole === 'employee' && (
        <div className="panel employee-panel">
          <h3><Users size={20} /> Employee Panel</h3>

          <div className="action-card">
            <h4>My Salary</h4>
            <p className="description">View your encrypted salary (ACL #4, #5)</p>
            <div className="salary-display">
              <EyeOff size={24} />
              <span>••••••</span>
              <small>Encrypted - Connect to FHEVM to decrypt</small>
            </div>
          </div>

          <div className="action-card highlight">
            <h4>Delegate Salary Access</h4>
            <p className="description">Allow someone to decrypt your salary (ACL #8)</p>
            <div className="input-group">
              <input
                type="text"
                placeholder="Delegate Address (0x...)"
                value={delegateAddress}
                onChange={(e) => setDelegateAddress(e.target.value)}
              />
              <div className="slider-group">
                <label>Duration: {delegationDays} days</label>
                <input
                  type="range"
                  min="1"
                  max="365"
                  value={delegationDays}
                  onChange={(e) => setDelegationDays(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="btn-group">
              <button
                className="action-btn primary"
                onClick={handleDelegate}
                disabled={isPending || isConfirming || !delegateAddress}
              >
                <CheckCircle size={16} />
                {isPending ? 'Confirming...' : 'Delegate Access'}
              </button>
              <button
                className="action-btn danger"
                onClick={handleRevoke}
                disabled={isPending || isConfirming || !delegateAddress}
              >
                <XCircle size={16} />
                Revoke
              </button>
            </div>
          </div>

          <div className="acl-info">
            <h4>ACL Functions Used:</h4>
            <ul>
              <li><CheckCircle size={14} /> FHE.isAllowed() - Check access</li>
              <li><CheckCircle size={14} /> FHE.isSenderAllowed() - Verify caller</li>
              <li><CheckCircle size={14} className="highlight" /> FHE.delegateUserDecryption() - Delegate!</li>
              <li><CheckCircle size={14} className="highlight" /> FHE.revokeUserDecryptionDelegation()</li>
            </ul>
          </div>
        </div>
      )}

      {activeRole === 'accountant' && (
        <div className="panel accountant-panel">
          <h3><Calculator size={20} /> Accountant Panel</h3>

          <div className="action-card">
            <h4>Delegated Access Status</h4>
            <p className="description">Check if you have delegated access (ACL #10, #11)</p>
            <div className="input-group">
              <input
                type="text"
                placeholder="Employee Address (who delegated)"
                value={delegateAddress}
                onChange={(e) => setDelegateAddress(e.target.value)}
              />
            </div>
            <div className="status-display">
              <div className="status-item">
                <span>Delegation Active:</span>
                <span className="status pending">Check on FHEVM</span>
              </div>
              <div className="status-item">
                <span>Expiration:</span>
                <span className="status">-</span>
              </div>
            </div>
          </div>

          <div className="action-card">
            <h4>View Delegated Salary</h4>
            <p className="description">Decrypt salary if delegation is active</p>
            <div className="salary-display">
              <Lock size={24} />
              <span>Access Required</span>
              <small>Employee must delegate access first</small>
            </div>
          </div>

          <div className="acl-info">
            <h4>ACL Functions Used:</h4>
            <ul>
              <li><CheckCircle size={14} className="highlight" /> FHE.isDelegatedForUserDecryption()</li>
              <li><CheckCircle size={14} className="highlight" /> FHE.getDelegatedUserDecryptionExpirationDate()</li>
            </ul>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {(isPending || isConfirming || isSuccess) && (
        <div className={`tx-status ${isSuccess ? 'success' : ''}`}>
          {isPending && <span>Waiting for confirmation...</span>}
          {isConfirming && <span>Transaction confirming...</span>}
          {isSuccess && <span>Transaction successful!</span>}
        </div>
      )}
    </div>
  );
}
