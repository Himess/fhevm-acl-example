import { ethers } from 'hardhat';

import type { ConfidentialSalary } from '../../typechain-types';
import { getSigners } from '../signers';

export async function deployConfidentialSalaryFixture(): Promise<ConfidentialSalary> {
  const signers = await getSigners();

  const contractFactory = await ethers.getContractFactory('ConfidentialSalary');
  // Deploy with alice as owner, bob as HR manager
  const contract = await contractFactory.connect(signers.alice).deploy(signers.bob.address);
  await contract.waitForDeployment();

  return contract as unknown as ConfidentialSalary;
}
