# FHEVM User Decryption Delegation Example

![Tests](https://img.shields.io/badge/tests-32%20passing-brightgreen)
![Feature](https://img.shields.io/badge/feature-User%20Delegation-purple)
![Solidity](https://img.shields.io/badge/solidity-0.8.24-blue)

> **The only example demonstrating User Decryption Delegation** - allowing users to delegate their encrypted data access to third parties with time-limited permissions.

## Live Demo

**[Try the Interactive Demo](https://fhevm-acl-example.vercel.app)** - No wallet required, mock mode available!

## The Feature: User Decryption Delegation

This example demonstrates the **4 delegation functions** that enable user-controlled data sharing:

```solidity
// 1. Delegate: Allow someone to decrypt your data
FHE.delegateUserDecryption(delegate, contractAddress, expiryTimestamp);

// 2. Revoke: Cancel access before expiry
FHE.revokeUserDecryptionDelegation(delegate, contractAddress);

// 3. Check Expiry: When does access end?
FHE.getDelegatedUserDecryptionExpirationDate(delegator, delegate, contract);

// 4. Verify: Is delegation currently active?
FHE.isDelegatedForUserDecryption(delegator, delegate, contract, handle);
```

## Real-World Use Case: Tax Season

```
┌─────────────────────────────────────────────────────────────────┐
│                     TAX SEASON SCENARIO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Alice (Employee) has encrypted salary on-chain                 │
│                                                                 │
│  Tax season arrives - she needs to share with accountant:       │
│                                                                 │
│  1. Alice delegates for 30 days:                                │
│     delegateSalaryAccess(accountant, 30 days)                   │
│                                                                 │
│  2. Accountant can now decrypt Alice's salary                   │
│                                                                 │
│  3. After filing, Alice revokes early:                          │
│     revokeSalaryDelegation(accountant)                          │
│                                                                 │
│  Key Properties:                                                │
│  • Time-limited (auto-expires)                                  │
│  • User-controlled (not employer)                               │
│  • Revocable anytime                                            │
│  • Contract-scoped                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Clone and install
git clone https://github.com/Himess/fhevm-acl-example.git
cd fhevm-acl-example

# Run tests (from library-solidity)
npm install
npm run compile
npx hardhat test test/confidentialSalary/ConfidentialSalary.ts
```

## Contract Implementation

```solidity
// Employee delegates salary access to accountant
function delegateSalaryAccess(address delegate, uint64 expiry) external {
    require(isEmployee[msg.sender], "Not an employee");
    require(delegate != address(0), "Invalid address");

    // THE KEY FUNCTION - User Decryption Delegation
    FHE.delegateUserDecryption(delegate, address(this), expiry);

    emit DelegationGranted(msg.sender, delegate, expiry);
}

// Employee revokes access before expiry
function revokeSalaryDelegation(address delegate) external {
    require(isEmployee[msg.sender], "Not an employee");

    FHE.revokeUserDecryptionDelegation(delegate, address(this));

    emit DelegationRevoked(msg.sender, delegate);
}

// Check if delegation is active
function isDelegationActive(address delegator, address delegate) external view returns (bool) {
    euint64 salaryHandle = salaries[delegator];
    return FHE.isDelegatedForUserDecryption(delegator, delegate, address(this), salaryHandle);
}
```

## Why User Decryption Delegation?

| Traditional Access | User Delegation |
|--------------------|-----------------|
| Admin controls who sees data | **User** controls who sees their data |
| Permanent access grants | **Time-limited** with auto-expiry |
| Requires admin to revoke | User can **revoke anytime** |
| All-or-nothing | **Contract-scoped** (only specific data) |

## Test Results

```
  User Decryption Delegation
    ✓ should delegate salary access to accountant
    ✓ should revoke delegation before expiry
    ✓ should check delegation expiration date
    ✓ should verify active delegation status
    ✓ should revert delegation for non-employee
    ✓ should revert delegation to zero address

  32 passing
```

## Project Structure

```
├── contracts/
│   └── ConfidentialSalary.sol    # Delegation implementation
├── test/
│   └── ConfidentialSalary.ts     # Comprehensive tests
├── frontend/                      # Interactive demo
└── README.md
```

## Security Considerations

### Delegation Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Long expiry periods | Enforce MAX_DELEGATION_PERIOD |
| Delegation to malicious contract | Users should delegate to known EOAs |
| Front-running revocation | Use shorter expiry periods |

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [ACL Guide](https://docs.zama.ai/fhevm/fundamentals/acl)

---

**Zama Bounty Track Submission** - User Decryption Delegation Example
