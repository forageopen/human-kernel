// Orchestration layer: wires vault-reader -> evidence-parser -> compiler ->
// store -> render together. Split into two parts on purpose:
//
//   runVaultScan()  - pure-ish pipeline logic, takes its dependencies as
//                     arguments so it can be unit-tested with fakes, no real
//                     browser or File System Access API required.
//   wireBrowserUI() - thin glue that touches `window`/`document` and the real
//                     vault-reader/store modules. Not unit-testable without a
//                     real browser; kept deliberately small so there's as
//                     little untested code as possible.
//
// Full pipeline is covered by app.test.ts using a fake vault. There is no
// substitute in this repo for an actual manual click-through in Chrome/Edge/
// Brave with a real folder - that has NOT been done as of this commit. Treat
// this as wired-and-unit-tested, not "confirmed working end to end in a browser."
//
// Landing UX (2026-08-02 rebuild): the page always opens on the bundled
// reference profile (sample-data/index.json) - this needs only fetch(), not
// the File System Access API, so it works in every browser. Connecting a
// visitor's own vault is a secondary action reachable from the source
// banner, not a wall you have to click through before seeing anything.
// renderEmptyState()/renderUnsupportedBrowser() (render.ts) are still
// exported and unit-tested but are no longer called from this file - a
// full-page takeover doesn't fit a flow that always has something to show.

import type { HumanKernelIndex, Parameter } from "../types.js";
import { parseVaultFile, type ParseWarning } from "../evidence-parser/index.js";
import { compile } from "../compiler/index.js";
import { serialize, writeIndex } from "../store/index.js";
import {
  renderDashboard,
  renderDrawer,
  closeDrawer,
  renderImmersiveLockPrompt,
  renderNotice,
  type DashboardMode,
  type ViewSource,
} from "./render.js";

export interface VaultFileLike {
  path: string;
  text: string;
}

export interface VaultScanDeps {
  readAllMarkdownFiles: (vaultHandle: unknown) => Promise<VaultFileLike[]>;
  writeIndex: (vaultHandle: unknown, index: HumanKernelIndex) => Promise<void>;
}

export interface VaultScanResult {
  index: HumanKernelIndex;
  warnings: ParseWarning[];
}

const EMPTY_INDEX: HumanKernelIndex = {
  schemaVersion: "0.1",
  generatedAt: new Date(0).toISOString(),
  evidence: [],
  parameters: [],
  relationships: [],
};

/** The actual pipeline (Spec v0.1 §5, end to end). Pure given its deps - no
 * hidden globals - which is what makes this testable without a real browser. */
export async function runVaultScan(vaultHandle: unknown, deps: VaultScanDeps): Promise<VaultScanResult> {
  const files = await deps.readAllMarkdownFiles(vaultHandle);

  const allWarnings: ParseWarning[] = [];
  const allRawEvidence = [];
  const allRawRelationships = [];

  for (const file of files) {
    const parsed = parseVaultFile(file.path, file.text);
    allRawEvidence.push(...parsed.evidence);
    allRawRelationships.push(...parsed.relationships);
    allWarnings.push(...parsed.warnings);
  }

  const compiled = compile(allRawEvidence, allRawRelationships);
  allWarnings.push(...compiled.warnings);

  const index = serialize(compiled.evidence, compiled.parameters, compiled.relationships);
  await deps.writeIndex(vaultHandle, index);

  return { index, warnings: allWarnings };
}

/** Feature detection for ADR-0003 - call this before ever touching pickVault(). */
export function isBrowserSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/** Loads the bundled public reference profile via plain fetch - deliberately
 * NOT gated on isBrowserSupported(), since this path never touches the File
 * System Access API. Falls back to an honest empty index (renderDashboard's
 * own "still being prepared" message) rather than breaking the page if the
 * bundle is missing or the fetch fails outright. */
export async function loadSampleIndex(basePath = "sample-data/index.json"): Promise<VaultScanResult> {
  try {
    const res = await fetch(basePath);
    if (!res.ok) return { index: EMPTY_INDEX, warnings: [] };
    const index = (await res.json()) as HumanKernelIndex;
    return { index, warnings: [] };
  } catch {
    return { index: EMPTY_INDEX, warnings: [] };
  }
}

/** Browser glue. Not unit tested (needs a real window/document + real user
 * gesture for the folder picker, plus a real fetch of the bundled sample) -
 * kept intentionally thin so the untested surface area is as small as possible. */
export async function wireBrowserUI(root: HTMLElement): Promise<void> {
  let currentIndex: HumanKernelIndex | null = null;
  let currentWarnings: ParseWarning[] = [];
  let currentVaultHandle: FileSystemDirectoryHandle | null = null;
  // Brief v2 §9: Immersive is the ambient/awareness-layer view - lands here first.
  let mode: DashboardMode = "immersive";
  let viewing: ViewSource = "sample";

  const deps: VaultScanDeps = {
    readAllMarkdownFiles: async (handle) => {
      const { readAllMarkdownFiles } = await import("../vault-reader/index.js");
      return readAllMarkdownFiles(handle as FileSystemDirectoryHandle);
    },
    writeIndex: (handle, index) => writeIndex(handle as FileSystemDirectoryHandle, index),
  };

  // Re-renders from whatever was last loaded/scanned, without re-reading
  // anything - used for mode toggles and view switches so those never
  // trigger a re-fetch or re-scan.
  function renderCurrent(): void {
    if (!currentIndex) return;
    renderDashboard(root, currentIndex, currentWarnings, mode, viewing, {
      onOpenParameter: (param: Parameter) => {
        // Brief v2 §9, quoted exactly: "Immersive mode: ... Observation only."
        // Investigation (the drawer) is Inspect-mode-only - enforced here, not
        // just in the CSS, so this holds even if a click reaches the handler.
        if (mode === "inspect" && currentIndex) {
          renderDrawer(root, param, currentIndex, () => closeDrawer(root));
          return;
        }
        // Immersive: don't silently do nothing on click - say why, and let
        // one more click both switch mode and open the evidence that was
        // actually asked for, instead of dropping the user back at square one.
        renderImmersiveLockPrompt(root, () => {
          mode = "inspect";
          renderCurrent();
          if (currentIndex) renderDrawer(root, param, currentIndex, () => closeDrawer(root));
        });
      },
      onRescan: () => {
        void scanAndRender();
      },
      onModeChange: (newMode) => {
        mode = newMode;
        if (mode === "immersive") closeDrawer(root); // re-entering observation-only closes any open investigation
        renderCurrent();
      },
      onConnectOwnVault: () => {
        void handlePickVault();
      },
      onViewSample: () => {
        void loadSampleAndRender();
      },
    });
  }

  async function loadSampleAndRender(): Promise<void> {
    const result = await loadSampleIndex();
    currentIndex = result.index;
    currentWarnings = result.warnings;
    viewing = "sample";
    renderCurrent();
  }

  async function scanAndRender(): Promise<void> {
    if (!currentVaultHandle) return;
    const result = await runVaultScan(currentVaultHandle, deps);
    currentIndex = result.index;
    currentWarnings = result.warnings;
    viewing = "own-vault";
    renderCurrent();
  }

  async function handlePickVault(): Promise<void> {
    if (!isBrowserSupported()) {
      renderNotice(
        root,
        "Connecting your own vault needs Chrome, Edge, or Brave (ADR-0003) - the File System Access API isn't available here. The reference profile above still works in this browser."
      );
      return;
    }
    const { pickVault } = await import("../vault-reader/index.js");
    currentVaultHandle = await pickVault();
    await scanAndRender();
  }

  await loadSampleAndRender();
}
