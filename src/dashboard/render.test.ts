/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import {
  renderEmptyState,
  renderUnsupportedBrowser,
  renderNotice,
  renderDashboard,
  renderDrawer,
  closeDrawer,
  type DashboardCallbacks,
} from "./render.js";
import type { Evidence, HumanKernelIndex } from "../types.js";
import type { ParseWarning } from "../evidence-parser/index.js";

// Evidence dated "today" (computed at test-run time, not hardcoded) so it
// always falls inside renderEvidenceHeatmap's real default range (earliest
// evidence through "now") regardless of which real calendar day the suite
// happens to run on.
const TODAY_KEY = new Date().toISOString().slice(0, 10);

function makeIndex(overrides?: Partial<HumanKernelIndex>): HumanKernelIndex {
  return {
    schemaVersion: "0.1",
    generatedAt: "2026-08-02T00:00:00.000Z",
    evidence: [
      {
        id: "ev-1",
        sourceFile: "notes/monday.md",
        sourceRef: "callout#1",
        timestamp: `${TODAY_KEY}T09:00:00.000Z`,
        context: "planning session",
        observation: "Deferred the decision twice before committing.",
        confidence: 0.7,
      },
    ],
    parameters: [
      {
        id: "param-1",
        name: "decision deferral",
        domain: "Human",
        evidenceIds: ["ev-1"],
        confidence: 0.7,
        status: "draft",
      },
    ],
    relationships: [],
    ...overrides,
  };
}

function makeCallbacks(overrides?: Partial<DashboardCallbacks>): DashboardCallbacks {
  return {
    onOpenDate: vi.fn(),
    onRescan: vi.fn(),
    onConnectOwnVault: vi.fn(),
    onViewSample: vi.fn(),
    ...overrides,
  };
}

describe("renderUnsupportedBrowser", () => {
  it("renders a message mentioning unsupported browser", () => {
    const root = document.createElement("div");
    renderUnsupportedBrowser(root);
    expect(root.textContent).toMatch(/can't open a folder/i);
  });
});

describe("renderEmptyState", () => {
  it("renders a button that invokes onPickVault when clicked", () => {
    const root = document.createElement("div");
    const onPickVault = vi.fn();
    renderEmptyState(root, onPickVault);

    const btn = root.querySelector("button.hk-primary");
    expect(btn).not.toBeNull();
    btn?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(onPickVault).toHaveBeenCalledTimes(1);
  });
});

describe("renderNotice", () => {
  it("shows the given message in a dismissible toast", () => {
    const root = document.createElement("div");
    renderNotice(root, "Connecting your own vault needs Chrome, Edge, or Brave.");
    const toast = root.querySelector(".hk-lock-toast");
    expect(toast?.classList.contains("active")).toBe(true);
    expect(toast?.textContent).toMatch(/Chrome, Edge, or Brave/);
  });

  it("its own close control dismisses it", () => {
    const root = document.createElement("div");
    renderNotice(root, "test message");
    root.querySelector<HTMLElement>(".hk-lock-toast .hk-close")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.querySelector(".hk-lock-toast")?.classList.contains("active")).toBe(false);
  });

  it("its close control is keyboard-focusable and dismisses on Enter, not just click", () => {
    const root = document.createElement("div");
    renderNotice(root, "test message");
    const closeBtn = root.querySelector<HTMLElement>(".hk-lock-toast .hk-close");
    expect(closeBtn?.tabIndex).toBe(0);
    expect(closeBtn?.getAttribute("role")).toBe("button");
    closeBtn?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(root.querySelector(".hk-lock-toast")?.classList.contains("active")).toBe(false);
  });
});

