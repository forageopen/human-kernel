// Sanity-checks the JSON Schemas actually enforce what docs/specification-v0.1.md
// claims they enforce - most importantly, that a Parameter with empty evidenceIds
// is rejected (the machine-checkable version of "never invent", Brief v2 §10).
// Run: npm run validate-schema

import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";

const ajv = new Ajv({ strict: true });
addFormats(ajv);

const load = (path) => JSON.parse(readFileSync(path, "utf8"));
const validateEvidence = ajv.compile(load("schema/evidence.schema.json"));
const validateParameter = ajv.compile(load("schema/parameter.schema.json"));
const validateRelationship = ajv.compile(load("schema/relationship.schema.json"));

let failures = 0;
function check(label, actual, expected) {
  const pass = actual === expected;
  console.log(`${pass ? "PASS" : "FAIL"} - ${label} (expected ${expected}, got ${actual})`);
  if (!pass) failures += 1;
}

const goodEvidenceId = "550e8400-e29b-41d4-a716-446655440000";

check(
  "valid Evidence is accepted",
  validateEvidence({
    id: goodEvidenceId,
    sourceFile: "q3-retro.md",
    timestamp: new Date().toISOString(),
    context: "Q3 Retro",
    observation: "Shipped early.",
    confidence: 0.8,
  }),
  true
);

check(
  "Parameter with empty evidenceIds is REJECTED (the core invariant)",
  validateParameter({
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "test",
    domain: "Human",
    evidenceIds: [],
    confidence: 0.5,
    status: "draft",
  }),
  false
);

check(
  "Parameter with a real evidenceIds entry is accepted",
  validateParameter({
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "test",
    domain: "Human",
    evidenceIds: [goodEvidenceId],
    confidence: 0.5,
    status: "draft",
  }),
  true
);

check(
  "Relationship with an invalid relationshipType enum value is rejected",
  validateRelationship({
    id: "550e8400-e29b-41d4-a716-446655440002",
    sourceParameterId: "550e8400-e29b-41d4-a716-446655440001",
    targetParameterId: "550e8400-e29b-41d4-a716-446655440001",
    relationshipType: "made-up-type",
    confidence: 0.5,
    verification: "unverified",
  }),
  false
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed - the schema no longer enforces what the docs claim.`);
  process.exit(1);
}
console.log("\nAll schema invariant checks passed.");
