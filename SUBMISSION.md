# Agent Sigil — Hackathon Submission Checklist

Hackathon: **Binance Wallet × BNB Chain Agent ID Hackathon**
Submission window: **18 Nov 2026 08:00 UTC – 9 Dec 2026 08:00 UTC (= 9 Dec 2026 15:00 WIB)**
Submit at: the hackathon submission page linked in the announcement
(https://www.binance.com/en/support/announcement/detail/95f5dbe0ea674a48a739b59e046648bf)

## What is ready

- [x] Project name: **Agent Sigil** (symbol `SIGIL`) — no "Binance"/"BNB" in the name
- [x] Concept + philosophy: wax seal (see README §1)
- [x] Smart contract: `contracts/AgentIdBadge.sol` — ERC-721, free mint, 1 per address, soulbound, on-chain metadata, **zero owner/admin functions**
- [x] Contract compiled: 8,016 bytes deployed bytecode (< 24,576 limit)
- [x] Local tests: Hardhat 7/7 passing (incl. tokenURI + SVG); Ganache 21 pass / 0 fail / 1 documented skip (tokenURI — Ganache env limitation, see README §4)
- [x] Website: static site in `website/` (connect, Agent ID check, mint, read-only lookup) — red-line compliant
- [x] Live mainnet verification of the gate: Agent ID contract `0x60b9262456de011f7d15a54cdd8c48baaa8b022f` exists (8,756 bytes); agent wallet `0xDE23…eE83` holds 1 Agent ID
- [x] Gas estimates: deploy 1,714,423 gas (~$0.05–$3 at 0.05–3 gwei); mint 142,478 gas; burn 38,994 gas
- [x] Deploy script: `scripts/deploy.js` (not run — needs user approval + `CONFIRM_DEPLOY=yes`)

## What is still missing (needs user decisions)

- [ ] **Deploy decision** — which wallet deploys, and funding it with a little BNB for gas (~$0.05–$3). No deploy has been done; no funds spent.
- [ ] **Deployed contract address** (BSC mainnet) — fill into `website/config.js` after deploy.
- [ ] **BscScan source verification** — after deploy (Solidity 0.8.28, EVM Cancun, optimizer 200 runs, MIT).
- [ ] **Live website URL** — host `website/` somewhere public (GitHub Pages / IPFS / Vercel static) and use that URL in the submission.
- [ ] **Project description for the form** — 1–2 paragraphs: use README §1–§2 (concept + how it works). Mention: live product, Agent ID integration depth (on-chain `balanceOf` gate on every mint), free, soulbound, no owner.
- [ ] **Demo / screenshots** — screenshot of the website + the minted badge (take after the first live mint). The badge art: `assets/badge-sample.svg`.
- [ ] **Innovation Award note (if applying)** — the product must be LIVE with ≥30 Agent ID addresses interacting. That means after deploy: get 30+ Agent ID holders to mint. This is the hardest requirement — plan outreach (X post, Agent ID community, hackathon channels). X promo is currently blocked (account @kingxpqxyz suspended), so this needs another channel.
- [ ] **Community Promotion (optional, $100 × 20)** — post on X with #BinanceWalletHackathon + #AgenticWallet and submit the link via the survey. Blocked while X is suspended.

## Do NOT do

- Do not submit before the contract is deployed + verified + the website is live at a public URL.
- Do not use "Binance"/"BNB" in the project name, token, or domain.
- Do not promise returns, yield or "passive income" anywhere in the submission copy.
- Do not collect seed phrases, private keys, API secrets or pairing codes — the product never asks for them.
