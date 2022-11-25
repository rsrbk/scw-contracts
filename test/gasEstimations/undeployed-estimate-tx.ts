// note: one or more tests need ganache to be running and set as default network

import { expect } from "chai";
import { ethers } from "hardhat";
import {
  SmartWallet,
  WalletFactory,
  EntryPoint,
  TestToken,
  MultiSend,
  StorageSetter,
  GasEstimator,
  DefaultCallbackHandler,
  SmartWalletNoAuth,
} from "../../typechain";
import { BytesLike, Contract } from "ethers";
import { encodeTransfer, encodeTransferFrom } from "../smart-wallet/testUtils";
import {
  buildContractCall,
  MetaTransaction,
  SafeTransaction,
  Transaction,
  FeeRefund,
  executeTx,
  safeSignTypedData,
  buildSafeTransaction,
  executeContractCallWithSigners,
} from "../../src/utils/execution";
import {
  buildMultiSendSafeTx,
  encodeMultiSend,
} from "../../src/utils/multisend";
// import { deployContract } from "../utils/setupHelper";
const SCWNoAuth = require("/Users/chirag/work/biconomy/scw-playground/scw-contracts/artifacts/contracts/smart-contract-wallet/SmartWalletNoAuth.sol/SmartWalletNoAuth.json");

function tryDecodeError(bytes: BytesLike): string {
  try {
    return ethers.utils.toUtf8String(
      "0x" + ethers.utils.hexlify(bytes).substr(138)
    );
  } catch (e) {
    return "UNKNOWN_ERROR";
  }
}

const options = {
  dataZeroCost: 4,
  dataOneCost: 16,
  baseCost: 21000,
};

function txBaseCost(data: BytesLike): number {
  const bytes = ethers.utils.arrayify(data);
  return bytes
    .reduce(
      (p, c) =>
        c === 0 ? p.add(options.dataZeroCost) : p.add(options.dataOneCost),
      ethers.constants.Zero
    )
    .add(options.baseCost)
    .toNumber();
}

