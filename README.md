# User Decryption Delegation

<div align="center">

![FHEVM](https://img.shields.io/badge/FHEVM-Zama-purple?style=for-the-badge)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**The first example demonstrating User Decryption Delegation in FHEVM**

*Allow users to delegate their encrypted data access with time-limited, revocable permissions*

[Live Demo](https://fhevm-acl-example.vercel.app) · [Documentation](https://docs.zama.ai/fhevm)

</div>

---

## The Problem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   Alice has encrypted data on-chain.                                        │
│   She needs to share it with her accountant for tax filing.                 │
│                                                                             │
│   Traditional approaches fail:                                              │
│                                                                             │
│   ❌ Permanent access? Too risky - accountant keeps access forever          │
│   ❌ Admin controls sharing? Alice loses sovereignty over her data          │
│   ❌ Share the private key? Compromises all future data                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The Solution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   USER DECRYPTION DELEGATION                                                │
│                                                                             │
│   ✅ Time-limited    → Auto-expires after specified date                    │
│   ✅ User-controlled → Only the data owner can delegate                     │
│   ✅ Revocable       → Cancel anytime before expiry                         │
│   ✅ Contract-scoped → Only for specific contract's data                    │
│                                                                             │
│   Alice delegates for 30 days → Accountant files taxes → Access expires     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The 4 Functions

```solidity
// 1. DELEGATE: "Allow accountant to decrypt my data for 30 days"
TFHE.delegateUserDecryption(accountant, address(this), expiry);

// 2. REVOKE: "Remove access immediately"
TFHE.revokeUserDecryptionDelegation(accountant, address(this));

// 3. CHECK EXPIRY: "When does this delegation end?"
TFHE.getDelegatedUserDecryptionExpirationDate(alice, accountant, address(this));

// 4. IS ACTIVE: "Can accountant still decrypt?"
TFHE.isDelegatedForUserDecryption(alice, accountant, address(this), dataHandle);
```

## Quick Start

```bash
git clone https://github.com/Himess/fhevm-acl-example.git
cd fhevm-acl-example
```

## Contract

```solidity
contract UserDecryptionDelegation {

    mapping(address => euint64) private userData;

    // Delegate decryption rights
    function delegate(address delegate, uint64 durationDays) external {
        uint64 expiry = uint64(block.timestamp) + (durationDays * 1 days);
        TFHE.delegateUserDecryption(delegate, address(this), expiry);
    }

    // Revoke before expiry
    function revoke(address delegate) external {
        TFHE.revokeUserDecryptionDelegation(delegate, address(this));
    }

    // Check expiration
    function getExpiry(address delegator, address delegate) external view returns (uint64) {
        return TFHE.getDelegatedUserDecryptionExpirationDate(delegator, delegate, address(this));
    }

    // Check if active
    function isActive(address delegator, address delegate) external view returns (bool) {
        return TFHE.isDelegatedForUserDecryption(delegator, delegate, address(this), userData[delegator]);
    }
}
```

## Use Case: Tax Season

```
                    ┌──────────────────────────────────────┐
                    │         TAX SEASON FLOW              │
                    └──────────────────────────────────────┘

     ALICE                                           ACCOUNTANT
       │                                                  │
       │  1. Store encrypted salary                       │
       │  ─────────────────────────►                      │
       │                                                  │
       │  2. Delegate for 30 days                         │
       │  ════════════════════════════════════════════►   │
       │                                                  │
       │                              3. Request decrypt  │
       │                              via Gateway         │
       │                                   │              │
       │                                   ▼              │
       │                              ┌─────────┐         │
       │                              │ Gateway │         │
       │                              └─────────┘         │
       │                                   │              │
       │                              4. Receive salary   │
       │                              ◄────┘              │
       │                                                  │
       │  5. Taxes filed, revoke early                    │
       │  ════════════════════════════════════════════►   │
       │                                                  │
       │                              ❌ Access revoked   │
       │                                                  │
```

## Why This Matters

| Without Delegation | With Delegation |
|-------------------|-----------------|
| Admin controls who sees data | **User** controls their data |
| Permanent access only | **Time-limited** auto-expiry |
| Can't revoke without admin | **Instant** user-controlled revoke |
| All-or-nothing access | **Contract-scoped** granularity |

## Security

| Risk | Mitigation |
|------|------------|
| Long delegation periods | Enforce max duration (365 days) |
| Delegation to malicious contract | Delegate only to trusted EOAs |
| Front-running revocation | Use shorter expiry periods |

---

<div align="center">

**Zama Bounty Track Submission**

*User Decryption Delegation - Giving users control over their encrypted data*

</div>