describe("renderDashboard", () => {
  it("renders the source banner, and the heatmap goes into heatmapBody, not appRoot", () => {
    const appRoot = document.createElement("div");
    const heatmapBody = document.createElement("div");
    renderDashboard(appRoot, heatmapBody, makeIndex(), [], "own-vault", makeCallbacks());

    expect(appRoot.querySelector(".hk-source-banner")).not.toBeNull();
    expect(appRoot.querySelector(".hk-calendar")).toBeNull();
    expect(heatmapBody.querySelector(".hk-calendar")).not.toBeNull();
  });

  it("no longer renders any domain-grouped parameter grid or chart cards (scrapped 2026-08-02)", () => {
    const appRoot = document.createElement("div");
    const heatmapBody = document.createElement("div");
    renderDashboard(appRoot, heatmapBody, makeIndex(), [], "own-vault", makeCallbacks());

    expect(appRoot.querySelector(".hk-param-card")).toBeNull();
    expect(appRoot.querySelector(".hk-chart-card")).toBeNull();
    expect(appRoot.querySelector(".hk-overview")).toBeNull();
    expect(heatmapBody.querySelector(".hk-chart-card")).toBeNull();
  });

  it("clicking a day with real evidence calls onOpenDate with that date's evidence, filtered correctly", () => {
    const appRoot = document.createElement("div");
    const heatmapBody = document.createElement("div");
    const index = makeIndex();
    const callbacks = makeCallbacks();
    renderDashboard(appRoot, heatmapBody, index, [], "own-vault", callbacks);

    const activeCell = heatmapBody.querySelector<HTMLElement>(`.hk-heatmap-cell[data-date="${TODAY_KEY}"]`);
    expect(activeCell).not.toBeNull();
    activeCell?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(callbacks.onOpenDate).toHaveBeenCalledTimes(1);
    const [calledDate, calledEvidence] = (callbacks.onOpenDate as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Evidence[]];
    expect(calledDate).toBe(TODAY_KEY);
    expect(calledEvidence).toEqual(index.evidence);
  });

  it("a day with no evidence (level-0) is not wired to open anything", () => {
    const appRoot = document.createElement("div");
    const heatmapBody = document.createElement("div");
    const callbacks = makeCallbacks();
    renderDashboard(appRoot, heatmapBody, makeIndex(), [], "own-vault", callbacks);

    const emptyCell = heatmapBody.querySelector<HTMLElement>(".hk-heatmap-cell.level-0");
    emptyCell?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(callbacks.onOpenDate).not.toHaveBeenCalled();
  });

  it("renders one warning row per warning, never silently dropping any", () => {
    const appRoot = document.createElement("div");
    const heatmapBody = document.createElement("div");
    const warnings: ParseWarning[] = [
      { sourceFile: "a.md", sourceRef: "callout#1", message: "bad domain" },
      { sourceFile: "b.md", sourceRef: "callout#2", message: "bad confidence" },
    ];
    renderDashboard(appRoot, heatmapBody, makeIndex(), warnings, "own-vault", makeCallbacks());

    const rows = appRoot.querySelectorAll(".hk-warn-row");
    expect(rows.length).toBe(2);
  });

  it("shows an explicit empty message instead of nothing when there are no parameters", () => {
    const appRoot = document.createElement("div");
    const heatmapBody = document.createElement("div");
    renderDashboard(appRoot, heatmapBody, makeIndex({ parameters: [], evidence: [] }), [], "own-vault", makeCallbacks());
    expect(appRoot.textContent).toMatch(/nothing usable was found/i);
  });

  it("shows the sample-specific empty message when viewing the reference profile", () => {
    const appRoot = document.createElement("div");
    const heatmapBody = document.createElement("div");
    renderDashboard(appRoot, heatmapBody, makeIndex({ parameters: [], evidence: [] }), [], "sample", makeCallbacks());
    expect(appRoot.textContent).toMatch(/example profile is still being put together/i);
  });

  it("wires the rescan button to onRescan, and only shows it for a connected vault", () => {
    const appRoot = document.createElement("div");
    const heatmapBody = document.createElement("div");
    const callbacks = makeCallbacks();
    renderDashboard(appRoot, heatmapBody, makeIndex(), [], "own-vault", callbacks);
    const rescanBtn = appRoot.querySelector<HTMLElement>(".hk-toolbar .hk-primary");
    expect(rescanBtn).not.toBeNull();
    rescanBtn?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(callbacks.onRescan).toHaveBeenCalledTimes(1);

    const sampleRoot = document.createElement("div");
    const sampleHeatmapBody = document.createElement("div");
    renderDashboard(sampleRoot, sampleHeatmapBody, makeIndex(), [], "sample", makeCallbacks());
    expect(sampleRoot.querySelector(".hk-toolbar")).toBeNull();
  });
});

