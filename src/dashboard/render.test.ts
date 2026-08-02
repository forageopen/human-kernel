/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import {
  renderEmptyState,
  renderUnsupportedBrowser,
  renderDashboard,
  renderDrawer,
  closeDrawer,
} from "./render.js";
import type { HumanKernelIndex, Parameter } from "../types.js";
import type { ParseWarning } from "../evidence-parser/index.js";

function makeIndex(overrides?: Partial<HumanKernelIndex>): HumanKernelIndex {
  return {
    schemaVersion: "0.1",
    generatedAt: "2026-08-02T00:00:00.000Z",
    evidence: [
      {
        id: "ev-1",
        sourceFile: "notes/monday.md",
        sourceRef: "callout#1",
        timestamp: "2026-08-01T00:00:00.000Z",
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

describe("renderUnsupportedBrowser", () => {
  it("renders a message mentioning unsupported browser", () => {
    const root = document.createElement("div");
    renderUnsupportedBrowser(root);
    expect(root.textContent).toMatch(/not supported/i);
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

describe("renderDashboard", () => {
  it("groups parameters by domain and renders a card per parameter", () => {
    const root = document.createElement("div");
    const index = makeIndex();
    const onOpenParameter = vi.fn();
    const onRescan = vi.fn();

    renderDashboard(root, index, [], { onOpenParameter, onRescan });

    const domainLabels = Array.from(root.querySelectorAll(".hk-label")).map((el) => el.textContent);
    expect(domainLabels).toContain("DOMAIN: HUMAN");

    const cards = root.querySelectorAll(".hk-param-card");
    expect(cards.length).toBe(1);
    cards[0]?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(onOpenParameter).toHaveBeenCalledWith(index.parameters[0]);
  });

  it("renders one warning row per warning, never silently dropping any", () => {
    const root = document.createElement("div");
    const warnings: ParseWarning[] = [
      { sourceFile: "a.md", sourceRef: "callout#1", message: "bad domain" },
      { sourceFile: "b.md", sourceRef: "callout#2", message: "bad confidence" },
    ];
    renderDashboard(root, makeIndex(), warnings, { onOpenParameter: vi.fn(), onRescan: vi.fn() });

    const rows = root.querySelectorAll(".hk-warn-row");
    expect(rows.length).toBe(2);
  });

  it("shows an explicit empty-vault message instead of a blank grid when there are no parameters", () => {
    const root = document.createElement("div");
    renderDashboard(root, makeIndex({ parameters: [], evidence: [] }), [], {
      onOpenParameter: vi.fn(),
      onRescan: vi.fn(),
    });
    expect(root.textContent).toMatch(/no \[!evidence\] blocks were found/i);
  });

  it("wires the rescan button to onRescan", () => {
    const root = document.createElement("div");
    const onRescan = vi.fn();
    renderDashboard(root, makeIndex(), [], { onOpenParameter: vi.fn(), onRescan });
    root.querySelector<HTMLElement>(".hk-toolbar button")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(onRescan).toHaveBeenCalledTimes(1);
  });
});

describe("renderDrawer / closeDrawer", () => {
  it("renders every linked Evidence for the given Parameter, never fabricated ones", () => {
    const root = document.createElement("div");
    const index = makeIndex();
    const param = index.parameters[0] as Parameter;

    renderDrawer(root, param, index, vi.fn());

    const rows = root.querySelectorAll(".hk-evidence-row");
    expect(rows.length).toBe(index.evidence.length);
    expect(root.querySelector(".hk-src")?.textContent).toContain("notes/monday.md");
    expect(root.querySelector(".hk-drawer")?.classList.contains("active")).toBe(true);
  });

  it("closeDrawer removes the active class without destroying the drawer", () => {
    const root = document.createElement("div");
    const index = makeIndex();
    renderDrawer(root, index.parameters[0] as Parameter, index, vi.fn());
    closeDrawer(root);
    expect(root.querySelector(".hk-drawer")?.classList.contains("active")).toBe(false);
  });

  it("the drawer's own close control calls the onClose callback", () => {
    const root = document.createElement("div");
    const index = makeIndex();
    const onClose = vi.fn();
    renderDrawer(root, index.parameters[0] as Parameter, index, onClose);
    root.querySelector<HTMLElement>(".hk-close")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
