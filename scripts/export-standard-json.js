// Export the EXACT solc standard-JSON input used to compile AgentSigil,
// with all imports inlined (needed for BscScan Standard-JSON verification).
// Replicates compile.js input keys/settings, then verifies by recompiling
// and comparing the AgentSigil creation bytecode to artifacts/AgentSigil.json.
const fs = require("fs");
const path = require("path");
const solc = require("solc");
const ROOT = path.join(__dirname, "..");

function findImports(importPath) {
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

// Resolve an import as solc does: relative imports resolve against the
// importing file's source-unit name (its key); absolute ones stay as-is.
function resolveImport(fromKey, imp) {
  if (imp.startsWith("./") || imp.startsWith("../")) {
    const dir = path.posix.dirname(fromKey);
    const joined = path.posix.normalize(path.posix.join(dir === "." ? "" : dir, imp));
    return joined;
  }
  return imp;
}

const input = {
  language: "Solidity",
  sources: {
    "AgentIdBadge.sol": { content: fs.readFileSync(path.join(ROOT, "contracts/AgentIdBadge.sol"), "utf8") },
    "MockAgentId.sol": { content: fs.readFileSync(path.join(ROOT, "contracts/mocks/MockAgentId.sol"), "utf8") },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "cancun",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode", "evm.deployedBytecode"] } },
  },
};

const importRe = /import\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g;
const queue = Object.keys(input.sources);
const seen = new Set(queue);
while (queue.length) {
  const key = queue.shift();
  const content = input.sources[key].content;
  let m;
  while ((m = importRe.exec(content)) !== null) {
    const imp = resolveImport(key, m[1]);
    if (seen.has(imp)) continue;
    seen.add(imp);
    const r = findImports(imp);
    if (r.error) { console.error("IMPORT MISSING:", imp, "(from", key, ")"); process.exit(1); }
    input.sources[imp] = { content: r.contents };
    queue.push(imp);
  }
}
console.log("sources inlined:", Object.keys(input.sources).length);
const outPath = path.join(ROOT, "flattened", "standard-json.json");
fs.writeFileSync(outPath, JSON.stringify(input, null, 2));
console.log("wrote", outPath, fs.statSync(outPath).size, "bytes");

// Self-check: recompile this exact JSON and compare AgentSigil creation bytecode.
const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (out.errors || []).filter((e) => e.severity === "error");
if (errors.length) { console.error("RECOMPILE FAILED", errors); process.exit(1); }
const rebuilt = "0x" + out.contracts["AgentIdBadge.sol"]["AgentSigil"].evm.bytecode.object;
const art = JSON.parse(fs.readFileSync(path.join(ROOT, "artifacts", "AgentSigil.json"), "utf8"));
console.log("bytecode match with deployed artifact:", rebuilt === art.bytecode);
if (rebuilt !== art.bytecode) {
  console.log("rebuilt len:", rebuilt.length, "artifact len:", art.bytecode.length);
  let i = 0; while (i < Math.min(rebuilt.length, art.bytecode.length) && rebuilt[i] === art.bytecode[i]) i++;
  console.log("first diff at char:", i);
}
