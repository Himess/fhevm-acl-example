// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../../library-solidity/lib/FHE.sol";
import "../../../library-solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ░█▀▀░█▀█░█▀█░█▀▀░▀█▀░█▀▄░█▀▀░█▀█░▀█▀░▀█▀░█▀█░█░░░░░█▀▀░█▀█░█░░░█▀█░█▀▄░█░█  ║
 * ║   ░█░░░█░█░█░█░█▀▀░░█░░█░█░█▀▀░█░█░░█░░░█░░█▀█░█░░░░░▀▀█░█▀█░█░░░█▀█░█▀▄░░█░  ║
 * ║   ░▀▀▀░▀▀▀░▀░▀░▀░░░▀▀▀░▀▀░░▀▀▀░▀░▀░░▀░░▀▀▀░▀░▀░▀▀▀░░░▀▀▀░▀░▀░▀▀▀░▀░▀░▀░▀░░▀░  ║
 * ║                                                                           ║
 * ║                    FHEVM Access Control (ACL) Example                     ║
 * ║                      Zama Bounty Track Submission                         ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * @title ConfidentialSalary
 * @author Zama Bounty Track Submission
 * @notice A comprehensive example demonstrating FHEVM's Access Control List (ACL) feature
 *
 * @dev This contract showcases ALL 11 ACL functions available in FHEVM:
 *
 *      ┌──────────────────────────────────────────────────────────────────────────┐
 *      │                      ACL FUNCTIONS DEMONSTRATED                          │
 *      ├──────────────────────────────────────────────────────────────────────────┤
 *      │                                                                          │
 *      │  BASIC ACCESS CONTROL:                                                   │
 *      │  ─────────────────────                                                   │
 *      │  1. FHE.allow(value, address)         → Grant permanent access           │
 *      │  2. FHE.allowThis(value)              → Allow contract itself            │
 *      │  3. FHE.allowTransient(value, addr)   → Temporary (tx-only) access       │
 *      │                                                                          │
 *      │  ACCESS CHECKING:                                                        │
 *      │  ────────────────                                                        │
 *      │  4. FHE.isAllowed(value, address)     → Check if address has access      │
 *      │  5. FHE.isSenderAllowed(value)        → Check if sender has access       │
 *      │                                                                          │
 *      │  PUBLIC DECRYPTION:                                                      │
 *      │  ──────────────────                                                      │
 *      │  6. FHE.makePubliclyDecryptable()     → Make value public                │
 *      │  7. FHE.isPubliclyDecryptable()       → Check if value is public         │
 *      │                                                                          │
 *      │  USER DECRYPTION DELEGATION (Advanced):                                  │
 *      │  ──────────────────────────────────────                                  │
 *      │  8. FHE.delegateUserDecryption()      → Delegate decrypt rights          │
 *      │  9. FHE.revokeUserDecryptionDelegation() → Revoke delegation             │
 *      │  10. FHE.getDelegatedUserDecryptionExpirationDate() → Check expiry       │
 *      │  11. FHE.isDelegatedForUserDecryption() → Check if delegated             │
 *      │                                                                          │
 *      └──────────────────────────────────────────────────────────────────────────┘
 *
 *      USE CASE: Confidential Salary Management System
 *      ───────────────────────────────────────────────
 *
 *      Real-world problem: Companies want to store salaries on-chain for
 *      transparency and automation, but individual salaries must remain private.
 *
 *      Access Control Requirements:
 *      ┌────────────────┬─────────────────┬──────────────────┬─────────────┐
 *      │ Role           │ Own Salary      │ Others' Salaries │ Total Budget│
 *      ├────────────────┼─────────────────┼──────────────────┼─────────────┤
 *      │ HR Manager     │ ✅ Can view     │ ✅ Can view      │ ✅ Can view │
 *      │ Employee       │ ✅ Can view     │ ❌ Cannot view   │ ❌ No access│
 *      │ Public/Auditor │ ❌ No access    │ ❌ No access     │ ✅ Can view*│
 *      └────────────────┴─────────────────┴──────────────────┴─────────────┘
 *      * Only when explicitly revealed by HR for auditing
 *
 *      This demonstrates the power of FHE ACL: same encrypted data, different
 *      access rights for different users, all enforced cryptographically.
 */
