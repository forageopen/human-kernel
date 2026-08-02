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

import type { HumanKernelIndex, Parameter } from "../types.js";
import { parseVaultFile, type ParseWarning } from "../evidence-parser/index.js";
import { compile } from "../compiler/index.js";
import { serialize, writeIndex } from "../store/index.js";
import {
  renderEmptyState,
  renderUnsupportedBrowser,
  renderDashboard,
  renderDrawer,
  closeDrawer,
  type DashboardMode,
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

/** Browser glue. Not unit tested (needs a real window/document + real user
 * gesture for the folder picker) - kept intentionally thin so the untested
 * surface area is as small as possible. */
export async function wireBrowserUI(root: HTMLElement): Promise<void> {
  if (!isBrowserSupported()) {
    renderUnsupportedBrowser(root);
    return;
  }

  // Dynamic import so this file stays loadable (and testable) in non-browser
  // environments where vault-reader's DOM-only types aren't available.
  const { pickVault, readAllMarkdownFiles } = await import("../vault-reader/index.js");

  let currentVaultHandle: FileSystemDirectoryHandle | null = null;
  let currentIndex: HumanKernelIndex | null = null;
  let currentWarnings: ParseWarning[] = [];
  // Brief v2 §9: Immersive is the ambient/awareness-layer view - lands here first.
  let mode: DashboardMode = "immersive";

  const deps: VaultScanDeps = {
    readAllMarkdownFiles: (handle) => readAllMarkdownFiles(handle as FileSystemDirectoryHandle),
    writeIndex: (handle, index) => writeIndex(handle as FileSystemDirectoryHandle, index),
  };

  // Re-renders from whatever was last scanned, without re-reading the vault -
  // used for mode toggles so switching Immersive/Inspect doesn't trigger a re-scan.
  function renderCurrent(): void {
    if (!currentIndex) return;
    renderDashboard(root, currentIndex, currentWarnings, mode, {
      onOpenParameter: (param: Parameter) => {
        // Brief v2 §9, quoted exactly: "Immersive mode: ... Observation only."
        // Investigation (the drawer) is Inspect-mode-only - enforced here, not
        // just in the CSS, so this holds even if a click reaches the handler.
        if (mode === "inspect" && currentIndex) {
          renderDrawer(root, param, currentIndex, () => closeDrawer(root));
        }
      },
      onRescan: () => {
        void scanAndRender();
      },
      onModeChange: (newMode) => {
        mode = newMode;
        if (mode === "immersive") closeDrawer(root); // re-entering observation-only closes any open investigation
        renderCurrent();
      },
    });
  }

  async function scanAndRender(): Promise<void> {
    if (!currentVaultHandle) return;
    const result = await runVaultScan(currentVaultHandle, deps);
    currentIndex = result.index;
    currentWarnings = result.warnings;
    renderCurrent();
  }

  async function handlePickVault(): Promise<void> {
    currentVaultHandle = await pickVault();
    await scanAndRender();
  }

  renderEmptyState(root, () => {
    void handlePickVault();
  });
}