describe("renderDashboard source banner (view: sample vs. own-vault)", () => {
  it("sample view: renders no source banner at all (retired 2026-08-03 - direct request)", () => {
    const appRoot = document.createElement("div");
    const heatmapBody = document.createElement("div");
    const callbacks = makeCallbacks();
    renderDashboard(appRoot, heatmapBody, makeIndex(), [], "sample", callbacks);

    expect(appRoot.querySelector(".hk-source-banner")).toBeNull();
    expect(appRoot.textContent).not.toMatch(/real example profile/i);
    expect(appRoot.textContent).not.toMatch(/use my own notes instead/i);
    expect(callbacks.onConnectOwnVault).not.toHaveBeenCalled();
  });

  it("own-vault view: says it's showing the visitor's own notes and offers to go back to the sample", () => {
    const appRoot = document.createElement("div");
    const heatmapBody = document.createElement("div");
    const callbacks = makeCallbacks();
    renderDashboard(appRoot, heatmapBody, makeIndex(), [], "own-vault", callbacks);

    expect(appRoot.querySelector(".hk-source-banner")?.textContent).toMatch(/your own notes/i);
    appRoot.querySelector<HTMLElement>(".hk-source-banner .hk-link-btn")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(callbacks.onViewSample).toHaveBeenCalledTimes(1);
  });
});

describe("renderDrawer / closeDrawer", () => {
  it("renders every given Evidence entry, never fabricated ones", () => {
    const drawer = document.createElement("div");
    const index = makeIndex();

    renderDrawer(drawer, "August 2, 2026", index.evidence, vi.fn());

    const rows = drawer.querySelectorAll(".hk-evidence-row");
    expect(rows.length).toBe(index.evidence.length);
    expect(drawer.querySelector(".hk-src")?.textContent).toContain("notes/monday.md");
    expect(drawer.classList.contains("active")).toBe(true);
  });

  it("shows an explicit message instead of a blank popup when the day has no evidence", () => {
    const drawer = document.createElement("div");
    renderDrawer(drawer, "January 1, 2026", [], vi.fn());
    expect(drawer.textContent).toMatch(/nothing recorded/i);
  });

  it("closeDrawer removes the active class without destroying the drawer", () => {
    const drawer = document.createElement("div");
    renderDrawer(drawer, "August 2, 2026", makeIndex().evidence, vi.fn());
    closeDrawer(drawer);
    expect(drawer.classList.contains("active")).toBe(false);
  });

  it("the drawer's own close control calls the onClose callback", () => {
    const drawer = document.createElement("div");
    const onClose = vi.fn();
    renderDrawer(drawer, "August 2, 2026", makeIndex().evidence, onClose);
    drawer.querySelector<HTMLElement>(".hk-close")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has exactly one drag handle even after being re-rendered for a different day (no orphaned handle)", () => {
    const drawer = document.createElement("div");
    renderDrawer(drawer, "August 2, 2026", makeIndex().evidence, vi.fn());
    const firstHandle = drawer.querySelector(".hk-drawer-handle");

    renderDrawer(drawer, "January 1, 2026", [], vi.fn());
    const handlesAfterSecondRender = drawer.querySelectorAll(".hk-drawer-handle");

    expect(handlesAfterSecondRender.length).toBe(1);
    expect(handlesAfterSecondRender[0]).toBe(firstHandle); // same node instance, not replaced
    expect(drawer.textContent).toMatch(/nothing recorded/i);
  });
});
