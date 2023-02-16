const ethTx = require('ethereumjs-tx');
const ethUtils = require('ethereumjs-util');
import { ethers } from "hardhat";

async function main() {
    const Deployer = await ethers.getContractFactory(
        "Deployer"
      );
      const deployerBytecode = `${Deployer.bytecode}`;
    
    const rawTransaction = {
        nonce: 0,
        gasPrice: 100000000000,
        value: 0,
        data: deployerBytecode,
        gasLimit: 281247,
        v: 27,
        r: '0x247000',
        s: '0x2470'
      }
    const tx = new ethTx(rawTransaction);
    const res = {
        sender: ethUtils.toChecksumAddress(tx.getSenderAddress().toString('hex')),
        rawTx: '0x' + tx.serialize().toString('hex'),
        contractAddr: ethUtils.toChecksumAddress(
          ethUtils.generateAddress(tx.getSenderAddress(), ethUtils.toBuffer(0)).toString('hex')),
    };
    console.log('res ', res);
    
    return res;
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });