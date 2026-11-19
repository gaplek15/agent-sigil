// Agent Sigil — front-end logic.
// Client-side only. No server, no sessions, no tracking.
// The user connects with their own wallet (injected provider, e.g. the
// Binance Wallet app browser or a browser extension). Every transaction
// is confirmed by the user in their own wallet — this page never asks
// for a seed phrase, private key, API secret or pairing code.
(() => {
  const cfg = window.SIGIL_CONFIG;
  const $ = (id) => document.getElementById(id);

  const AGENT_ID_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function name() view returns (string)",
  ];
  const BADGE_ABI = [
    "function mint()",
    "function burn(uint256 tokenId)",
    "function canMint(address account) view returns (bool)",
    "function hasBadge(address account) view returns (bool)",
    "function badgeOf(address account) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function totalMinted() view returns (uint256)",
  ];

  let provider = null; // ethers BrowserProvider (user wallet)
  let signer = null;
  let account = null;
  let readProvider = null; // public BSC RPC for read-only checks

  function setText(id, text) { const el = $(id); if (el) el.textContent = text; }
  function show(el, on) { if (el) el.style.display = on ? "" : "none"; }

  function getReadProvider() {
    if (!readProvider) readProvider = new ethers.JsonRpcProvider(cfg.RPC_URL);
    return readProvider;
  }

  function svgFromTokenURI(uri) {
    // data:application/json;base64,... -> image data URI -> inline SVG
    const json = JSON.parse(atob(uri.replace("data:application/json;base64,", "")));
    return json.image.replace("data:image/svg+xml;base64,", "");
  }

  async function checkAgentId(address) {
    const agentId = new ethers.Contract(cfg.AGENT_ID_ADDRESS, AGENT_ID_ABI, getReadProvider());
    const bal = await agentId.balanceOf(address);
    return bal;
  }

  async function refreshStatus() {
    const badgeAddr = cfg.BADGE_CONTRACT_ADDRESS;
    const badgeBox = $("badgeBox");
    const totalEl = $("totalMinted");
    if (!badgeAddr) {
      setText("deployNote", "Badge contract not deployed yet — this page currently works as an Agent ID checker. The mint button activates once the contract address is set in config.js.");
      show(badgeBox, false);
      if (totalEl) totalEl.textContent = "—";
      return;
    }
    show(badgeBox, true);
    setText("deployNote", "");
    try {
      const badge = new ethers.Contract(badgeAddr, BADGE_ABI, getReadProvider());
      const total = await badge.totalMinted();
      setText("totalMinted", total.toString());
      if (account) {
        const has = await badge.hasBadge(account);
        const can = await badge.canMint(account);
        setText("badgeStatus", has ? "You already hold a Sigil." : (can ? "You can mint your Sigil." : "Not eligible yet."));
        $("mintBtn").disabled = !can;
        if (has) {
          const id = await badge.badgeOf(account);
          const uri = await badge.tokenURI(id);
          const svgB64 = svgFromTokenURI(uri);
          $("badgeArt").innerHTML = '<img src="data:image/svg+xml;base64,' + svgB64 + '" alt="Your Agent Sigil" style="width:100%;max-width:320px;display:block;margin:8px auto">';
          setText("badgeId", "Sigil #" + id.toString());
        }
      }
    } catch (e) {
      setText("badgeStatus", "Could not read badge contract: " + (e.shortMessage || e.message));
    }
  }

  async function updateAccountUI() {
    if (!account) {
      setText("walletStatus", "Not connected.");
      setText("agentStatus", "—");
      $("mintBtn").disabled = true;
      $("connectBtn").textContent = "Connect wallet";
      return;
    }
    $("connectBtn").textContent = "Connected: " + account.slice(0, 6) + "…" + account.slice(-4);
    setText("walletStatus", "Connected on " + cfg.CHAIN_NAME + ".");
    try {
      const bal = await checkAgentId(account);
      const n = Number(bal);
      setText("agentStatus", n > 0 ? "Yes — you hold " + n + " Agent ID." : "No Agent ID found on this wallet.");
      $("agentStatus").className = "status " + (n > 0 ? "ok" : "bad");
      $("mintBtn").disabled = !(n > 0);
    } catch (e) {
      setText("agentStatus", "Could not check Agent ID: " + (e.shortMessage || e.message));
    }
    await refreshStatus();
  }

  async function connect() {
    if (!window.ethereum) {
      alert("No injected wallet found. Open this page in a wallet browser (for example the Binance Wallet app) or install a wallet extension, then try again.");
      return;
    }
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      account = accounts[0];
      signer = await provider.getSigner();
      const net = await provider.getNetwork();
      if (Number(net.chainId) !== cfg.CHAIN_ID) {
        const ok = confirm("You are on chain " + net.chainId + ". Switch to " + cfg.CHAIN_NAME + " (chain " + cfg.CHAIN_ID + ")?");
        if (ok) {
          try {
            await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: cfg.CHAIN_HEX }] });
          } catch (e) {
            alert("Please switch your wallet to " + cfg.CHAIN_NAME + " manually, then reload this page.");
            return;
          }
        } else {
          return;
        }
      }
      window.ethereum.on("accountsChanged", (accs) => { account = accs[0] || null; updateAccountUI(); });
      window.ethereum.on("chainChanged", () => window.location.reload());
      await updateAccountUI();
    } catch (e) {
      alert("Connection failed: " + (e.shortMessage || e.message));
    }
  }

  async function mint() {
    if (!cfg.BADGE_CONTRACT_ADDRESS) { alert("Badge contract is not deployed yet."); return; }
    if (!signer || !account) { alert("Connect your wallet first."); return; }
    $("mintBtn").disabled = true;
    setText("mintStatus", "Waiting for you to confirm the transaction in your wallet… (free mint — you only pay network gas)");
    try {
      const badge = new ethers.Contract(cfg.BADGE_CONTRACT_ADDRESS, BADGE_ABI, signer);
      // The contract itself enforces: you must hold an Agent ID, one badge
      // per address, no mint fee. If any check fails, the transaction
      // reverts and nothing is spent except gas for the failed attempt.
      const tx = await badge.mint();
      setText("mintStatus", "Transaction sent: " + tx.hash + " — waiting for confirmation…");
      const rc = await tx.wait();
      if (rc.status === 1) {
        setText("mintStatus", "Minted! ");
        const link = document.createElement("a");
        link.href = cfg.EXPLORER + "/tx/" + tx.hash;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "View on BscScan";
        $("mintStatus").appendChild(link);
      } else {
        setText("mintStatus", "Transaction failed on-chain (receipt status 0). No badge was minted.");
      }
    } catch (e) {
      setText("mintStatus", "Mint did not go through: " + (e.shortMessage || e.message || e));
    }
    $("mintBtn").disabled = false;
    await updateAccountUI();
  }

  async function lookup() {
    const addr = $("lookupInput").value.trim();
    if (!ethers.isAddress(addr)) { setText("lookupResult", "That does not look like a valid address."); return; }
    setText("lookupResult", "Checking…");
    try {
      const bal = await checkAgentId(addr);
      let msg = Number(bal) > 0
        ? addr.slice(0, 6) + "…" + addr.slice(-4) + " holds " + bal.toString() + " Agent ID."
        : addr.slice(0, 6) + "…" + addr.slice(-4) + " holds no Agent ID.";
      if (cfg.BADGE_CONTRACT_ADDRESS) {
        const badge = new ethers.Contract(cfg.BADGE_CONTRACT_ADDRESS, BADGE_ABI, getReadProvider());
        const has = await badge.hasBadge(addr);
        msg += has ? " It also holds Sigil #" + (await badge.badgeOf(addr)).toString() + "." : " It has not minted a Sigil yet.";
      }
      setText("lookupResult", msg);
    } catch (e) {
      setText("lookupResult", "Lookup failed: " + (e.shortMessage || e.message));
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("connectBtn").addEventListener("click", connect);
    $("mintBtn").addEventListener("click", mint);
    $("lookupBtn").addEventListener("click", lookup);
    refreshStatus();
  });
})();
