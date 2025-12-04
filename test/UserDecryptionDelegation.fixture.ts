import { ethers } from 'hardhat';

import type { UserDecryptionDelegation } from '../../typechain-types';

export async function deployUserDecryptionDelegationFixture(): Promise<UserDecryptionDelegation> {
  const contractFactory = await ethers.getContractFactory('UserDecryptionDelegation');
  const contract = await contractFactory.deploy();
  await contract.waitForDeployment();

  return contract as unknown as UserDecryptionDelegation;
}