describe("Wallet tx deployment + batch gas estimation", function () {
  let baseImpl: Contract;
  let walletFactory: Contract;
  let entryPoint: Contract;
  let token: Contract;
  let realUSDC: Contract;
  let multiSend: Contract;
  let multiSendCall: Contract;
  let storage: StorageSetter;
  let estimator: Contract;
  let owner: string;
  let bob: string;
  let charlie: string;
  let userSCW: any;
  let handler: Contract;
  const UNSTAKE_DELAY_SEC = 100;
  const PAYMASTER_STAKE = ethers.utils.parseEther("1");
  // const create2FactoryAddress = "0xce0042B868300000d44A59004Da54A005ffdcf9f";
  let accounts: any;

  /* const decoderSource = `
            contract Decoder {
                function decode(address to, bytes memory data) public returns (bytes memory) {
                    (bool success, bytes memory data) = to.call(data);
                    require(!success, "Shit happens");
                    return data;
                }
            }`; */

  // let estimate: (address: string, data: ethers.BytesLike) => { call: () => Promise<{success: boolean, result: string, gas: string}> }

  /* const domainType = [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "verifyingContract", type: "address" },
      { name: "salt", type: "bytes32" },
    ]; */

  before(async () => {
    accounts = await ethers.getSigners();
    // const addresses = await ethers.provider.listAccounts();
    // const ethersSigner = ethers.provider.getSigner();

    owner = await accounts[0].getAddress();
    bob = await accounts[1].getAddress();
    charlie = await accounts[2].getAddress();
    console.log("owner address ", owner);

    const baseWalletAddress = "0x1572bE4ca6EE072b3A3F82dCA003ED980ff98732";
    const multiSendAddress = "0x2f65bed438a30827d408b7c6818ec5a22c022dd1";
    const multiSendCallAddress = "0xa1677d8c8edb188e49ecd832236af281d6b0b20e";
    const walletFactoryAddress = "0xf59cda6fd211303bfb79f87269abd37f565499d8";
    const entryPointAddress = "0x119Df1582E0dd7334595b8280180f336c959F3bb";
    const fallbackHandlerAddress = "0x0bc0c08122947be919a02f9861d83060d34ea478";
    const gasEstimatorAddress = "0x65db1c3c53b7e4eea71eba504d8f05369e63ed34";
    const decoderAddress = "0x69214e26ab458fe20b7c3337530b994cd49c8686";
    const usdcMumbai = "0xdA5289fCAAF71d52a80A254da614a192b693e977";
    const usdtMumbai = "0xeaBc4b91d9375796AA4F69cC764A4aB509080A58";

    const BaseImplementation = await ethers.getContractFactory("SmartWallet");
    baseImpl = await BaseImplementation.deploy();
    await baseImpl.deployed();
    console.log("base wallet impl deployed at: ", baseImpl.address);

    /* baseImpl = await ethers.getContractAt(
      "contracts/smart-contract-wallet/SmartWallet.sol:SmartWallet",
      baseWalletAddress
    ); */

    const WalletFactory = await ethers.getContractFactory("WalletFactory");
    walletFactory = await WalletFactory.deploy(baseImpl.address);
    await walletFactory.deployed();
    console.log("wallet factory deployed at: ", walletFactory.address);

    /* walletFactory = await ethers.getContractAt(
      "contracts/smart-contract-wallet/WalletFactory.sol:WalletFactory",
      walletFactoryAddress
    ); */

    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    entryPoint = await EntryPoint.deploy(PAYMASTER_STAKE, UNSTAKE_DELAY_SEC);
    await entryPoint.deployed();
    console.log("Entry point deployed at: ", entryPoint.address);

    /* entryPoint = await ethers.getContractAt(
      "contracts/smart-contract-wallet/aa-4337/core/EntryPoint.sol:EntryPoint",
      entryPointAddress
    ); */

    const TestToken = await ethers.getContractFactory("TestToken");
    token = await TestToken.deploy();
    await token.deployed();
    console.log("Test token deployed at: ", token.address);

    /* realUSDC = await ethers.getContractAt(
      "contracts/smart-contract-wallet/test/IERC20.sol:IERC20",
      usdcMumbai
    ); */

    const DefaultHandler = await ethers.getContractFactory(
      "DefaultCallbackHandler"
    );
    handler = await DefaultHandler.deploy();
    await handler.deployed();
    console.log("Default callback handler deployed at: ", handler.address);

    /* handler = await ethers.getContractAt(
      "contracts/smart-contract-wallet/handler/DefaultCallbackHandler.sol:DefaultCallbackHandler",
      fallbackHandlerAddress
    ); */

    const Storage = await ethers.getContractFactory("StorageSetter");
    storage = await Storage.deploy();
    console.log("storage setter contract deployed at: ", storage.address);

    const MultiSend = await ethers.getContractFactory("MultiSend");
    multiSend = await MultiSend.deploy();
    console.log("Multisend helper contract deployed at: ", multiSend.address);

    /* multiSend = await ethers.getContractAt(
      "contracts/smart-contract-wallet/libs/MultiSend.sol:MultiSend",
      multiSendAddress
    ); */

    const MultiSendCallOnly = await ethers.getContractFactory(
      "MultiSendCallOnly"
    );
    multiSendCall = await MultiSendCallOnly.deploy();
    console.log(
      "MultiSendCallOnly helper contract deployed at: ",
      multiSendCall.address
    );

    /* multiSendCall = await ethers.getContractAt(
      "contracts/smart-contract-wallet/libs/MultiSendCallOnly.sol:MultiSendCallOnly",
      multiSendCallAddress
    ); */

    const Estimator = await ethers.getContractFactory("GasEstimator");
    estimator = await Estimator.deploy();
    console.log("Gas Estimator contract deployed at: ", estimator.address);

    /* estimator = await ethers.getContractAt(
      "contracts/smart-contract-wallet/utils/GasEstimator.sol:GasEstimator",
      gasEstimatorAddress
    ); */

    console.log("mint tokens to owner address..");
    await token.mint(owner, ethers.utils.parseEther("1000000"));
    const bal = await token.balanceOf(owner);
    console.log("owner usdc balance ", bal.toString());
  });

  // describe("Wallet initialization", function () {
  it("Should set the correct states on proxy", async function () {
    const expected = await walletFactory.getAddressForCounterfactualWallet(
      owner,
      10
    );
    console.log("deploying new wallet..expected address: ", expected);

    await expect(
      walletFactory
        .connect(accounts[3])
        .deployCounterFactualWallet(
          owner,
          entryPoint.address,
          handler.address,
          10
        )
    )
      .to.emit(walletFactory, "WalletCreated")
      .withArgs(expected, baseImpl.address, owner, "1.0.1", 10);

    userSCW = await ethers.getContractAt(
      "contracts/smart-contract-wallet/SmartWallet.sol:SmartWallet",
      expected
    );

    const entryPointAddress = await userSCW.entryPoint();
    expect(entryPointAddress).to.equal(entryPoint.address);

    const walletOwner = await userSCW.owner();
    expect(walletOwner).to.equal(owner);

    const walletNonce1 = await userSCW.getNonce(0); // only 0 space is in the context now
    const walletNonce2 = await userSCW.getNonce(1);
    const chainId = await userSCW.getChainId();

    console.log("walletNonce1 ", walletNonce1);
    console.log("walletNonce2 ", walletNonce2);
    console.log("chainId ", chainId);

    await accounts[1].sendTransaction({
      from: bob,
      to: expected,
      value: ethers.utils.parseEther("5"),
    });
  });

  it("Should estimate wallet deployment and send first transacton", async function () {
    const expected = await walletFactory.getAddressForCounterfactualWallet(
      owner,
      11
    );
    console.log("deploying new wallet..expected address: ", expected);

    await token
      .connect(accounts[0])
      .transfer(userSCW.address, ethers.utils.parseEther("100"));

    await token
      .connect(accounts[0])
      .transfer(expected, ethers.utils.parseEther("100"));

    const safeTx: SafeTransaction = buildSafeTransaction({
      to: token.address,
      // value: ethers.utils.parseEther("1"),
      data: encodeTransfer(charlie, ethers.utils.parseEther("10").toString()),
      nonce: await userSCW.getNonce(0), // should be 0 for undeployed wallet
    });

    const chainId = await userSCW.getChainId();

    userSCW = userSCW.attach(expected);
    console.log("expected ", expected);

    // requiredTxGas should be estimated for any flow. so targetTxGas can be overridden before final signing
    // similary after below gas estimation handle payment has to be accounted for... and then populate refund info followed by sig

    // could be fake sig at first (no auth no refund + batch!)

    /* const signResponse = await safeSignTypedData(
      accounts[0],
      userSCW,
      safeTx,
      chainId
    ); */
    // FAKE
    const signature =
      "0x39f5032f1cd30005aa1e35f04394cabfe7de3b6ae6d95b27edd8556064c287bf61f321fead0cf48ca4405d497cc8fc47fc7ff0b7f5c45baa14090a44f2307d8230";
    // const signature = "0x" + signResponse.data.slice(2);

    console.log(safeTx);

    const transaction: Transaction = {
      to: safeTx.to,
      value: safeTx.value,
      data: safeTx.data,
      operation: safeTx.operation,
      targetTxGas: safeTx.targetTxGas,
    };
    // lol no refund info
    const refundInfo: FeeRefund = {
      baseGas: safeTx.baseGas,
      gasPrice: safeTx.gasPrice,
      tokenGasPriceFactor: safeTx.tokenGasPriceFactor,
      gasToken: safeTx.gasToken,
      refundReceiver: safeTx.refundReceiver,
    };

    const txs: MetaTransaction[] = [
      buildContractCall(
        walletFactory,
        "deployCounterFactualWallet",
        [owner, entryPoint.address, handler.address, 55],
        0
      ),
      buildContractCall(
        userSCW,
        "execTransaction",
        [transaction, 1, refundInfo, signature],
        0
      ),
    ];

    const SmartWallet = await ethers.getContractFactory("SmartWallet");

    const Estimator = await ethers.getContractFactory("GasEstimator");

    const MultiSendCallOnly = await ethers.getContractFactory(
      "MultiSendCallOnly"
    );

    const gasEstimatorInterface = Estimator.interface;
    // encoded estimate we should do on MultiSendCallOnly

    const encodedEstimate = gasEstimatorInterface.encodeFunctionData(
      "estimate",
      [
        multiSendCall.address,
        MultiSendCallOnly.interface.encodeFunctionData("multiSend", [
          encodeMultiSend(txs),
        ]),
      ]
    );

    const response = await ethers.provider.send("eth_call", [
      {
        to: estimator.address,
        data: encodedEstimate,
        from: bob,
        // gasPrice: ethers.BigNumber.from(100000000000).toHexString(),
        // gas: "200000",
      },
      "latest",
      // now the problem is wallet factory won't estimate if I override bytecode cause create2 will conflict...
      // what I could do is change the index just for this estimation!!

      {
        [expected]: {
          code: SCWNoAuth.deployedBytecode,
        },
      },
    ]);

    const decoded = gasEstimatorInterface.decodeFunctionResult(
      "estimate",
      response
    );

    console.log("decoded");
    console.log(decoded);

    if (!decoded.success) {
      throw Error(
        `Failed gas estimation with ${tryDecodeError(decoded.result)}`
      );
    }

    console.log(
      "estimated gas to be used ",
      ethers.BigNumber.from(decoded.gas)
        .add(txBaseCost(encodedEstimate))
        .toNumber()
    );

    /// ////////////////////

    // we will send transaction on multisend after right refund info and signature...

    // transaction.targetTxGas has to be updated...

    /// ////////

    // Below is to estimate internal tx gas / requiredTxGas for undeployed wallet!

    const encodedEstimate1 = gasEstimatorInterface.encodeFunctionData(
      "estimate",
      [
        expected,
        SmartWallet.interface.encodeFunctionData("requiredTxGas", [
          safeTx.to,
          safeTx.value,
          safeTx.data,
          safeTx.operation,
        ]),
      ]
    );

    const response1 = await ethers.provider.send("eth_call", [
      {
        to: estimator.address,
        data: encodedEstimate1,
        from: bob,
        // gasPrice: ethers.BigNumber.from(100000000000).toHexString(),
        // gas: "200000",
      },
      "latest",
      // now the problem is wallet factory won't estimate if I override bytecode cause create2 will conflict...
      // what I could do is change the index just for this estimation!!

      {
        [expected]: {
          code: SCWNoAuth.deployedBytecode,
        },
      },
    ]);

    const decoded1 = gasEstimatorInterface.decodeFunctionResult(
      "estimate",
      response1
    );

    console.log("decoded1");
    console.log(decoded1);

    if (!decoded1.success) {
      throw Error(
        `Failed gas estimation with ${tryDecodeError(decoded1.result)}`
      );
    }

    const internalEstimate = ethers.BigNumber.from(decoded1.gas)
      .add(txBaseCost(encodedEstimate1))
      .toNumber();

    console.log("targetTxGas estimation part 1: ", internalEstimate);

    /// ////////

    transaction.targetTxGas = internalEstimate + 30000; // offset
    safeTx.targetTxGas = internalEstimate + 30000; // offset

    const { signer, data } = await safeSignTypedData(
      accounts[0],
      userSCW,
      safeTx,
      chainId
    );
    let realSig = "0x";
    realSig += data.slice(2);

    const realTxs: MetaTransaction[] = [
      buildContractCall(
        walletFactory,
        "deployCounterFactualWallet",
        [owner, entryPoint.address, handler.address, 11],
        0
      ),
      buildContractCall(
        userSCW,
        "execTransaction",
        [transaction, 1, refundInfo, realSig],
        0
      ),
    ];

    // await expect(
    const txn = await multiSendCall
      .connect(accounts[0])
      .multiSend(encodeMultiSend(realTxs));

    const receipt = await txn.wait(1);
    console.log("Real txn gas used: ", receipt.gasUsed.toNumber());

    // expect(estimatedGas).to.approximately(receipt.gasUsed.toNumber(), 8000);

    expect(await token.balanceOf(charlie)).to.equal(
      ethers.utils.parseEther("10").toString()
    );
  });
});
