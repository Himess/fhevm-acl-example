# FHEVM Access Control (ACL) Example

> Standalone example demonstrating **all 11 ACL functions** in Zama's FHEVM - including the **User Decryption Delegation** feature that no other example covers.

## What Makes This Example Unique?

Most FHEVM examples only show 7 basic ACL functions. This example demonstrates **all 11**, including the advanced **User Decryption Delegation** system:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   BASIC ACL (Functions 1-7)          USER DECRYPTION DELEGATION (8-11) │
│   ─────────────────────────          ─────────────────────────────────  │
│   ✓ Most examples cover these        ✗ NO other example covers these   │
│                                                                         │
│   • allow()                          • delegateUserDecryption()         │
│   • allowThis()                      • revokeUserDecryptionDelegation() │
│   • allowTransient()                 • getDelegatedUserDecryption...()  │
│   • isAllowed()                      • isDelegatedForUserDecryption()   │
│   • isSenderAllowed()                                                   │
│   • makePubliclyDecryptable()        Real-world use case:               │
│   • isPubliclyDecryptable()          Employee → Accountant delegation   │
│                                      for tax season (time-limited)      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# From library-solidity root
npm install
npm run compile

# Run tests (27 tests, all passing)
npx hardhat test test/confidentialSalary/ConfidentialSalary.ts
```

## The Use Case: Confidential Salary System

A practical HR system where:
- **HR Manager** sees all salaries
- **Employee** sees only their own salary
- **Employee can delegate** decryption rights to accountant/lawyer (time-limited!)
- **Total budget** can be revealed publicly for audits

## User Decryption Delegation - The Key Feature

This is what sets this example apart. Real-world scenario:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TAX SEASON SCENARIO                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Alice (employee) needs to share salary with her accountant          │
│                                                                         │
│  2. Alice delegates for 30 days:                                        │
│     ┌─────────────────────────────────────────────────────────────┐     │
│     │ delegateSalaryAccess(accountantAddr, block.timestamp + 30 days)   │
│     │                                                             │     │
│     │ → Calls FHE.delegateUserDecryption() internally             │     │
│     └─────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  3. Accountant can now request decryption via Gateway                   │
│                                                                         │
│  4. After filing taxes, Alice revokes early:                            │
│     ┌─────────────────────────────────────────────────────────────┐     │
│     │ revokeSalaryDelegation(accountantAddr)                      │     │
│     │                                                             │     │
│     │ → Calls FHE.revokeUserDecryptionDelegation() internally     │     │
│     └─────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  Key benefits:                                                          │
│  • Time-limited (auto-expires)                                          │
│  • User-controlled (not HR)                                             │
│  • Contract-scoped (only this contract's data)                          │
│  • Revocable (can cancel anytime)                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Delegation Functions (8-11)

```solidity
// ACL #8: Delegate decryption rights
function delegateSalaryAccess(address delegate, uint64 expiry) external onlyEmployee {
    FHE.delegateUserDecryption(delegate, address(this), expiry);
}

// ACL #9: Revoke before expiry
function revokeSalaryDelegation(address delegate) external onlyEmployee {
    FHE.revokeUserDecryptionDelegation(delegate, address(this));
}

// ACL #10: Check expiration
function getDelegationExpiration(address delegator, address delegate) external view returns (uint64) {
    return FHE.getDelegatedUserDecryptionExpirationDate(delegator, delegate, address(this));
}

// ACL #11: Check if active
function isDelegationActive(address delegator, address delegate) external view returns (bool) {
    return FHE.isDelegatedForUserDecryption(delegator, delegate, address(this), handle);
}
```

## All 11 ACL Functions

| # | Function | Category | Shown in Other Examples? |
|---|----------|----------|--------------------------|
| 1 | `FHE.allow()` | Basic | Yes |
| 2 | `FHE.allowThis()` | Basic | Yes |
| 3 | `FHE.allowTransient()` | Basic | Sometimes |
| 4 | `FHE.isAllowed()` | Checking | Yes |
| 5 | `FHE.isSenderAllowed()` | Checking | Sometimes |
| 6 | `FHE.makePubliclyDecryptable()` | Public | Sometimes |
| 7 | `FHE.isPubliclyDecryptable()` | Public | Rarely |
| 8 | `FHE.delegateUserDecryption()` | **Delegation** | **NO** |
| 9 | `FHE.revokeUserDecryptionDelegation()` | **Delegation** | **NO** |
| 10 | `FHE.getDelegatedUserDecryptionExpirationDate()` | **Delegation** | **NO** |
| 11 | `FHE.isDelegatedForUserDecryption()` | **Delegation** | **NO** |

## Access Control Matrix

```
    ┌─────────────┬───────────┬────────────┬─────────────┬──────────────┐
    │ Role        │ Own Salary│ All Salary │ Total Budget│ How?         │
    ├─────────────┼───────────┼────────────┼─────────────┼──────────────┤
    │ HR Manager  │ N/A       │ Yes        │ Yes         │ FHE.allow()  │
    │ Employee    │ Yes       │ No         │ No          │ FHE.allow()  │
    │ Accountant  │ N/A       │ Delegated  │ No          │ delegation!  │
    │ Public      │ No        │ No         │ If revealed │ makePublic() │
    └─────────────┴───────────┴────────────┴─────────────┴──────────────┘
```

## Project Structure

```
acl-access-control/
├── contracts/ConfidentialSalary.sol  # All 11 ACL functions
├── test/ConfidentialSalary.t.sol     # Comprehensive tests
└── README.md
```

## Resources

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM ACL Guide](https://docs.zama.ai/fhevm/fundamentals/acl)

---

**Zama Bounty Track Submission**

| Metric | Value |
|--------|-------|
| ACL Functions | 11/11 (100%) |
| User Decryption Delegation | **Yes** (unique!) |
| Real-world use case | Confidential Salary |
| Setup time | < 5 minutes |
