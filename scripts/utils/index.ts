import { ethers as hardhatEthersInstance } from "hardhat";
import {
  BigNumber,
  BigNumberish,
  Contract,
  ethers,
  Signer,
  ContractFactory,
} from "ethers";
import {
  getContractAddress,
  arrayify,
  hexConcat,
  hexlify,
  hexZeroPad,
  keccak256,
  Interface,
} from "ethers/lib/utils";
import { TransactionReceipt, Provider } from "@ethersproject/providers";
import { Deployer, Deployer__factory } from "../../typechain";
export const FACTORY_ADDRESS = "0xbCE9d0C14D11BC476f136c239ec57c866Ff68108";
export const FACTORY_BYTE_CODE =
  "0x6080604052348015600f57600080fd5b506004361060285760003560e01c80634af63f0214602d575b600080fd5b60cf60048036036040811015604157600080fd5b810190602081018135640100000000811115605b57600080fd5b820183602082011115606c57600080fd5b80359060200191846001830284011164010000000083111715608d57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550509135925060eb915050565b604080516001600160a01b039092168252519081900360200190f35b6000818351602085016000f5939250505056fea26469706673582212206b44f8a82cb6b156bfcc3dc6aadd6df4eefd204bc928a4397fd15dacf6d5320564736f6c63430006020033";
export const factoryDeployer = "0xbfCc5a47D96A6767402f5CDf8dF1db03Df94442D";
export const factoryTx =
  "0xf9016c8085174876e8008303c4d88080b90154608060405234801561001057600080fd5b50610134806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634af63f0214602d575b600080fd5b60cf60048036036040811015604157600080fd5b810190602081018135640100000000811115605b57600080fd5b820183602082011115606c57600080fd5b80359060200191846001830284011164010000000083111715608d57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550509135925060eb915050565b604080516001600160a01b039092168252519081900360200190f35b6000818351602085016000f5939250505056fea26469706673582212206b44f8a82cb6b156bfcc3dc6aadd6df4eefd204bc928a4397fd15dacf6d5320564736f6c634300060200331b83247000822470";
export const factoryTxHash =
  "0x803351deb6d745e91545a6a3e1c0ea3e9a6a02a1a4193b70edfcd2f40f71a01c";

const factoryDeploymentFee = (0.0247 * 1e18).toString(); // 0.0247
const options = { gasLimit: 7000000 /*, gasPrice: 70000000000 */ };

export enum DEPLOYMENT_SALTS {
  CALLBACK_HANDLER = "CALLBACK_HANDLER_V21",
  DECODER = "DECODER_V21",
  ENTRY_POINT = "ENTRY_POINT_V21",
  GAS_ESTIMATOR = "GAS_ESTIMATOR_V21",
  MULTI_SEND = "MULTI_SEND_V21",
  MULTI_SEND_CALLONLY = "MULTI_SEND_CALLONLY_V21",
  WALLET_FACTORY = "WALLET_FACTORY_V21",
  WALLET_IMP = "WALLET_IMP_V21",
  SINGELTON_PAYMASTER = "SINGELTON_PAYMASTER_V21",
}