contract ConfidentialSalary is ZamaEthereumConfig, Ownable {

    // ═══════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice HR Manager who can view all salaries
    /// @dev This address gets FHE.allow() for ALL salary values
    address public hrManager;

    /// @notice Encrypted salaries - only accessible to employee + HR
    /// @dev Each salary is encrypted and ACL-protected
    mapping(address => euint64) private salaries;

    /// @notice Track registered employees
    mapping(address => bool) public isEmployee;

    /// @notice Total encrypted salary budget
    /// @dev Sum of all salaries, kept encrypted until explicitly revealed
    euint64 private totalBudget;

    /// @notice Whether total budget has been made public for auditing
    bool public isBudgetPublic;

    /// @notice List of all employees for enumeration
    address[] private employeeList;

    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Emitted when an employee is added with their encrypted salary
    event EmployeeAdded(address indexed employee, address indexed addedBy);

    /// @notice Emitted when salary is updated
    event SalaryUpdated(address indexed employee, address indexed updatedBy);

    /// @notice Emitted when HR manager is changed
    event HRManagerChanged(address indexed oldHR, address indexed newHR);

    /// @notice Emitted when total budget is made public for auditing
    event BudgetRevealed(address indexed revealedBy);

    /// @notice Emitted when temporary access is granted
    event TransientAccessGranted(address indexed employee, address indexed grantedTo);

    /// @notice Emitted when delegation is created
    event DelegationCreated(address indexed delegator, address indexed delegate, uint64 expiration);

    /// @notice Emitted when delegation is revoked
    event DelegationRevoked(address indexed delegator, address indexed delegate);

    // ═══════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════

    error NotHRManager();
    error EmployeeAlreadyExists();
    error EmployeeDoesNotExist();
    error InvalidAddress();

    // ═══════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Only HR manager can call
    modifier onlyHR() {
        if (msg.sender != hrManager) revert NotHRManager();
        _;
    }

    /// @notice Only registered employees can call
    modifier onlyEmployee() {
        if (!isEmployee[msg.sender]) revert EmployeeDoesNotExist();
        _;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Deploy the contract with initial HR manager
     * @param _hrManager Address of the HR manager who can view all salaries
     *
     * @dev The deployer becomes owner, but HR manager is separate.
     *      This allows for separation of contract ownership and HR duties.
     */
    constructor(address _hrManager) Ownable(msg.sender) {
        if (_hrManager == address(0)) revert InvalidAddress();
        hrManager = _hrManager;

        // Initialize total budget to encrypted zero
        totalBudget = FHE.asEuint64(0);

        // ┌─────────────────────────────────────────────────────────────────┐
        // │ ACL FUNCTION #2: FHE.allowThis()                                │
        // │                                                                 │
        // │ Purpose: Allow the contract itself to perform operations on     │
        // │          the encrypted value in future transactions.            │
        // │                                                                 │
        // │ Why needed: Without this, the contract couldn't add salaries    │
        // │             to totalBudget in subsequent calls.                 │
        // └─────────────────────────────────────────────────────────────────┘
        FHE.allowThis(totalBudget);

        // ┌─────────────────────────────────────────────────────────────────┐
        // │ ACL FUNCTION #1: FHE.allow(value, address)                      │
        // │                                                                 │
        // │ Purpose: Grant permanent decryption access to a specific        │
        // │          address for this encrypted value.                      │
        // │                                                                 │
        // │ Why needed: HR manager should be able to decrypt totalBudget    │
        // │             to see the company's salary expenditure.            │
        // └─────────────────────────────────────────────────────────────────┘
        FHE.allow(totalBudget, hrManager);

        emit HRManagerChanged(address(0), _hrManager);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HR MANAGER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Add a new employee with their encrypted salary
     * @param employee Address of the employee
     * @param encryptedSalary Encrypted salary value from client
     * @param inputProof Proof for the encrypted input
     *
     * @dev This function demonstrates multiple ACL patterns:
     *      1. FHE.allowThis() - Contract can use salary for calculations
     *      2. FHE.allow(salary, employee) - Employee can view own salary
     *      3. FHE.allow(salary, hrManager) - HR can view this salary
     *
     * Example client-side code to call this:
     * ```javascript
     * const salary = await fhevmInstance.encrypt64(75000);
     * const proof = await fhevmInstance.generateInputProof();
     * await contract.addEmployee(employeeAddr, salary, proof);
     * ```
     */
    function addEmployee(
        address employee,
        externalEuint64 encryptedSalary,
        bytes calldata inputProof
    ) external onlyHR {
        if (employee == address(0)) revert InvalidAddress();
        if (isEmployee[employee]) revert EmployeeAlreadyExists();

        // Convert external encrypted input to internal euint64
        euint64 salary = FHE.fromExternal(encryptedSalary, inputProof);

        // Store the encrypted salary
        salaries[employee] = salary;
        isEmployee[employee] = true;
        employeeList.push(employee);

        // ┌─────────────────────────────────────────────────────────────────┐
        // │ ACL PATTERN: Multi-party access to same encrypted value         │
        // │                                                                 │
        // │ This is the core power of FHE ACL - the same encrypted salary   │
        // │ can be decrypted by:                                            │
        // │   • The contract (for calculations)                             │
        // │   • The employee (to see their own salary)                      │
        // │   • HR manager (to manage all salaries)                         │
        // │                                                                 │
        // │ But NOT by:                                                     │
        // │   • Other employees                                             │
        // │   • External observers                                          │
        // │   • Random addresses                                            │
        // └─────────────────────────────────────────────────────────────────┘

        // Allow contract to use this salary for budget calculations
        FHE.allowThis(salary);

        // Allow employee to decrypt their own salary
        FHE.allow(salary, employee);

        // Allow HR manager to decrypt this salary
        FHE.allow(salary, hrManager);

        // Update total budget (encrypted addition)
        totalBudget = FHE.add(totalBudget, salary);

        // Re-allow access after updating totalBudget
        FHE.allowThis(totalBudget);
        FHE.allow(totalBudget, hrManager);

        emit EmployeeAdded(employee, msg.sender);
    }

    /**
     * @notice Update an employee's salary
     * @param employee Address of the employee
     * @param newEncryptedSalary New encrypted salary value
     * @param inputProof Proof for the encrypted input
     *
     * @dev Updates salary and recalculates budget while maintaining ACL
     */
    function updateSalary(
        address employee,
        externalEuint64 newEncryptedSalary,
        bytes calldata inputProof
    ) external onlyHR {
        if (!isEmployee[employee]) revert EmployeeDoesNotExist();

        euint64 newSalary = FHE.fromExternal(newEncryptedSalary, inputProof);
        euint64 oldSalary = salaries[employee];

        // Update budget: subtract old, add new
        totalBudget = FHE.sub(totalBudget, oldSalary);
        totalBudget = FHE.add(totalBudget, newSalary);

        // Store new salary
        salaries[employee] = newSalary;

        // Re-establish all ACL permissions
        FHE.allowThis(newSalary);
        FHE.allow(newSalary, employee);
        FHE.allow(newSalary, hrManager);

        FHE.allowThis(totalBudget);
        FHE.allow(totalBudget, hrManager);

        emit SalaryUpdated(employee, msg.sender);
    }

    /**
     * @notice Grant temporary access to an employee's salary
     * @param employee The employee whose salary to share
     * @param viewer The address to grant temporary access
     *
     * @dev Demonstrates FHE.allowTransient() - access valid only for this tx
     *
     *      Use case: External auditor needs to verify a specific salary
     *      during an audit transaction, but shouldn't have permanent access.
     *
     *      ┌─────────────────────────────────────────────────────────────────┐
     *      │ ACL FUNCTION #3: FHE.allowTransient(value, address)            │
     *      │                                                                 │
     *      │ Purpose: Grant decryption access that expires after the        │
     *      │          current transaction ends.                             │
     *      │                                                                 │
     *      │ Difference from FHE.allow():                                   │
     *      │   • allow() = permanent access until revoked                   │
     *      │   • allowTransient() = access only during this transaction     │
     *      │                                                                 │
     *      │ Security benefit: Minimizes exposure window for sensitive data │
     *      └─────────────────────────────────────────────────────────────────┘
     */
    function grantTemporaryAccess(
        address employee,
        address viewer
    ) external onlyHR {
        if (!isEmployee[employee]) revert EmployeeDoesNotExist();
        if (viewer == address(0)) revert InvalidAddress();

        euint64 salary = salaries[employee];

        // Grant transient (temporary) access - valid only for this tx
        FHE.allowTransient(salary, viewer);

        emit TransientAccessGranted(employee, viewer);
    }

    /**
     * @notice Make total budget publicly decryptable for auditing
     *
     * @dev Demonstrates FHE.makePubliclyDecryptable()
     *
     *      Use case: Company wants to disclose total salary expenditure
     *      for regulatory compliance or investor transparency, without
     *      revealing individual salaries.
     *
     *      ┌─────────────────────────────────────────────────────────────────┐
     *      │ ACL FUNCTION #6: FHE.makePubliclyDecryptable(value)            │
     *      │                                                                 │
     *      │ Purpose: Allow ANYONE to decrypt this value via the Gateway.   │
     *      │                                                                 │
     *      │ ⚠️  WARNING: This is irreversible! Once public, always public. │
     *      │                                                                 │
     *      │ Use cases:                                                      │
     *      │   • Publishing voting results after election ends              │
     *      │   • Revealing auction winner after bidding closes              │
     *      │   • Disclosing aggregate statistics for compliance             │
     *      └─────────────────────────────────────────────────────────────────┘
     */
    function revealTotalBudget() external onlyHR {
        FHE.makePubliclyDecryptable(totalBudget);
        isBudgetPublic = true;

        emit BudgetRevealed(msg.sender);
    }

    /**
     * @notice Change the HR manager
     * @param newHRManager Address of the new HR manager
     *
     * @dev When HR changes, we need to:
     *      1. Grant new HR access to all salaries
     *      2. (Optional) Revoke old HR access - not shown here for simplicity
     */
    function changeHRManager(address newHRManager) external onlyOwner {
        if (newHRManager == address(0)) revert InvalidAddress();

        address oldHR = hrManager;
        hrManager = newHRManager;

        // Grant new HR access to total budget
        FHE.allow(totalBudget, newHRManager);

        // Grant new HR access to all existing salaries
        for (uint256 i = 0; i < employeeList.length; i++) {
            address emp = employeeList[i];
            if (isEmployee[emp]) {
                FHE.allow(salaries[emp], newHRManager);
            }
        }

        emit HRManagerChanged(oldHR, newHRManager);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VIEW / CHECK FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Check if caller can access an employee's salary
     * @param employee The employee address to check
     * @return bool True if caller has access
     *
     * @dev Demonstrates FHE.isAllowed()
     *
     *      ┌─────────────────────────────────────────────────────────────────┐
     *      │ ACL FUNCTION #4: FHE.isAllowed(value, address)                 │
     *      │                                                                 │
     *      │ Purpose: Check if a specific address has decryption access     │
     *      │          to an encrypted value.                                │
     *      │                                                                 │
     *      │ Returns: true if address has persistent OR transient access    │
     *      │                                                                 │
     *      │ Use cases:                                                      │
     *      │   • UI can check if user can view data before attempting       │
     *      │   • Conditional logic based on access rights                   │
     *      │   • Debugging access control issues                            │
     *      └─────────────────────────────────────────────────────────────────┘
     */
    function canAccessSalary(address employee) external view returns (bool) {
        if (!isEmployee[employee]) return false;
        return FHE.isAllowed(salaries[employee], msg.sender);
    }

    /**
     * @notice Check if caller has access to total budget
     * @return bool True if caller can decrypt total budget
     */
    function canAccessBudget() external view returns (bool) {
        return FHE.isAllowed(totalBudget, msg.sender);
    }

    /**
     * @notice Check if total budget is publicly decryptable
     * @return bool True if anyone can decrypt total budget
     *
     * @dev Demonstrates FHE.isPubliclyDecryptable()
     *
     *      ┌─────────────────────────────────────────────────────────────────┐
     *      │ ACL FUNCTION #7: FHE.isPubliclyDecryptable(value)              │
     *      │                                                                 │
     *      │ Purpose: Check if a value has been marked for public decrypt   │
     *      │                                                                 │
     *      │ Use cases:                                                      │
     *      │   • UI can show "Results Available" when voting ends           │
     *      │   • Smart contracts can verify public data is ready            │
     *      └─────────────────────────────────────────────────────────────────┘
     */
    function isBudgetPubliclyDecryptable() external view returns (bool) {
        return FHE.isPubliclyDecryptable(totalBudget);
    }

    /**
     * @notice Get caller's own encrypted salary (requires ACL permission)
     * @return The encrypted salary (only decryptable if authorized)
     *
     * @dev Demonstrates FHE.isSenderAllowed()
     *
     *      ┌─────────────────────────────────────────────────────────────────┐
     *      │ ACL FUNCTION #5: FHE.isSenderAllowed(value)                    │
     *      │                                                                 │
     *      │ Purpose: Verify that msg.sender has access to encrypted value  │
     *      │                                                                 │
     *      │ Equivalent to: FHE.isAllowed(value, msg.sender)                │
     *      │                                                                 │
     *      │ Best practice: Always check before returning encrypted data    │
     *      │                to ensure caller can actually use it.           │
     *      └─────────────────────────────────────────────────────────────────┘
     */
    function getMySalary() external view onlyEmployee returns (euint64) {
        euint64 salary = salaries[msg.sender];

        // Verify sender can actually decrypt this
        // This is technically redundant here since we're the employee,
        // but it's a best practice to demonstrate
        require(FHE.isSenderAllowed(salary), "Not authorized");

        return salary;
    }

    /**
     * @notice Get any employee's salary (HR only)
     * @param employee The employee address
     * @return euint64 The encrypted salary
     */
    function getSalary(address employee) external view onlyHR returns (euint64) {
        if (!isEmployee[employee]) revert EmployeeDoesNotExist();
        return salaries[employee];
    }

    /**
     * @notice Get the encrypted total budget
     * @return euint64 The encrypted total budget
     */
    function getTotalBudget() external view returns (euint64) {
        require(FHE.isSenderAllowed(totalBudget), "Not authorized");
        return totalBudget;
    }

    /**
     * @notice Get count of employees
     * @return uint256 Number of registered employees
     */
    function getEmployeeCount() external view returns (uint256) {
        return employeeList.length;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // USER DECRYPTION DELEGATION (ACL Functions 8-11)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Delegate user decryption rights to another address
     * @param delegate The address to delegate decryption rights to
     * @param expirationTimestamp Unix timestamp when delegation expires
     *
     * @dev Demonstrates FHE.delegateUserDecryption()
     *
     *      ┌─────────────────────────────────────────────────────────────────┐
     *      │ ACL FUNCTION #8: FHE.delegateUserDecryption()                  │
     *      │                                                                 │
     *      │ Purpose: Allow another address to request decryption of your   │
     *      │          encrypted data on your behalf.                        │
     *      │                                                                 │
     *      │ Use cases:                                                      │
     *      │   • Employee delegates to tax accountant for tax filing        │
     *      │   • Employee delegates to lawyer for legal proceedings         │
     *      │   • Automated systems that need to read user data              │
     *      │                                                                 │
     *      │ Parameters:                                                     │
     *      │   • delegate: Who can request decryption                       │
     *      │   • contractAddress: For which contract's data                 │
     *      │   • expirationDate: When does this delegation expire           │
     *      │                                                                 │
     *      │ Security: Time-limited, contract-scoped, user-controlled       │
     *      └─────────────────────────────────────────────────────────────────┘
     *
     * Example: Tax Season Delegation
     * ───────────────────────────────
     * Alice (employee) wants her accountant to see her salary for tax filing.
     * She delegates for 30 days, only for this contract.
     *
     * ```solidity
     * // Alice calls this
     * contract.delegateSalaryAccess(
     *     accountantAddress,
     *     block.timestamp + 30 days
     * );
     * ```
     */
    function delegateSalaryAccess(
        address delegate,
        uint64 expirationTimestamp
    ) external onlyEmployee {
        if (delegate == address(0)) revert InvalidAddress();
        require(expirationTimestamp > block.timestamp, "Expiration must be in future");

        // Delegate decryption rights for this contract only
        FHE.delegateUserDecryption(
            delegate,
            address(this),
            expirationTimestamp
        );

        emit DelegationCreated(msg.sender, delegate, expirationTimestamp);
    }

    /**
     * @notice Revoke a previously granted delegation
     * @param delegate The address to revoke delegation from
     *
     * @dev Demonstrates FHE.revokeUserDecryptionDelegation()
     *
     *      ┌─────────────────────────────────────────────────────────────────┐
     *      │ ACL FUNCTION #9: FHE.revokeUserDecryptionDelegation()          │
     *      │                                                                 │
     *      │ Purpose: Remove decryption rights before expiration            │
     *      │                                                                 │
     *      │ Use cases:                                                      │
     *      │   • Employee changes accountants mid-tax-season                │
     *      │   • Security concern - revoke all delegations                  │
     *      │   • Relationship ends (e.g., fired lawyer)                     │
     *      └─────────────────────────────────────────────────────────────────┘
     */
    function revokeSalaryDelegation(address delegate) external onlyEmployee {
        if (delegate == address(0)) revert InvalidAddress();

        FHE.revokeUserDecryptionDelegation(delegate, address(this));

        emit DelegationRevoked(msg.sender, delegate);
    }

    /**
     * @notice Check delegation status
     * @param delegator The employee who might have delegated
     * @param delegate The address that might have been delegated to
     * @return expirationDate The expiration timestamp (0 if no delegation)
     *
     * @dev Demonstrates FHE.getDelegatedUserDecryptionExpirationDate()
     *
     *      ┌─────────────────────────────────────────────────────────────────┐
     *      │ ACL FUNCTION #10: getDelegatedUserDecryptionExpirationDate()   │
     *      │                                                                 │
     *      │ Purpose: Check when a delegation expires (or if it exists)     │
     *      │                                                                 │
     *      │ Returns: Unix timestamp of expiration, 0 if no delegation      │
     *      └─────────────────────────────────────────────────────────────────┘
     */
    function getDelegationExpiration(
        address delegator,
        address delegate
    ) external view returns (uint64 expirationDate) {
        return FHE.getDelegatedUserDecryptionExpirationDate(
            delegator,
            delegate,
            address(this)
        );
    }

    /**
     * @notice Check if delegation is currently active for a specific value
     * @param delegator The employee
     * @param delegate The delegated address
     * @return isActive True if delegation is active and not expired
     *
     * @dev Demonstrates FHE.isDelegatedForUserDecryption()
     *
     *      ┌─────────────────────────────────────────────────────────────────┐
     *      │ ACL FUNCTION #11: FHE.isDelegatedForUserDecryption()           │
     *      │                                                                 │
     *      │ Purpose: Check if delegation is active for a specific handle   │
     *      │                                                                 │
     *      │ More precise than expiration check - validates the handle too  │
     *      └─────────────────────────────────────────────────────────────────┘
     */
    function isDelegationActive(
        address delegator,
        address delegate
    ) external view returns (bool isActive) {
        if (!isEmployee[delegator]) return false;

        euint64 salary = salaries[delegator];
        bytes32 handle = FHE.toBytes32(salary);

        return FHE.isDelegatedForUserDecryption(
            delegator,
            delegate,
            address(this),
            handle
        );
    }
}
