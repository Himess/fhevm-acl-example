// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/config/ZamaFHEVMConfig.sol";
import "fhevm/gateway/GatewayCaller.sol";

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║     ██╗   ██╗███████╗███████╗██████╗                                      ║
 * ║     ██║   ██║██╔════╝██╔════╝██╔══██╗                                     ║
 * ║     ██║   ██║███████╗█████╗  ██████╔╝                                     ║
 * ║     ██║   ██║╚════██║██╔══╝  ██╔══██╗                                     ║
 * ║     ╚██████╔╝███████║███████╗██║  ██║                                     ║
 * ║      ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝                                     ║
 * ║                                                                           ║
 * ║     ██████╗ ███████╗ ██████╗██████╗ ██╗   ██╗██████╗ ████████╗            ║
 * ║     ██╔══██╗██╔════╝██╔════╝██╔══██╗╚██╗ ██╔╝██╔══██╗╚══██╔══╝            ║
 * ║     ██║  ██║█████╗  ██║     ██████╔╝ ╚████╔╝ ██████╔╝   ██║               ║
 * ║     ██║  ██║██╔══╝  ██║     ██╔══██╗  ╚██╔╝  ██╔═══╝    ██║               ║
 * ║     ██████╔╝███████╗╚██████╗██║  ██║   ██║   ██║        ██║               ║
 * ║     ╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝        ╚═╝               ║
 * ║                                                                           ║
 * ║     ██████╗ ███████╗██╗     ███████╗ ██████╗  █████╗ ████████╗            ║
 * ║     ██╔══██╗██╔════╝██║     ██╔════╝██╔════╝ ██╔══██╗╚══██╔══╝            ║
 * ║     ██║  ██║█████╗  ██║     █████╗  ██║  ███╗███████║   ██║               ║
 * ║     ██║  ██║██╔══╝  ██║     ██╔══╝  ██║   ██║██╔══██║   ██║               ║
 * ║     ██████╔╝███████╗███████╗███████╗╚██████╔╝██║  ██║   ██║               ║
 * ║     ╚═════╝ ╚══════╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝               ║
 * ║                                                                           ║
 * ║                    FHEVM User Decryption Delegation                       ║
 * ║                      Zama Bounty Track Submission                         ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * @title UserDecryptionDelegation
 * @notice Demonstrates the 4 User Decryption Delegation functions in FHEVM
 * @dev The only example showcasing this powerful privacy feature
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                                                                             │
 * │   THE PROBLEM:                                                              │
 * │   ────────────                                                              │
 * │   Alice has encrypted data on-chain. She needs to temporarily share        │
 * │   it with her accountant for tax filing, but:                              │
 * │                                                                             │
 * │   ❌ She doesn't want to give permanent access                              │
 * │   ❌ She doesn't want the contract admin to control her data sharing        │
 * │   ❌ She wants to revoke access anytime                                     │
 * │                                                                             │
 * │   THE SOLUTION: User Decryption Delegation                                  │
 * │   ────────────────────────────────────────                                  │
 * │                                                                             │
 * │   ✅ Time-limited: Auto-expires after specified date                        │
 * │   ✅ User-controlled: Only the data owner can delegate                      │
 * │   ✅ Revocable: Can cancel anytime before expiry                            │
 * │   ✅ Contract-scoped: Only for specific contract's data                     │
 * │                                                                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * THE 4 DELEGATION FUNCTIONS:
 * ───────────────────────────
 *
 *   1. TFHE.delegateUserDecryption(delegate, contract, expiry)
 *      → "I allow this address to decrypt my data until this date"
 *
 *   2. TFHE.revokeUserDecryptionDelegation(delegate, contract)
 *      → "I revoke access before the expiry date"
 *
 *   3. TFHE.getDelegatedUserDecryptionExpirationDate(delegator, delegate, contract)
 *      → "When does this delegation expire?"
 *
 *   4. TFHE.isDelegatedForUserDecryption(delegator, delegate, contract, handle)
 *      → "Is this delegation currently active for this data?"
 */