export const factoryAbi = [
  {
    inputs: [
      { internalType: "bytes", name: "_initCode", type: "bytes" },
      { internalType: "bytes32", name: "_salt", type: "bytes32" },
    ],
    name: "deploy",
    outputs: [
      {
        internalType: "address payable",
        name: "createdContract",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const buildBytecode = (
  constructorTypes: any[],
  constructorArgs: any[],
  contractBytecode: string
) =>
  `${contractBytecode}${encodeParams(constructorTypes, constructorArgs).slice(
    2
  )}`;

export const buildCreate2Address = (saltHex: string, byteCode: string) => {
  return `0x${ethers.utils
    .keccak256(
      `0x${["ff", FACTORY_ADDRESS, saltHex, ethers.utils.keccak256(byteCode)]
        .map((x) => x.replace(/0x/, ""))
        .join("")}`
    )
    .slice(-40)}`.toLowerCase();
};

/**
 * return the deployed address of this code.
 * (the deployed address to be used by deploy()
 * @param initCode
 * @param salt
 */
export const getDeployedAddress = (initCode: string, salt: BigNumberish) => {
  const saltBytes32 = hexZeroPad(hexlify(salt), 32);
  return (
    "0x" +
    keccak256(
      hexConcat(["0xff", FACTORY_ADDRESS, saltBytes32, keccak256(initCode)])
    ).slice(-40)
  );
};

export const getDeployerInstance = async (
  provider?: Provider
): Promise<Deployer> => {
  // const metaDeployerPrivateKey = process.env.FACTORY_DEPlOYER_PRIVATE_KEY;
  // if (!metaDeployerPrivateKey) {
  //   throw new Error("FACTORY_DEPLOYER_PRIVATE_KEY not set");
  // }
  // const metaDeployer = new ethers.Wallet(
  //   metaDeployerPrivateKey,
  //   hardhatEthersInstance.provider
  // );
  // const deployerAddress = getContractAddress({
  //   from: metaDeployer.address,
  //   nonce: 0,
  // });

  // const provider = hardhatEthersInstance.provider;
  const [signer] = await hardhatEthersInstance.getSigners();
  console.log(await signer.getAddress());

  // const chainId = (await provider.getNetwork()).chainId;
  // console.log(`Checking deployer ${deployerAddress} on chain ${chainId}...`);
  // const code = await provider.getCode(deployerAddress);
  // if (code === "0x") {
  //   console.log("Deployer not deployed, deploying...");
  //   const metaDeployerPrivateKey = process.env.FACTORY_DEPlOYER_PRIVATE_KEY;
  //   if (!metaDeployerPrivateKey) {
  //     throw new Error("FACTORY_DEPlOYER_PRIVATE_KEY not set");
  //   }
  //   const metaDeployerSigner = new ethers.Wallet(
  //     metaDeployerPrivateKey,
  //     provider
  //   );
  //   const deployer = await new Deployer__factory(metaDeployerSigner).deploy();
  //   await deployer.deployed();
  //   console.log(`Deployer deployed at ${deployer.address} on chain ${chainId}`);
  // }
  //  else {
  //   console.log(`Deployer already deployed on chain ${chainId}`);
  // }
  if (provider) await deployFactory(provider);

  return Deployer__factory.connect(FACTORY_ADDRESS, signer);
};

export const deployContract = async (
  name: string,
  computedContractAddress: string,
  salt: string,
  contractByteCode: string,
  deployerInstance: Deployer
): Promise<string> => {
  const { hash, wait } = await deployerInstance.deploy(salt, contractByteCode);

  console.log(`Submitted transaction ${hash} for deployment`);

  const { status, logs, blockNumber } = await wait(2);

  if (status !== 1) {
    throw new Error(`Transaction ${hash} failed`);
  }

  console.log(`Transaction ${hash} is included in block ${blockNumber}`);

  // Get the address of the deployed contract
  const topicHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("ContractDeployed(address)")
  );
  const contractDeployedLog = logs.find((log) => log.topics[0] === topicHash);

  if (!contractDeployedLog) {
    throw new Error(`Transaction ${hash} did not emit ContractDeployed event`);
  }

  const deployedContractAddress =
    deployerInstance.interface.parseLog(contractDeployedLog).args
      .contractAddress;

  const deploymentStatus =
    computedContractAddress === deployedContractAddress
      ? "Deployed Successfully"
      : false;

  console.log(name, deploymentStatus);

  if (!deploymentStatus) {
    console.log(`Invalid ${name} Handler Deployment`);
  }

  return "0x";
};

/**
 * deploy a contract using our EIP-2470 deployer.
 * The delpoyer is deployed (unless it is already deployed)
 * NOTE: this transaction will fail if already deployed. use getDeployedAddress to check it first.
 * @param initCode
 * @param salt
 */
export const deploy = async (
  provider: Provider,
  initCode: string,
  salt: BigNumberish,
  gasLimit?: BigNumberish | "estimate"
): Promise<string> => {
  // await this.deployFactory();

  const addr = getDeployedAddress(initCode, salt);
  const isDeployed = await isContract(addr, provider);
  if (isDeployed) {
    return addr;
  }

  const factory = new Contract(
    FACTORY_ADDRESS,
    ["function deploy(bytes _initCode, bytes32 _salt) returns(address)"],
    (provider as ethers.providers.JsonRpcProvider).getSigner()
  );
  const saltBytes32 = hexZeroPad(hexlify(salt), 32);
  if (gasLimit === "estimate") {
    gasLimit = await factory.deploy(initCode, saltBytes32, options);
  }

  // manual estimation (its bit larger: we don't know actual deployed code size)
  gasLimit =
    gasLimit ??
    arrayify(initCode)
      .map((x) => (x === 0 ? 4 : 16))
      .reduce((sum, x) => sum + x) +
      (200 * initCode.length) / 2 + // actual is usually somewhat smaller (only deposited code, not entire constructor)
      6 * Math.ceil(initCode.length / 64) + // hash price. very minor compared to deposit costs
      32000 +
      21000;
  console.log("gasLimit computed: ", gasLimit);
  const ret = await factory.deploy(initCode, saltBytes32, options);
  await ret.wait(2);
  return addr;
};

// deploy the EIP2470 factory, if not already deployed.
// (note that it requires to have a "signer" with 0.0247 eth, to fund the deployer's deployment
export const deployFactory = async (provider: Provider): Promise<void> => {
  try {
    // if (!(await isContract(FACTORY_ADDRESS, provider))) {
      console.log("factory not deployed");
      console.log("Topping Up deployer account");
      const signer = (provider as ethers.providers.JsonRpcProvider).getSigner();
      console.log('signer ', await signer.getAddress());
      
      // Return if it's already deployed
      const chainId = (await provider.getNetwork()).chainId;
      const deploymentFeeByNetwork = getFeeByNetwork(chainId);
      console.log('deploymentFeeByNetwork ', deploymentFeeByNetwork);
      
      const deployerBalance = await provider.getBalance(factoryDeployer);
      console.log('Deployer Balance ', deployerBalance);
      
      // if (deployerBalance.lt(deploymentFeeByNetwork)) {
      //   console.log("Topping Up Deployment Fee");
      //   const topUpDeploymentFee = deploymentFeeByNetwork.sub(deployerBalance);
      //   console.log('topUpDeploymentFee ', topUpDeploymentFee);
        
      //   const txn = await (signer ?? signer).sendTransaction({
      //     to: factoryDeployer,
      //     value: BigNumber.from(topUpDeploymentFee),
      //   });
      //   await txn.wait(2);
      // }
      console.log("Deploying Factory");  
      const tx = await provider.sendTransaction(factoryTx);
      console.log('tx ', tx);
      
      await tx.wait();
    // }
    // if still not deployed then throw / inform
  } catch (e) {
    console.log(e.message);
    throw e;
  }
};

export enum ChainId {
  // Ethereum
  MAINNET = 1,
  GOERLI = 5,
  POLYGON_MUMBAI = 80001,
  POLYGON_MAINNET = 137,
  BSC_TESTNET = 97,
  BSC_MAINNET = 56,
  GANACHE = 1337, //Temp
}

const getFeeByNetwork = (networkId: number) => {
  console.log('network id', networkId);
  
  switch (networkId) {
    case ChainId.GOERLI:
      return BigNumber.from((0.0045 * 1e18).toString())
    case ChainId.POLYGON_MUMBAI:
      return BigNumber.from((0.0045 * 1e18).toString())
    default:
      return BigNumber.from((0.0045 * 1e18).toString())
  }
};

export const numberToUint256 = (value: number) => {
  const hex = value.toString(16);
  return `0x${"0".repeat(64 - hex.length)}${hex}`;
};

export const saltToHex = (salt: string | number) => {
  salt = salt.toString();
  if (ethers.utils.isHexString(salt)) {
    return salt;
  }

  return ethers.utils.id(salt);
};

export const SALT = saltToHex("SCW_V2");

export const encodeParam = (dataType: any, data: any) => {
  const abiCoder = ethers.utils.defaultAbiCoder;
  return abiCoder.encode([dataType], [data]);
};

export const encodeParams = (dataTypes: any[], data: any[]) => {
  const abiCoder = ethers.utils.defaultAbiCoder;
  const encodedData = abiCoder.encode(dataTypes, data);
  console.log("encodedData ", encodedData);

  return encodedData;
};

export const isContract = async (address: string, provider: Provider) => {
  const code = await provider.getCode(address);
  console.log("isContract code is ", code);
  return code.slice(2).length > 0;
};

export const parseEvents = (
  receipt: TransactionReceipt,
  contractInterface: Interface,
  eventName: string
) =>
  receipt.logs
    .map((log) => contractInterface.parseLog(log))
    .filter((log) => log.name === eventName);
