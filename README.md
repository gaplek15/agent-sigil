# Agent Sigil

**A wax seal for Agent ID holders.**

A free, soulbound, on-chain badge for anyone who holds an Agent ID (`.ai` name) on BNB Smart Chain. Built for the Binance Wallet × BNB Chain Agent ID Hackathon (submission window 18 Nov – 9 Dec 2026).

> Not affiliated with, endorsed by, or connected to Binance, BNB Chain or SPACE ID. The words "Binance" and "BNB" appear here only where the hackathon itself requires them (chain name, announcement reference) — never in the project name, token symbol or domain.

---

## 1 · Concept & philosophy

### The idea

An Agent ID is a name. A name cannot be bought, borrowed or transferred — it is bound to the person who claimed it. A badge that proves you hold such a name should obey the same rule: **if the name cannot move, its seal cannot move either.**

### The metaphor: a wax seal

For centuries a wax seal did three things at once:

1. **It proved identity** — the seal belonged to one person, and only that person could stamp it.
2. **It could not be re-sold** — a seal has no value to anyone except its owner; stealing it proves nothing, because the seal is meaningless without the hand that stamps it.
3. **It was destroyed when renounced** — breaking a seal was a deliberate, public act of giving it up.

Agent Sigil is that seal, on-chain:

- The **gold double ring + hexagram** in the badge art is the seal itself; the **gold dot** at its center is the stamp; the words `AGENT` / `SIGIL` are set like an inscription, not a logo.
- **Soulbound** — the badge cannot be transferred, sold or approved to anyone. Stealing the idea of it proves nothing, because the contract only mints to an address that *currently* holds an Agent ID.
- **Burn to renounce** — the holder can destroy their own badge at any time (gas only). Burning frees the address to mint again later, e.g. after their Agent ID changes.

### What it is not

Agent Sigil is a proof-of-identity badge, **not an investment**. It pays no yield, promises no return, and gives no financial benefit. There is no token sale, no fee, and no admin key.

---

## 2 · How it works

```
User holds Agent ID (.ai name)
        │  ERC-721 0x60b9…22f on BSC, balanceOf(user) > 0
        ▼
User connects wallet on the website, presses "Mint my Sigil"
        │  free mint (value = 0); user confirms the tx in their own wallet
        ▼
AgentSigil.mint() checks on-chain:
  · balanceOf(user) > 0 on the Agent ID contract, else revert NotAgentIdHolder
  · user has no badge yet, else revert AlreadyMinted
        ▼
Sigil #N minted to the user (ERC-721, soulbound)
  · name / description / image live fully on-chain
    (tokenURI returns data:application/json;base64 with an inline SVG)
  · transferFrom / safeTransferFrom revert (Soulbound)
  · approve / setApprovalForAll revert (ApprovalDisabled)
```

**Burn:** the owner may call `burn(tokenId)` any time (gas only). This clears their badge flag, so they can mint again later — a new token id, a fresh seal.

---

## 3 · Contract design decisions

| Decision | Choice | Why |
|---|---|---|
| Gate | `balanceOf(msg.sender) > 0` on Agent ID contract `0x60b9262456de011f7d15a54cdd8c48baaa8b022f` (immutable) | The hackathon's own definition of "holds an Agent ID". Read live, every mint — no allowlist, no snapshot, no server. |
| Price | Free (value 0), gas only | A seal should not be sold. Keeping it free also keeps the hackathon's "no promised returns" line clean. |
| Supply | 1 badge per address | One name, one seal. Enforced by `hasBadge` mapping. |
| Transferability | **Soulbound** (non-transferable) | A transferable badge would be a tradable "proof of someone else's name" — the opposite of the concept. OZ ERC-721 `_update` hook rejects every transfer; approvals are disabled entirely. |
| Metadata | Fully on-chain (JSON + SVG, base64) | No IPFS gateway, no server that must stay alive. The badge art is generated in Solidity from the token id. |
| Owner / admin | **None — zero privileged functions** | The contract has no `Ownable`, no admin, no `setBaseURI`, no pausing, no minting for others. Once deployed, nobody — including the deployer — can change the art, mint for someone, or take a badge away. This is a deliberate hackathon-compliance choice: there is nothing to document as an owner permission because there are none. |
| Re-mint after burn | Allowed (new token id) | Burning is renunciation, not punishment. |

### Contract

