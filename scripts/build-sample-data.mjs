// Compiles sample-vault/*.md into sample-data/index.json using the exact same
// parseVaultFile -> compile -> serialize pipeline a visitor's own vault goes
// through in the browser (src/dashboard/app.ts's runVaultScan). This script
// is the ONLY thing that produces sample-data/index.json - it must never be
// hand-edited (see sample-vault/README.md and Brief v2 §10, "never invent").
//
// Run after `npm run build` (needs dist/, this is plain Node, not ts-node):
//   npm run build && npm run build-sample-data

import { readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseVaultFile } from "../dist/evidence-parser/index.js";
import { compile } from "../dist/compiler/index.js";
import { serialize } from "../dist/store/index.js";

const VAULT_DIR = "sample-vault";
const OUT_DIR = "sample-data";
const OUT_FILE = join(OUT_DIR, "index.json");

function listMarkdownFiles(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();
}

const files = listMarkdownFiles(VAULT_DIR);
if (files.length === 0) {
  console.error(`No .md files found in ${VAULT_DIR}/ - nothing to compile.`);
  process.exit(1);
}

const allRawEvidence = [];
const allRawRelationships = [];
const allWarnings = [];

for (const file of files) {
  const path = join(VAULT_DIR, file);
  const text = readFileSync(path, "utf8");
  const parsed = parseVaultFile(file, text);
  allRawEvidence.push(...parsed.evidence);
  allRawRelationships.push(...parsed.relationships);
  allWarnings.push(...parsed.warnings);
}

const compiled = compile(allRawEvidence, allRawRelationships);
allWarnings.push(...compiled.warnings);

if (allWarnings.length > 0) {
  console.error(`\n${allWarnings.length} warning(s) - a hand-authored block likely has a typo:`);
  for (const w of allWarnings) {
    console.error(`  ${w.sourceFile} (${w.sourceRef}): ${w.message}`);
  }
  console.error("\nRefusing to write sample-data/index.json with unexplained parse warnings. Fix the source .md and re-run.");
  process.exit(1);
}

const index = serialize(compiled.evidence, compiled.parameters, compiled.relationships);

try {
  statSync(OUT_DIR);
} catch {
  console.error(`${OUT_DIR}/ does not exist - create it first.`);
  process.exit(1);
}

writeFileSync(OUT_FILE, JSON.stringify(index, null, 2) + "\n");

console.log(`Wrote ${OUT_FILE}`);
console.log(`  ${index.evidence.length} evidence, ${index.parameters.length} parameters, ${index.relationships.length} relationships`);
const byDomain = new Map();
for (const p of index.parameters) byDomain.set(p.domain, (byDomain.get(p.domain) ?? 0) + 1);
for (const [domain, count] of byDomain) console.log(`  ${domain}: ${count} parameter(s)`);
