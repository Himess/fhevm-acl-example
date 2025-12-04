// Contract ABI - ConfidentialSalary
export const CONFIDENTIAL_SALARY_ABI = [
  // View functions
  {
    inputs: [],
    name: 'owner',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'hrManager',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getEmployeeCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'employee', type: 'address' }],
    name: 'isEmployee',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isBudgetPublic',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isBudgetPubliclyDecryptable',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'canAccessBudget',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'employee', type: 'address' }],
    name: 'canAccessSalary',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getMySalary',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'delegator', type: 'address' },
      { name: 'delegate', type: 'address' },
    ],
    name: 'isDelegationActive',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'delegator', type: 'address' },
      { name: 'delegate', type: 'address' },
    ],
    name: 'getDelegationExpiration',
    outputs: [{ type: 'uint64' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [
      { name: 'employee', type: 'address' },
      { name: 'encryptedSalary', type: 'bytes32' },
      { name: 'inputProof', type: 'bytes' },
    ],
    name: 'addEmployee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'employee', type: 'address' },
      { name: 'viewer', type: 'address' },
    ],
    name: 'grantTemporaryAccess',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'revealTotalBudget',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'newHR', type: 'address' }],
    name: 'changeHRManager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'delegate', type: 'address' },
      { name: 'expiry', type: 'uint64' },
    ],
    name: 'delegateSalaryAccess',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'delegate', type: 'address' }],
    name: 'revokeSalaryDelegation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'employee', type: 'address' },
      { indexed: false, name: 'addedBy', type: 'address' },
    ],
    name: 'EmployeeAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'employee', type: 'address' },
      { indexed: true, name: 'viewer', type: 'address' },
    ],
    name: 'TemporaryAccessGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'BudgetRevealed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'oldHR', type: 'address' },
      { indexed: true, name: 'newHR', type: 'address' },
    ],
    name: 'HRManagerChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'employee', type: 'address' },
      { indexed: true, name: 'delegate', type: 'address' },
      { indexed: false, name: 'expiry', type: 'uint64' },
    ],
    name: 'DelegationGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'employee', type: 'address' },
      { indexed: true, name: 'delegate', type: 'address' },
    ],
    name: 'DelegationRevoked',
    type: 'event',
  },
] as const;

// Demo contract address (replace with deployed address)
export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;