- `contracts/AgentIdBadge.sol` — `AgentSigil` (Solidity ^0.8.20, OpenZeppelin 5.6.1, `ERC721`)
- `contracts/mocks/MockAgentId.sol` — minimal mock Agent ID, **local tests only**, never deployed to mainnet
- Custom errors: `NotAgentIdHolder`, `AlreadyMinted`, `Soulbound`, `ApprovalDisabled`
- Events: `BadgeMinted(address indexed to, uint256 indexed tokenId)`, `BadgeBurned(address indexed from, uint256 indexed tokenId)`

---

## 4 · Verification status (local, 19 Nov 2026)

Toolchain: node v24.22.1, solc-js 0.8.28, @openzeppelin/contracts 5.6.1, ethers 6.17.0, ganache 7.9.2, hardhat 2.29.2.

| Check | Result |
|---|---|
| `node scripts/compile.js` (solc, optimizer runs 200, evmVersion cancun) | ✅ Compiles. AgentSigil deployed bytecode 8,016 bytes (< 24,576 limit). MockAgentId 4,465 bytes. |
| `npx hardhat test` (Hardhat Network, Cancun) | ✅ **7/7 passing**, incl. `tokenURI` returns valid on-chain metadata + SVG (decoded JSON: name `Agent Sigil #1`, description mentions Agent ID, SVG contains `#1`, `AGENT`, `SIGIL`, attributes include `Soulbound: Yes`). Sample SVG written to `assets/badge-sample.svg` from the real `tokenURI` output. |
| `node scripts/test.js` (Ganache) | ✅ 21 passed, 0 failed, **1 skipped** (tokenURI). |
| Live BSC mainnet read (19 Nov ~12:20 WIB) | ✅ Agent ID contract `0x60b9…22f` exists (8,756 bytes of code); `balanceOf` of the deployer's agent wallet `0xDE23…eE83` = **1** — the exact gate the badge checks. |

**Known environment limitation (documented, not hidden):** Ganache 7.9.2 on this VM cannot execute this contract's string-returning view calls. Its default hardfork predates PUSH0, `hardfork: "shanghai"` still reverts `tokenURI`, and `hardfork: "cancun"` makes Ganache dump its own bundle and exit 0. `tokenURI` is therefore verified on Hardhat Network instead (see above); the Ganache suite records it as SKIP with the reason inline. This does **not** affect mainnet: BSC supports Cancun opcodes since the Haber hardfork (Jun 2024), and the bytecode is compiled for Cancun (required by OpenZeppelin 5.6, which uses MCOPY).

**Not yet verified:** anything that requires a real deploy — mainnet gas on a live deploy, BscScan source verification, and the website against the deployed contract (the site currently runs in "not deployed yet" mode: Agent ID checking works, mint is disabled until `BADGE_CONTRACT_ADDRESS` is set in `website/config.js`). No mainnet transaction has been sent and no funds have been spent.

### Measured gas (local, identical on Ganache and Hardhat)

| Action | Gas |
|---|---|
| Deploy | 1,714,423 |
| Mint (user) | 142,478 |
| Burn (user) | 38,994 |

### Mainnet cost estimate (BSC, 19 Nov 2026 ~12:20 WIB)

Live readings: gas price **0.05 gwei**, BNB **$586.34** (CoinGecko; $586.72 Binance US), USD/IDR **18,239**. BSC gas price moves; the table shows the live reading plus conservative scenarios.

| Action | @ 0.05 gwei (live) | @ 0.1 gwei | @ 1 gwei | @ 3 gwei |
|---|---|---|---|---|
| Deploy | 0.0000857 BNB ≈ **$0.05 ≈ Rp917** | 0.000171 BNB ≈ $0.10 ≈ Rp1,834 | 0.001714 BNB ≈ $1.01 ≈ Rp18,337 | 0.005143 BNB ≈ $3.02 ≈ Rp55,013 |
| Mint (per user) | 0.0000071 BNB ≈ $0.004 ≈ Rp76 | 0.0000142 BNB ≈ $0.008 ≈ Rp152 | 0.000142 BNB ≈ $0.084 ≈ Rp1,524 | 0.000427 BNB ≈ $0.25 ≈ Rp4,571 |
| Burn | 0.0000019 BNB ≈ $0.001 ≈ Rp21 | 0.0000039 BNB ≈ $0.002 ≈ Rp42 | 0.0000390 BNB ≈ $0.023 ≈ Rp418 | 0.000117 BNB ≈ $0.069 ≈ Rp1,253 |

Realistic deploy cost is **$0.05–$3** depending on the gas price at deploy time. BscScan source verification is free.

