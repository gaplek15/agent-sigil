// Compile contracts with solc-js. Usage: node scripts/compile.js
// Writes artifacts (abi + bytecode) to artifacts/<Contract>.json
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const ROOT = path.join(__dirname, "..");
const ART = path.join(ROOT, "artifacts");
fs.mkdirSync(ART, { recursive: true });

const SOURCES = {
  "AgentIdBadge.sol": "contracts/AgentIdBadge.sol",
  "MockAgentId.sol": "contracts/mocks/MockAgentId.sol",
};

function findImports(importPath) {
  // OpenZeppelin imports resolve from node_modules; local files from ROOT.
  const candidates = [
    path.join(ROOT, "node_modules", importPath),
    path.join(ROOT, importPath),
    path.join(ROOT, "contracts", importPath),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return { contents: fs.readFileSync(c, "utf8") };
  }
  return { error: "not found: " + importPath };
}

const input = {
  language: "Solidity",
  sources: {},
  settings: {
    optimizer: { enabled: true, runs: 200 },
    // NOTE: evmVersion intentionally left at solc default (Cancun).
    // OpenZeppelin 5.6 uses the MCOPY opcode, which only exists on
    // Cancun-compatible VMs. The local test chain must therefore run a
    // Cancun hardfork (see scripts/test.js). BSC mainnet supports Cancun
    // opcodes since the Haber hardfork (Jun 2024), so mainnet deploy is fine.
    outputSelection: { "*": { "*": ["abi", "evm.bytecode", "evm.deployedBytecode"] } },
  },
};
for (const [name, rel] of Object.entries(SOURCES)) {
  input.sources[name] = { content: fs.readFileSync(path.join(ROOT, rel), "utf8") };
}

const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (out.errors || []).filter((e) => e.severity === "error");
for (const e of out.errors || []) console.log(e.severity + ": " + e.formattedMessage);
if (errors.length) {
  console.error("COMPILE FAILED");
  process.exit(1);
}
for (const [file, contracts] of Object.entries(out.contracts)) {
  for (const [name, c] of Object.entries(contracts)) {
    fs.writeFileSync(
      path.join(ART, name + ".json"),
      JSON.stringify(
        { contractName: name, abi: c.abi, bytecode: "0x" + c.evm.bytecode.object },
        null,
        2
      )
    );
    const bytes = c.evm.bytecode.object.length / 2;
    console.log(`compiled ${name} (${file}): ${bytes} bytes deployed bytecode`);
  }
}
console.log("OK: artifacts in " + ART);
