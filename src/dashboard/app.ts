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
//
// Widget canvas split (fifth pass): wireBrowserUI now also takes the stable
// heatmapBody and drawerEl elements (see index.html/main.ts) so render.ts's
// renderDashboard can update just the vault-reactive parts without ever
// touching the persistent widget canvas around them - see render.ts's own
// top-of-file note for why that separation matters (it's what keeps the
// prayer/time-window/notepad widgets from being silently orphaned on every
// vault switch or rescan). Evidence detail now opens by DATE, not by
// Parameter, since heatmap cells are what's clickable now, not Parameter
// cards - onOpenDate builds a human date label and hands the day's real
// Evidence straight to renderDrawer.

import type { Evidence, HumanKernelIndex } from "../types.js";
import { parseVaultFile, type ParseWarning } from "../evidence-parser/index.js";
import { compile } from "../compiler/index.js";
import { serialize, writeIndex } from "../store/index.js";
import {
  renderDashboard,
  renderDrawer,
  closeDrawer,
  renderNotice,
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

export interface ProfileStatEls {
  evidence: HTMLElement;
  parameters: HTMLElement;
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

function formatDateLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

/** Browser glue. Not unit tested (needs a real window/document + real user
 * gesture for the folder picker, plus a real fetch of the bundled sample) -
 * kept intentionally thin so the untested surface area is as small as possible.
 *
 * `heatmapBody` and `drawerEl` are stable elements owned by index.html/main.ts
 * (see render.ts's top-of-file note) - this function never recreates them,
 * only asks render.ts to fill them. `statEls`, if given, gets the visitor-
 * facing "N evidence entries / N parameters tracked" counts kept in sync on
 * every render - optional so callers/tests that don't care about the profile
 * header stats aren't forced to wire them up. */
export async function wireBrowserUI(
  root: HTMLElement,
  heatmapBody: HTMLElement,
  drawerEl: HTMLElement,
  statEls?: ProfileStatEls
): Promise<void> {
  let currentIndex: HumanKernelIndex | null = null;
  let currentWarnings: ParseWarning[] = [];
  let currentVaultHandle: FileSystemDirectoryHandle | null = null;
  let viewing: ViewSource = "sample";

  const deps: VaultScanDeps = {
    readAllMarkdownFiles: async (handle) => {
      const { readAllMarkdownFiles } = await import("../vault-reader/index.js");
      return readAllMarkdownFiles(handle as FileSystemDirectoryHandle);
    },
    writeIndex: (handle, index) => writeIndex(handle as FileSystemDirectoryHandle, index),
  };

  // Re-renders from whatever was last loaded/scanned, without re-reading
  // anything - used for view switches so those never trigger a re-fetch or
  // re-scan.
  function renderCurrent(): void {
    if (!currentIndex) return;
    const index = currentIndex;
    renderDashboard(root, heatmapBody, index, currentWarnings, viewing, {
      onOpenDate: (dateKey: string, evidenceThatDay: Evidence[]) => {
        renderDrawer(drawerEl, formatDateLabel(dateKey), evidenceThatDay, () => closeDrawer(drawerEl));
      },
      onRescan: () => {
        void scanAndRender();
      },
      onConnectOwnVault: () => {
        void handlePickVault();
      },
      onViewSample: () => {
        void loadSampleAndRender();
      },
    });
    if (statEls) {
      statEls.evidence.textContent = String(index.evidence.length);
      statEls.parameters.textContent = String(index.parameters.length);
    }
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
        "Connecting your own notes needs Chrome, Edge, or Brave - this browser doesn't support it yet. The example profile above still works here."
      );
      return;
    }
    const { pickVault } = await import("../vault-reader/index.js");
    currentVaultHandle = await pickVault();
    await scanAndRender();
  }

  await loadSampleAndRender();
}