---

## 5 · Website

Static site in `website/` — no build step, no server, no database, no tracking.

- `index.html` — page + real badge SVG preview (from `tokenURI` output) + FAQ
- `style.css` — wax-seal dark theme
- `app.js` — ethers v6 (CDN) logic: connect (injected provider only), Agent ID check, mint, burn note, read-only address lookup
- `config.js` — chain + contract addresses. Set `BADGE_CONTRACT_ADDRESS` after deploy.

**Red-line compliance (hackathon rules):**
- No web-based QR login for the wallet. Only an injected provider (`window.ethereum`); the user opens the page in their own wallet browser if they want.
- No login session stored anywhere (no server at all).
- No prompt that bypasses transaction confirmation — the user confirms every mint in their own wallet; the page only sends the transaction after they press Mint.
- No seed phrase / private key / API secret / pairing code is ever asked for or collected.
- No promised returns or "passive income" anywhere — the copy explicitly says the badge pays nothing.
- No brand impersonation: the project name, symbol (`SIGIL`) and copy never use "Binance"/"BNB" as a brand; "BNB Smart Chain" appears only as the factual chain name, with a non-affiliation footer.

**Hosting:** any static host (GitHub Pages, IPFS, Vercel static, plain web server). Serve the `website/` folder as-is. For the hackathon, the live URL must be filled in (see `SUBMISSION.md`).

---

## 6 · Deploy to BSC mainnet (when the user approves)

1. **Decide the deployer wallet** — the deployer pays only gas (~$0.05–$3, see table). No other funds are needed; the contract holds no funds and collects no fees.
2. **Fund it with a little BNB** for gas (e.g. 0.01 BNB is far more than enough).
3. **Run the deploy script** (it refuses to broadcast without explicit confirmation):
   ```bash
   cd ~/workspace/agent-id-badge
   CONFIRM_DEPLOY=yes DEPLOYER_KEY=0x... node scripts/deploy.js
   ```
   It prints the deployed address and writes `deployed-address.txt`. Never commit or share the private key.
4. **Set the address** in `website/config.js` (`BADGE_CONTRACT_ADDRESS`) and redeploy the static site.
5. **Verify the source on BscScan** (free):
   - Open `https://bscscan.com/address/<deployed>` → Contract → Verify and Publish.
   - Compiler: Solidity **0.8.28**, EVM version **Cancun**, optimizer **enabled, 200 runs**, license MIT.
   - Source: flatten `contracts/AgentIdBadge.sol` with its OpenZeppelin imports (or verify via Hardhat's verify plugin once the repo is a Hardhat project — `hardhat.config.js` is already present).
   - After verification, BscScan shows the source, `Read Contract` / `Write Contract`, and the public can confirm there is no owner function.
6. **Smoke-test the live contract** (read-only first): `canMint(<your agent wallet>)` should be `true`; then mint once from that wallet and confirm the badge appears on the website and on BscScan's token page.

> Testnet note: BSC testnet has no real Agent ID contract, so a testnet deploy would point at a mock. For a meaningful end-to-end test, deploy a mock Agent ID on testnet first, then the badge pointing at it. The mock is in `contracts/mocks/MockAgentId.sol`.

---

## 7 · Repo layout

```
agent-id-badge/
├── README.md                  this file
├── SUBMISSION.md              hackathon submission checklist (what is still missing)
├── contracts/
│   ├── AgentIdBadge.sol       the badge contract
│   └── mocks/MockAgentId.sol  local-test mock only
├── scripts/
│   ├── compile.js             solc-js compile (artifacts/*.json)
│   ├── test.js                Ganache end-to-end test (21 pass, 1 documented skip)
│   └── deploy.js              BSC deploy helper (needs CONFIRM_DEPLOY=yes, not run)
├── test/
│   └── hardhat-test.js        Hardhat test (7/7 passing, incl. tokenURI)
├── hardhat.config.js          Hardhat 2, solidity 0.8.28, evmVersion cancun
├── website/
│   ├── index.html  style.css  app.js  config.js
├── assets/
│   └── badge-sample.svg       real tokenURI SVG output (token #1)
├── artifacts/                 compiled ABI + bytecode (from compile.js)
├── artifacts-hardhat/         compiled artifacts (from hardhat test)
├── package.json
└── .gitignore
```

## 8 · License

MIT. OpenZeppelin contracts are MIT-licensed (see `node_modules/@openzeppelin/contracts/LICENSE.md`).
