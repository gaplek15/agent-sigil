// Agent Sigil — configuration.
// Fill in BADGE_CONTRACT_ADDRESS after deploying to BSC mainnet.
// Until then the site still works as an Agent ID checker (read-only).
window.SIGIL_CONFIG = {
  // BNB Chain mainnet.
  CHAIN_ID: 56,
  CHAIN_NAME: "BNB Smart Chain",
  CHAIN_HEX: "0x38",
  RPC_URL: "https://bsc-dataseed.binance.org/",
  EXPLORER: "https://bscscan.com",

  // SPACE ID Agent ID (ERC-721, non-transferable), as published by Binance
  // in the Agent ID Hackathon announcement. Do not change.
  AGENT_ID_ADDRESS: "0x60b9262456de011f7d15a54cdd8c48baaa8b022f",

  // Agent Sigil badge contract — deployed 19 Nov 2026 (BSC mainnet).
  BADGE_CONTRACT_ADDRESS: "0x647d90E42a6A3d190B0Ca600aBf316F1Eefb052f",
};
