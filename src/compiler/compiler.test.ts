// Exercises the "no Parameter without Evidence" invariant end to end
// (docs/test-validation-plan.md, "The One Test That Matters Most").

import { describe, it, expect } from "vitest";
import { parseVaultFile } from "../evidence-parser/index.js";
import { compile } from "./index.js";

const SAMPLE_MD = `# Q3 Retro

> [!evidence] domain:human parameter:"Repeated shipping under pressure" confidence:0.9
> Shipped the Draft 5 rebuild two days early despite scope cut.

> [!evidence] domain:human parameter:"Repeated shipping under pressure" confidence:0.75
> Delivered the Cyberjaya cohort brief same-day as requested.

> [!evidence] domain:strategy parameter:"Prefers solo execution" confidence:1.4
> This one has an out-of-range confidence and must be rejected, not clamped.

> [!relationship] from:"Repeated shipping under pressure" to:"Burnout risk" type:causal confidence:0.6
> Burnout risk has no matching Parameter anywhere in this file - must warn, not fabricate.
`;

describe("evidence-parser + compiler", () => {
  it("groups evidence into one Parameter with mean confidence", () => {
    const parsed = parseVaultFile("q3-retro.md", SAMPLE_MD);
    const result = compile(parsed.evidence, parsed.relationships);

    const param = result.parameters.find((p) => p.name === "repeated shipping under pressure");
    expect(param).toBeDefined();
    expect(param!.evidenceIds.length).toBe(2);
    expect(param!.confidence).toBeCloseTo((0.9 + 0.75) / 2, 5);
    expect(param!.domain).toBe("Human");
  });

  it("never creates a Parameter with empty evidenceIds", () => {
    const parsed = parseVaultFile("q3-retro.md", SAMPLE_MD);
    const result = compile(parsed.evidence, parsed.relationships);
    for (const param of result.parameters) {
      expect(param.evidenceIds.length).toBeGreaterThan(0);
    }
  });

  it("rejects out-of-range confidence instead of clamping it", () => {
    const parsed = parseVaultFile("q3-retro.md", SAMPLE_MD);
    const result = compile(parsed.evidence, parsed.relationships);

    expect(result.parameters.find((p) => p.name === "prefers solo execution")).toBeUndefined();
    expect(parsed.warnings.some((w) => w.message.includes("not a number in [0.0, 1.0]"))).toBe(true);
  });

  it("warns on an unresolved relationship reference instead of fabricating it", () => {
    const parsed = parseVaultFile("q3-retro.md", SAMPLE_MD);
    const result = compile(parsed.evidence, parsed.relationships);

    expect(result.relationships.length).toBe(0);
    expect(result.warnings.some((w) => w.message.includes("Unresolved relationship reference"))).toBe(true);
  });
});
