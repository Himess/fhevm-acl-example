import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import {
  Users,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  CheckCircle,
  XCircle,
  Briefcase,
  Calculator,
  Lock,
  Unlock,
  Zap,
  Wifi,
  WifiOff,
  Play
} from 'lucide-react';

type Role = 'hr' | 'employee' | 'accountant';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning';
  aclFunctions?: string[];
}

interface MockEmployee {
  address: string;
  name: string;
  salary: number;
  delegatedTo?: string;
  delegationExpiry?: Date;
}

export function Dashboard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [activeRole, setActiveRole] = useState<Role>('hr');
  const [delegateAddress, setDelegateAddress] = useState('');
  const [delegationDays, setDelegationDays] = useState(30);
  const [newEmployeeAddress, setNewEmployeeAddress] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastId, setToastId] = useState(0);

  // Mock mode state
  const [mockMode, setMockMode] = useState(true);
  const [mockEmployees, setMockEmployees] = useState<MockEmployee[]>([]);
  const [mockBudgetPublic, setMockBudgetPublic] = useState(false);
  const [mockCurrentEmployee, setMockCurrentEmployee] = useState<MockEmployee | null>(null);

  // Check if connected to supported network
  const isZamaNetwork = chainId === 9000 || chainId === 8009;
  const networkName = chainId === 9000 ? 'Zama Devnet' : chainId === 8009 ? 'Zama Testnet' : chainId === 11155111 ? 'Sepolia' : 'Unknown';

  // Toast helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning', aclFunctions?: string[]) => {
    const id = toastId + 1;
    setToastId(id);
    setToasts(prev => [...prev, { id, message, type, aclFunctions }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Load demo data
  const loadDemoData = () => {
    const demoEmployees: MockEmployee[] = [
      { address: '0x1234...5678', name: 'Alice', salary: 75000 },
      { address: '0x8765...4321', name: 'Bob', salary: 85000 },
      { address: '0xabcd...efgh', name: 'Carol', salary: 95000, delegatedTo: '0x9999...1111', delegationExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    ];
    setMockEmployees(demoEmployees);
    setMockCurrentEmployee(demoEmployees[0]);
    setMockBudgetPublic(false);
    showToast('Demo data loaded! 3 employees added.', 'success', ['FHE.allow()', 'FHE.allowThis()']);
  };

  // Mock handlers
  const handleMockAddEmployee = () => {
    if (!newEmployeeAddress || !salaryAmount) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
    const newEmployee: MockEmployee = {
      address: newEmployeeAddress.slice(0, 6) + '...' + newEmployeeAddress.slice(-4),
      name: `Employee ${mockEmployees.length + 1}`,
      salary: parseInt(salaryAmount),
    };
    setMockEmployees(prev => [...prev, newEmployee]);
    setNewEmployeeAddress('');
    setSalaryAmount('');
    showToast(`Employee added with salary $${salaryAmount}`, 'success', ['FHE.allow()', 'FHE.allowThis()']);
  };

  const handleMockRevealBudget = () => {
    setMockBudgetPublic(true);
    showToast('Budget revealed publicly!', 'success', ['FHE.makePubliclyDecryptable()']);
  };

  const handleMockDelegate = () => {
    if (!delegateAddress || !mockCurrentEmployee) {
      showToast('Please enter delegate address', 'warning');
      return;
    }
    const updated = { ...mockCurrentEmployee, delegatedTo: delegateAddress, delegationExpiry: new Date(Date.now() + delegationDays * 24 * 60 * 60 * 1000) };
    setMockCurrentEmployee(updated);
    setMockEmployees(prev => prev.map(e => e.address === mockCurrentEmployee.address ? updated : e));
    showToast(`Delegated to ${delegateAddress.slice(0, 8)}... for ${delegationDays} days`, 'success', ['FHE.delegateUserDecryption()']);
  };

  const handleMockRevoke = () => {
    if (!mockCurrentEmployee) return;
    const updated = { ...mockCurrentEmployee, delegatedTo: undefined, delegationExpiry: undefined };
    setMockCurrentEmployee(updated);
    setMockEmployees(prev => prev.map(e => e.address === mockCurrentEmployee.address ? updated : e));
    showToast('Delegation revoked', 'success', ['FHE.revokeUserDecryptionDelegation()']);
  };

  const totalBudget = mockEmployees.reduce((sum, e) => sum + e.salary, 0);

  return (
    <div className="dashboard">
      {/* Network Status Bar */}
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
              <span>Not Connected</span>
            </>
          )}
        </div>
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mockMode ? 'active' : ''}`}
            onClick={() => setMockMode(true)}
          >
            <Zap size={14} />
            Mock Mode
          </button>
          <button
            className={`mode-btn ${!mockMode ? 'active' : ''}`}
            onClick={() => setMockMode(false)}
            disabled={!isZamaNetwork}
            title={!isZamaNetwork ? 'Connect to Zama network' : ''}
          >
            <Shield size={14} />
            Live Mode
          </button>
        </div>
        <button className="demo-btn" onClick={loadDemoData}>
          <Play size={14} />
          Load Demo
        </button>
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <CheckCircle size={16} />
            <div className="toast-content">
              <span>{toast.message}</span>
              {toast.aclFunctions && (
                <small>ACL: {toast.aclFunctions.join(', ')}</small>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Role Selector */}
      <div className="role-selector">
        <button
          className={`role-btn ${activeRole === 'hr' ? 'active' : ''}`}
          onClick={() => setActiveRole('hr')}
        >
          <Briefcase size={20} />
          HR Manager
        </button>
        <button
          className={`role-btn ${activeRole === 'employee' ? 'active' : ''}`}
          onClick={() => { setActiveRole('employee'); if (mockEmployees.length > 0) setMockCurrentEmployee(mockEmployees[0]); }}
        >
          <Users size={20} />
          Employee
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
            <span className="stat-value">{mockMode ? mockEmployees.length : '0'}</span>
            <span className="stat-label">Employees</span>
          </div>
        </div>
        <div className="stat-card">
          <Shield size={24} />
          <div className="stat-content">
            <span className="stat-value">{mockMode ? (mockBudgetPublic ? 'Public' : 'Private') : 'Private'}</span>
            <span className="stat-label">Budget Status</span>
          </div>
        </div>
        <div className="stat-card">
          <Lock size={24} />
          <div className="stat-content">
            <span className="stat-value">{mockMode && mockBudgetPublic ? `$${totalBudget.toLocaleString()}` : '••••••'}</span>
            <span className="stat-label">Total Budget</span>
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
            <button className="action-btn primary" onClick={handleMockAddEmployee}>
              <UserPlus size={16} />
              Add Employee
            </button>
          </div>

          {mockEmployees.length > 0 && (
            <div className="action-card">
              <h4>Employee List</h4>
              <div className="employee-list">
                {mockEmployees.map((emp, i) => (
                  <div key={i} className="employee-item">
                    <span className="emp-name">{emp.name}</span>
                    <span className="emp-address">{emp.address}</span>
                    <span className="emp-salary">${emp.salary.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="action-card">
            <h4>Reveal Total Budget</h4>
            <p className="description">Make budget publicly decryptable (ACL #6)</p>
            <button
              className="action-btn danger"
              onClick={handleMockRevealBudget}
              disabled={mockBudgetPublic}
            >
              {mockBudgetPublic ? (
                <>
                  <Eye size={16} />
                  Already Public (${totalBudget.toLocaleString()})
                </>
              ) : (
                <>
                  <Unlock size={16} />
                  Reveal Budget
                </>
              )}
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

          {mockEmployees.length > 0 && (
            <div className="action-card">
              <h4>Select Employee</h4>
              <div className="employee-select">
                {mockEmployees.map((emp, i) => (
                  <button
                    key={i}
                    className={`emp-select-btn ${mockCurrentEmployee?.address === emp.address ? 'active' : ''}`}
                    onClick={() => setMockCurrentEmployee(emp)}
                  >
                    {emp.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="action-card">
            <h4>My Salary</h4>
            <p className="description">View your encrypted salary (ACL #4, #5)</p>
            <div className="salary-display">
              {mockCurrentEmployee ? (
                <>
                  <Eye size={24} />
                  <span>${mockCurrentEmployee.salary.toLocaleString()}</span>
                  <small>Decrypted via FHE.isSenderAllowed()</small>
                </>
              ) : (
                <>
                  <EyeOff size={24} />
                  <span>••••••</span>
                  <small>Load demo or add employee first</small>
                </>
              )}
            </div>
          </div>

          <div className="action-card highlight">
            <h4>Delegate Salary Access</h4>
            <p className="description">Allow someone to decrypt your salary (ACL #8) - <strong>Unique Feature!</strong></p>
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
            {mockCurrentEmployee?.delegatedTo && (
              <div className="delegation-status">
                <CheckCircle size={14} className="active" />
                <span>Delegated to {mockCurrentEmployee.delegatedTo}</span>
                <small>Expires: {mockCurrentEmployee.delegationExpiry?.toLocaleDateString()}</small>
              </div>
            )}
            <div className="btn-group">
              <button
                className="action-btn primary"
                onClick={handleMockDelegate}
                disabled={!mockCurrentEmployee}
              >
                <CheckCircle size={16} />
                Delegate Access
              </button>
              <button
                className="action-btn danger"
                onClick={handleMockRevoke}
                disabled={!mockCurrentEmployee?.delegatedTo}
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
            <div className="status-display">
              {mockEmployees.filter(e => e.delegatedTo).map((emp, i) => (
                <div key={i} className="delegation-item">
                  <div className="status-item">
                    <span>{emp.name} delegated access:</span>
                    <span className="status active">
                      <CheckCircle size={14} /> Active
                    </span>
                  </div>
                  <div className="status-item">
                    <span>Expiration:</span>
                    <span className="status">{emp.delegationExpiry?.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {mockEmployees.filter(e => e.delegatedTo).length === 0 && (
                <div className="status-item">
                  <span>No active delegations</span>
                  <span className="status pending">Employee must delegate first</span>
                </div>
              )}
            </div>
          </div>

          <div className="action-card">
            <h4>View Delegated Salaries</h4>
            <p className="description">Decrypt salary if delegation is active</p>
            {mockEmployees.filter(e => e.delegatedTo).map((emp, i) => (
              <div key={i} className="salary-display delegated">
                <Eye size={24} />
                <span>${emp.salary.toLocaleString()}</span>
                <small>{emp.name}'s salary (delegated)</small>
              </div>
            ))}
            {mockEmployees.filter(e => e.delegatedTo).length === 0 && (
              <div className="salary-display">
                <Lock size={24} />
                <span>Access Required</span>
                <small>Employee must delegate access first</small>
              </div>
            )}
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
    </div>
  );
}
