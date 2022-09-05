import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-truffle5";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

const walletUtils = require("./walletUtils");

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  // defaultNetwork: "ganache",
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.8.7",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.8.12",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.4.23",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.6.2",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.5.12",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    ganache: {
      chainId: 1337,
      url: "http://localhost:8545",
      accounts: {
        mnemonic:
          "essay wolf rebel endorse cigar glove web output intact upset hundred remember",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      chainId: 3,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : walletUtils.makeKeyList(),
    },
    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      chainId: 4,
      gas: 5000000,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : walletUtils.makeKeyList(),
    },
    eth_mainnet: {
      url: process.env.ETH_MAINNET_URL || "",
      chainId: 1,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : walletUtils.makeKeyList(),
    },
    bsc: {
      url: process.env.BSC_URL || "",
      chainId: 56,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : walletUtils.makeKeyList(),
    },
    bsc_testnet: {
      url: process.env.BSC_TESTNET_URL || "",
      chainId: 97,
      gas: 5000000,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : walletUtils.makeKeyList(),
    },
    polygon_mumbai: {
      url: process.env.POLYGON_MUMBAI_URL || "",
      chainId: 80001,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : walletUtils.makeKeyList(),
    },
    polygon_mainnet: {
      url: process.env.POLYGON_URL || "",
      chainId: 137,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : walletUtils.makeKeyList(),
    },
    bnb_mainnet: {
      url: "https://bsc-dataseed2.binance.org",
      chainId: 56,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : walletUtils.makeKeyList(),
    },
    bnb_testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : walletUtils.makeKeyList(),
    },
    moonbeam_mainnet: {
      url: "https://rpc.api.moonbeam.network",
      chainId: 1284,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : walletUtils.makeKeyList(),
    },
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts: walletUtils.makeKeyList(),
      chainId: 5,
      // gas: 6400000
    },
    kovan: {
      url: process.env.KOVAN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : walletUtils.makeKeyList(),
      chainId: 42,
    },
    optimismGoerli: {
      url: `https://goerli.optimism.io`,
      accounts: walletUtils.makeKeyList(),
      chainId: 420,
      gasPrice: 6400000,
    },
    optimismMainnet: {
      url: `https://mainnet.optimism.io`,
      accounts: walletUtils.makeKeyList(),
      chainId: 10,
      // gasPrice: 6400000
    },
    celoTestnet: {
      url: `https://alfajores-forno.celo-testnet.org`,
      accounts: walletUtils.makeKeyList(),
      chainId: 44787,
      // gasPrice: 6400000
    },
    celoMainnet: {
      url: `https://forno.celo.org`,
      accounts: walletUtils.makeKeyList(),
      chainId: 42220,
      // gasPrice: 6400000
    },
    neonDevnet: {
      url: `https://proxy.devnet.neonlabs.org/solana`,
      accounts: walletUtils.makeKeyList(),
      chainId: 245022926,
      // gasPrice: 6400000
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
