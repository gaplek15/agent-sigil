// Hardhat config — used ONLY for local verification (no mainnet keys here).
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" },
  },
  paths: { sources: "./contracts", tests: "./test", artifacts: "./artifacts-hardhat" },
  networks: {
    hardhat: { hardfork: "cancun" },
  },
};
