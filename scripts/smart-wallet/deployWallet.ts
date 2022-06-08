// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

// const provider = ethers.provider;
// const ethersSigner = provider.getSigner();

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Gasless deployment
  const owner = "0x7306aC7A32eb690232De81a9FFB44Bb346026faB";

  const SmartWallet = await ethers.getContractFactory("SmartWallet");
  const baseImpl = await SmartWallet.deploy();
  await baseImpl.deployed();
  console.log("base wallet impl deployed at: ", baseImpl.address);

  const WalletFactory = await ethers.getContractFactory("WalletFactory");
  const walletFactory = await WalletFactory.deploy(baseImpl.address);
  await walletFactory.deployed();
  console.log("wallet factory deployed at: ", walletFactory.address);

  const expected = await walletFactory.getAddressForCounterfactualWallet(
    owner,
    0
  );
  console.log("deploying new wallet..expected address: ", expected);

  const mockEntryPoint = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";

  const DefaultHandler = await ethers.getContractFactory(
    "DefaultCallbackHandler"
  );
  const handler = await DefaultHandler.deploy();
  await handler.deployed();
  console.log("Default callback handler deployed at: ", handler.address);

  // TODO
  // how can write tx return address to var
  const proxy = await walletFactory.deployCounterFactualWallet(
    owner,
    mockEntryPoint,
    handler.address,
    0
  );

  // this will give tx object instead of proxy
  // console.log("proxy deplayed at:  ? ", proxy);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