contract UserDecryptionDelegation is SepoliaZamaFHEVMConfig, GatewayCaller {

    // ══════════════════════════════════════════════════════════════════════════
    //                              STATE
    // ══════════════════════════════════════════════════════════════════════════

    /// @notice User's encrypted private data
    mapping(address => euint64) private userData;

    /// @notice Track registered users
    mapping(address => bool) public hasData;

    // ══════════════════════════════════════════════════════════════════════════
    //                              EVENTS
    // ══════════════════════════════════════════════════════════════════════════

    event DataStored(address indexed user);
    event DelegationGranted(address indexed delegator, address indexed delegate, uint64 expiry);
    event DelegationRevoked(address indexed delegator, address indexed delegate);

    // ══════════════════════════════════════════════════════════════════════════
    //                         STORE DATA
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Store encrypted data
     * @param encryptedData The encrypted value
     * @param inputProof Proof of encryption
     */
    function storeData(einput encryptedData, bytes calldata inputProof) external {
        euint64 data = TFHE.asEuint64(encryptedData, inputProof);

        userData[msg.sender] = data;
        hasData[msg.sender] = true;

        // Allow user to decrypt their own data
        TFHE.allow(data, msg.sender);

        emit DataStored(msg.sender);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //                    USER DECRYPTION DELEGATION
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Delegate decryption rights to another address
     * @param delegate Who can decrypt your data
     * @param durationDays How many days the delegation lasts
     *
     * @dev Uses TFHE.delegateUserDecryption() - THE KEY FUNCTION
     *
     * ┌─────────────────────────────────────────────────────────────────────┐
     * │                                                                     │
     * │   REAL-WORLD SCENARIO: Tax Season                                   │
     * │   ─────────────────────────────────                                 │
     * │                                                                     │
     * │   Alice stores her salary on-chain (encrypted).                     │
     * │   Tax season arrives - she needs to share with her accountant.      │
     * │                                                                     │
     * │   Alice calls: delegate(accountantAddress, 30)                      │
     * │                                                                     │
     * │   Result:                                                           │
     * │   • Accountant can request decryption via Gateway                   │
     * │   • Access automatically expires in 30 days                         │
     * │   • Alice can revoke anytime                                        │
     * │   • Only this contract's data - not other contracts                 │
     * │                                                                     │
     * └─────────────────────────────────────────────────────────────────────┘
     */
    function delegate(address delegate, uint64 durationDays) external {
        require(hasData[msg.sender], "No data stored");
        require(delegate != address(0), "Invalid delegate");
        require(durationDays > 0 && durationDays <= 365, "Duration: 1-365 days");

        uint64 expiry = uint64(block.timestamp) + (durationDays * 1 days);

        // ╔═══════════════════════════════════════════════════════════════╗
        // ║  FUNCTION #1: TFHE.delegateUserDecryption()                   ║
        // ║                                                               ║
        // ║  "Allow this delegate to decrypt my data for this contract   ║
        // ║   until the expiry timestamp"                                 ║
        // ╚═══════════════════════════════════════════════════════════════╝
        TFHE.delegateUserDecryption(delegate, address(this), expiry);

        emit DelegationGranted(msg.sender, delegate, expiry);
    }

    /**
     * @notice Revoke a delegation before it expires
     * @param delegate The address to revoke access from
     *
     * @dev Uses TFHE.revokeUserDecryptionDelegation()
     *
     * ┌─────────────────────────────────────────────────────────────────────┐
     * │                                                                     │
     * │   USE CASE: Accountant Changed                                      │
     * │   ────────────────────────────                                      │
     * │                                                                     │
     * │   Alice delegated to OldAccountant for 30 days.                     │
     * │   After 10 days, she switches to NewAccountant.                     │
     * │                                                                     │
     * │   Alice calls: revoke(oldAccountantAddress)                         │
     * │                                                                     │
     * │   Result:                                                           │
     * │   • OldAccountant immediately loses access                          │
     * │   • No need to wait for expiry                                      │
     * │   • Alice then delegates to NewAccountant                           │
     * │                                                                     │
     * └─────────────────────────────────────────────────────────────────────┘
     */
    function revoke(address delegate) external {
        require(hasData[msg.sender], "No data stored");
        require(delegate != address(0), "Invalid delegate");

        // ╔═══════════════════════════════════════════════════════════════╗
        // ║  FUNCTION #2: TFHE.revokeUserDecryptionDelegation()           ║
        // ║                                                               ║
        // ║  "Remove this delegate's access immediately"                  ║
        // ╚═══════════════════════════════════════════════════════════════╝
        TFHE.revokeUserDecryptionDelegation(delegate, address(this));

        emit DelegationRevoked(msg.sender, delegate);
    }

    /**
     * @notice Check when a delegation expires
     * @param delegator The data owner
     * @param delegate The delegated address
     * @return expiry Unix timestamp (0 if no delegation)
     *
     * @dev Uses TFHE.getDelegatedUserDecryptionExpirationDate()
     */
    function getExpiry(address delegator, address delegate) external view returns (uint64 expiry) {
        // ╔═══════════════════════════════════════════════════════════════╗
        // ║  FUNCTION #3: getDelegatedUserDecryptionExpirationDate()      ║
        // ║                                                               ║
        // ║  "When does this delegation expire?"                          ║
        // ║  Returns 0 if no delegation exists                            ║
        // ╚═══════════════════════════════════════════════════════════════╝
        return TFHE.getDelegatedUserDecryptionExpirationDate(delegator, delegate, address(this));
    }

    /**
     * @notice Check if a delegation is currently active
     * @param delegator The data owner
     * @param delegate The delegated address
     * @return active True if delegation exists and hasn't expired
     *
     * @dev Uses TFHE.isDelegatedForUserDecryption()
     */
    function isActive(address delegator, address delegate) external view returns (bool active) {
        if (!hasData[delegator]) return false;

        euint64 data = userData[delegator];

        // ╔═══════════════════════════════════════════════════════════════╗
        // ║  FUNCTION #4: TFHE.isDelegatedForUserDecryption()             ║
        // ║                                                               ║
        // ║  "Is this delegation active for this specific data handle?"   ║
        // ║  More precise than just checking expiry                       ║
        // ╚═══════════════════════════════════════════════════════════════╝
        return TFHE.isDelegatedForUserDecryption(delegator, delegate, address(this), data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //                         VIEW DATA
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get encrypted data handle (for decryption via Gateway)
     * @param user The data owner
     * @return The encrypted data handle
     */
    function getData(address user) external view returns (euint64) {
        require(hasData[user], "No data");
        return userData[user];
    }
}
