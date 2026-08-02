// Pipeline test using a fake vault + fake deps - no real browser or File System
// Access API required (that's the whole point of runVaultScan taking deps as
// arguments). Runs in the default (node) vitest environment on purpose, so
// isBrowserSupported()'s "no window" branch is exercised for real, not faked.
import { describe, it, expect } from "vitest";
import { runVaultScan, isBrowserSupported, type VaultFileLike, type VaultScanDeps } from "./app.js";
import type { HumanKernelIndex } from "../types.js";

const VAULT_FILE = `
> [!evidence] domain:human parameter:"focus discipline" confidence:0.8
> Stayed on one task for 90 minutes without switching.

> [!evidence] domain:strategy parameter:"long horizon planning" confidence:0.6
> Mapped out a 3-year roadmap before starting the sprint.

> [!relationship] from:"focus discipline" to:"long horizon planning" type:supports confidence:0.5
> Sustained focus seems to be what makes the long roadmap achievable.

> [!evidence] domain:not-a-real-domain parameter:"broken" confidence:0.9
> This block must be rejected, not guessed into a domain.
`;

function makeFakeDeps(): { deps: VaultScanDeps; getWritten: () => HumanKernelIndex | undefined } {
  const files: VaultFileLike[] = [{ path: "vault/notes.md", text: VAULT_FILE }];
  let written: HumanKernelIndex | undefined;
  const deps: VaultScanDeps = {
    readAllMarkdownFiles: async () => files,
    writeIndex: async (_handle, index) => {
      written = index;
    },
  };
  return { deps, getWritten: () => written };
}

describe("runVaultScan", () => {
  it("runs the full parser -> compiler -> store pipeline against a fake vault", async () => {
    const { deps, getWritten } = makeFakeDeps();
    const result = await runVaultScan({}, deps);

    expect(result.index.parameters.length).toBe(2);
    expect(result.index.relationships.length).toBe(1);
    expect(result.index.schemaVersion).toBe("0.1");
    expect(getWritten()).toBe(result.index); // writeIndex received exactly what was returned, nothing re-derived
  });

  it("surfaces the rejected block as a warning instead of silently dropping or guessing it", async () => {
    const { deps } = makeFakeDeps();
    const result = await runVaultScan({}, deps);

    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0]?.message).toMatch(/domain/i);
  });

  it("never produces a Parameter with empty evidenceIds anywhere in the wired pipeline", async () => {
    const { deps } = makeFakeDeps();
    const result = await runVaultScan({}, deps);

    for (const param of result.index.parameters) {
      expect(param.evidenceIds.length).toBeGreaterThan(0);
    }
  });
});

describe("isBrowserSupported", () => {
  it("returns false outside a browser (this test runs in Node, no window/File System Access API)", () => {
    expect(isBrowserSupported()).toBe(false);
  });
});
