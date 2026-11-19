// Deploy AgentSigil to BNB Smart Chain.
// ── DO NOT RUN until the user explicitly approves the deploy. ──
// This script only READS a key from the environment; it never stores one.
//   BSC_RPC_URL      default https://bsc-dataseed.binance.org/ (mainnet 56)
//   DEPLOYER_KEY     private key of the deployer wallet (0x...). NEVER commit.
//   CONFIRM_DEPLOY   must be "yes" or the script refuses to broadcast.
//   AGENT_ID_ADDRESS override (default: the real SPACE ID Agent ID contract)
// Usage:
//   CONFIRM_DEPLOY=yes DEPLOYER_KEY=0x... node scripts/deploy.js
// After deploy: paste the printed address into website/config.js
// (BADGE_CONTRACT_ADDRESS) and verify the source on BscScan (see README).
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const ROOT = path.join(__dirname, "..");
const art = JSON.parse(fs.readFileSync(path.join(ROOT, "artifacts", "AgentSigil.json"), "utf8"));

const RPC = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/";
const AGENT_ID = process.env.AGENT_ID_ADDRESS || "0x60b9262456de011f7d15a54cdd8c48baaa8b022f";

(async () => {
  if (process.env.CONFIRM_DEPLOY !== "yes") {
    console.error("Refusing to deploy: set CONFIRM_DEPLOY=yes to broadcast.");
    process.exit(1);
  }
  if (!process.env.DEPLOYER_KEY) {
    console.error("Refusing to deploy: DEPLOYER_KEY is not set.");
    process.exit(1);
  }
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_KEY, provider);
  const net = await provider.getNetwork();
  console.log("chain:", Number(net.chainId), "| deployer:", wallet.address);
  console.log("balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "BNB");
  const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
  const tx = await factory.getDeployTransaction(AGENT_ID);
  const gas = await provider.estimateGas(tx);
  const fee = await provider.getFeeData();
  const gasPrice = fee.gasPrice ?? 0n;
  console.log("estimated deploy gas:", gas.toString(), "@ gasPrice", ethers.formatUnits(gasPrice, "gwei"), "gwei");
  console.log("estimated cost:", ethers.formatEther(gas * gasPrice), "BNB");
  const contract = await factory.deploy(AGENT_ID);
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log("AgentSigil deployed at:", addr);
  console.log("BscScan:", (Number(net.chainId) === 56 ? "https://bscscan.com/address/" : "https://testnet.bscscan.com/address/") + addr);
  fs.writeFileSync(path.join(ROOT, "deployed-address.txt"), addr + "\n");
  console.log("wrote deployed-address.txt — now set BADGE_CONTRACT_ADDRESS in website/config.js");
})().catch((e) => { console.error("DEPLOY FAILED:", e.message); process.exit(2); });
