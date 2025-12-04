import { expect } from 'chai';
import hre from 'hardhat';

import { createInstances } from '../instance';
import { getSigners, initSigners } from '../signers';
import { deployUserDecryptionDelegationFixture } from './UserDecryptionDelegation.fixture';

/**
 * UserDecryptionDelegation Test Suite
 *
 * Demonstrates the 4 User Decryption Delegation functions in FHEVM:
 *
 *   1. TFHE.delegateUserDecryption(delegate, contract, expiry)
 *      → "Allow this address to decrypt my data until expiry"
 *
 *   2. TFHE.revokeUserDecryptionDelegation(delegate, contract)
 *      → "Remove this delegate's access immediately"
 *
 *   3. TFHE.getDelegatedUserDecryptionExpirationDate(delegator, delegate, contract)
 *      → "When does this delegation expire?"
 *
 *   4. TFHE.isDelegatedForUserDecryption(delegator, delegate, contract, handle)
 *      → "Is this delegation currently active?"
 */
describe('UserDecryptionDelegation', function () {
  before(async function () {
    await initSigners(3); // alice (data owner), bob (delegate/accountant), carol (other)
    this.signers = await getSigners();
  });

  beforeEach(async function () {
    const contract = await deployUserDecryptionDelegationFixture();
    this.contractAddress = await contract.getAddress();
    this.delegation = contract;
    this.instances = await createInstances(this.signers);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // DEPLOYMENT
  // ═══════════════════════════════════════════════════════════════════════

  describe('Deployment', function () {
    it('should deploy successfully', async function () {
      expect(this.contractAddress).to.be.properAddress;
    });

    it('should start with no data stored', async function () {
      expect(await this.delegation.hasData(this.signers.alice.address)).to.equal(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STORE DATA
  // ═══════════════════════════════════════════════════════════════════════

  describe('Store Data', function () {
    it('should store encrypted data', async function () {
      const input = this.instances.alice.createEncryptedInput(
        this.contractAddress,
        this.signers.alice.address
      );
      input.add64(75000); // Alice's salary
      const encryptedData = await input.encrypt();

      const tx = await this.delegation.connect(this.signers.alice).storeData(
        encryptedData.handles[0],
        encryptedData.inputProof
      );
      await tx.wait();

      expect(await this.delegation.hasData(this.signers.alice.address)).to.equal(true);
    });

    it('should emit DataStored event', async function () {
      const input = this.instances.alice.createEncryptedInput(
        this.contractAddress,
        this.signers.alice.address
      );
      input.add64(75000);
      const encryptedData = await input.encrypt();

      const tx = await this.delegation.connect(this.signers.alice).storeData(
        encryptedData.handles[0],
        encryptedData.inputProof
      );

      await expect(tx)
        .to.emit(this.delegation, 'DataStored')
        .withArgs(this.signers.alice.address);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // DELEGATE (Function #1: TFHE.delegateUserDecryption)
  // ═══════════════════════════════════════════════════════════════════════

  describe('Delegate', function () {
    beforeEach(async function () {
      // Alice stores her data first
      const input = this.instances.alice.createEncryptedInput(
        this.contractAddress,
        this.signers.alice.address
      );
      input.add64(75000);
      const encryptedData = await input.encrypt();

      await this.delegation.connect(this.signers.alice).storeData(
        encryptedData.handles[0],
        encryptedData.inputProof
      );
    });

    it('should allow data owner to delegate access', async function () {
      // Alice delegates to Bob (her accountant) for 30 days
      const tx = await this.delegation.connect(this.signers.alice).delegate(
        this.signers.bob.address,
        30 // 30 days
      );
      await tx.wait();

      // Verify via event
      await expect(tx).to.emit(this.delegation, 'DelegationGranted');
    });

    it('should emit DelegationGranted with correct expiry', async function () {
      const tx = await this.delegation.connect(this.signers.alice).delegate(
        this.signers.bob.address,
        30
      );

      const receipt = await tx.wait();
      const block = await hre.ethers.provider.getBlock(receipt!.blockNumber);
      const expectedExpiry = BigInt(block!.timestamp) + BigInt(30 * 24 * 60 * 60);

      await expect(tx)
        .to.emit(this.delegation, 'DelegationGranted')
        .withArgs(this.signers.alice.address, this.signers.bob.address, expectedExpiry);
    });

    it('should revert delegation without stored data', async function () {
      // Carol has no data stored
      await expect(
        this.delegation.connect(this.signers.carol).delegate(this.signers.bob.address, 30)
      ).to.be.revertedWith('No data stored');
    });

    it('should revert delegation to zero address', async function () {
      await expect(
        this.delegation.connect(this.signers.alice).delegate(hre.ethers.ZeroAddress, 30)
      ).to.be.revertedWith('Invalid delegate');
    });

    it('should revert delegation with zero days', async function () {
      await expect(
        this.delegation.connect(this.signers.alice).delegate(this.signers.bob.address, 0)
      ).to.be.revertedWith('Duration: 1-365 days');
    });

    it('should revert delegation over 365 days', async function () {
      await expect(
        this.delegation.connect(this.signers.alice).delegate(this.signers.bob.address, 366)
      ).to.be.revertedWith('Duration: 1-365 days');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // REVOKE (Function #2: TFHE.revokeUserDecryptionDelegation)
  // ═══════════════════════════════════════════════════════════════════════

  describe('Revoke', function () {
    beforeEach(async function () {
      // Alice stores her data
      const input = this.instances.alice.createEncryptedInput(
        this.contractAddress,
        this.signers.alice.address
      );
      input.add64(75000);
      const encryptedData = await input.encrypt();

      await this.delegation.connect(this.signers.alice).storeData(
        encryptedData.handles[0],
        encryptedData.inputProof
      );

      // Alice delegates to Bob
      await this.delegation.connect(this.signers.alice).delegate(
        this.signers.bob.address,
        30
      );
    });

    it('should allow data owner to revoke delegation', async function () {
      const tx = await this.delegation.connect(this.signers.alice).revoke(
        this.signers.bob.address
      );
      await tx.wait();

      await expect(tx)
        .to.emit(this.delegation, 'DelegationRevoked')
        .withArgs(this.signers.alice.address, this.signers.bob.address);
    });

    it('should revert revoke without stored data', async function () {
      await expect(
        this.delegation.connect(this.signers.carol).revoke(this.signers.bob.address)
      ).to.be.revertedWith('No data stored');
    });

    it('should revert revoke for zero address', async function () {
      await expect(
        this.delegation.connect(this.signers.alice).revoke(hre.ethers.ZeroAddress)
      ).to.be.revertedWith('Invalid delegate');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // GET EXPIRY (Function #3: TFHE.getDelegatedUserDecryptionExpirationDate)
  // ═══════════════════════════════════════════════════════════════════════

  describe('Get Expiry', function () {
    beforeEach(async function () {
      // Alice stores her data
      const input = this.instances.alice.createEncryptedInput(
        this.contractAddress,
        this.signers.alice.address
      );
      input.add64(75000);
      const encryptedData = await input.encrypt();

      await this.delegation.connect(this.signers.alice).storeData(
        encryptedData.handles[0],
        encryptedData.inputProof
      );
    });

    it('should return 0 for non-existent delegation', async function () {
      const expiry = await this.delegation.getExpiry(
        this.signers.alice.address,
        this.signers.bob.address
      );
      expect(expiry).to.equal(0n);
    });

    it('should return correct expiry after delegation', async function () {
      // Delegate first
      const tx = await this.delegation.connect(this.signers.alice).delegate(
        this.signers.bob.address,
        30
      );
      const receipt = await tx.wait();
      const block = await hre.ethers.provider.getBlock(receipt!.blockNumber);
      const expectedExpiry = BigInt(block!.timestamp) + BigInt(30 * 24 * 60 * 60);

      const expiry = await this.delegation.getExpiry(
        this.signers.alice.address,
        this.signers.bob.address
      );
      expect(expiry).to.equal(expectedExpiry);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // IS ACTIVE (Function #4: TFHE.isDelegatedForUserDecryption)
  // ═══════════════════════════════════════════════════════════════════════

  describe('Is Active', function () {
    beforeEach(async function () {
      // Alice stores her data
      const input = this.instances.alice.createEncryptedInput(
        this.contractAddress,
        this.signers.alice.address
      );
      input.add64(75000);
      const encryptedData = await input.encrypt();

      await this.delegation.connect(this.signers.alice).storeData(
        encryptedData.handles[0],
        encryptedData.inputProof
      );
    });

    it('should return false for non-existent delegation', async function () {
      const isActive = await this.delegation.isActive(
        this.signers.alice.address,
        this.signers.bob.address
      );
      expect(isActive).to.equal(false);
    });

    it('should return false for user without data', async function () {
      const isActive = await this.delegation.isActive(
        this.signers.carol.address, // carol has no data
        this.signers.bob.address
      );
      expect(isActive).to.equal(false);
    });

    it('should return true after delegation', async function () {
      // Delegate first
      await this.delegation.connect(this.signers.alice).delegate(
        this.signers.bob.address,
        30
      );

      const isActive = await this.delegation.isActive(
        this.signers.alice.address,
        this.signers.bob.address
      );
      expect(isActive).to.equal(true);
    });

    it('should return false after revocation', async function () {
      // Delegate then revoke
      await this.delegation.connect(this.signers.alice).delegate(
        this.signers.bob.address,
        30
      );
      await this.delegation.connect(this.signers.alice).revoke(
        this.signers.bob.address
      );

      const isActive = await this.delegation.isActive(
        this.signers.alice.address,
        this.signers.bob.address
      );
      expect(isActive).to.equal(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // GET DATA
  // ═══════════════════════════════════════════════════════════════════════

  describe('Get Data', function () {
    it('should revert getData for user without data', async function () {
      await expect(
        this.delegation.getData(this.signers.alice.address)
      ).to.be.revertedWith('No data');
    });

    it('should return handle after storing data', async function () {
      const input = this.instances.alice.createEncryptedInput(
        this.contractAddress,
        this.signers.alice.address
      );
      input.add64(75000);
      const encryptedData = await input.encrypt();

      await this.delegation.connect(this.signers.alice).storeData(
        encryptedData.handles[0],
        encryptedData.inputProof
      );

      const handle = await this.delegation.getData(this.signers.alice.address);
      expect(handle).to.not.equal('0x' + '0'.repeat(64));
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // GAS BENCHMARKS
  // ═══════════════════════════════════════════════════════════════════════

  describe('Gas Benchmarks', function () {
    it('should measure gas for deployment', async function () {
      const contractFactory = await hre.ethers.getContractFactory('UserDecryptionDelegation');
      const deployTx = await contractFactory.deploy();
      const receipt = await deployTx.deploymentTransaction()?.wait();

      console.log(`    Gas: deployment = ${receipt?.gasUsed.toString()}`);
      expect(receipt?.gasUsed).to.be.greaterThan(0n);
    });

    it('should measure gas for storeData', async function () {
      const input = this.instances.alice.createEncryptedInput(
        this.contractAddress,
        this.signers.alice.address
      );
      input.add64(75000);
      const encryptedData = await input.encrypt();

      const tx = await this.delegation.connect(this.signers.alice).storeData(
        encryptedData.handles[0],
        encryptedData.inputProof
      );
      const receipt = await tx.wait();

      console.log(`    Gas: storeData = ${receipt?.gasUsed.toString()}`);
      expect(receipt?.gasUsed).to.be.greaterThan(0n);
    });

    it('should measure gas for delegate', async function () {
      // Store data first
      const input = this.instances.alice.createEncryptedInput(
        this.contractAddress,
        this.signers.alice.address
      );
      input.add64(75000);
      const encryptedData = await input.encrypt();

      await this.delegation.connect(this.signers.alice).storeData(
        encryptedData.handles[0],
        encryptedData.inputProof
      );

      // Measure delegate
      const tx = await this.delegation.connect(this.signers.alice).delegate(
        this.signers.bob.address,
        30
      );
      const receipt = await tx.wait();

      console.log(`    Gas: delegate = ${receipt?.gasUsed.toString()}`);
      expect(receipt?.gasUsed).to.be.greaterThan(0n);
    });

    it('should measure gas for revoke', async function () {
      // Store and delegate first
      const input = this.instances.alice.createEncryptedInput(
        this.contractAddress,
        this.signers.alice.address
      );
      input.add64(75000);
      const encryptedData = await input.encrypt();

      await this.delegation.connect(this.signers.alice).storeData(
        encryptedData.handles[0],
        encryptedData.inputProof
      );

      await this.delegation.connect(this.signers.alice).delegate(
        this.signers.bob.address,
        30
      );

      // Measure revoke
      const tx = await this.delegation.connect(this.signers.alice).revoke(
        this.signers.bob.address
      );
      const receipt = await tx.wait();

      console.log(`    Gas: revoke = ${receipt?.gasUsed.toString()}`);
      expect(receipt?.gasUsed).to.be.greaterThan(0n);
    });
  });
});
