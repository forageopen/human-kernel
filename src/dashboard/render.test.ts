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

function makeCallbacks(overrides?: Partial<DashboardCallbacks>): DashboardCallbacks {
  return {
    onOpenParameter: vi.fn(),
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
  it("groups parameters by domain and renders a card per parameter", () => {
    const root = document.createElement("div");
    const index = makeIndex();
    const callbacks = makeCallbacks();

    renderDashboard(root, index, [], "own-vault", callbacks);

    const domainLabels = Array.from(root.querySelectorAll(".hk-label")).map((el) => el.textContent);
    expect(domainLabels).toContain("DOMAIN: HUMAN");

    const cards = root.querySelectorAll(".hk-param-card");
    expect(cards.length).toBe(1);
    cards[0]?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(callbacks.onOpenParameter).toHaveBeenCalledWith(index.parameters[0]);
  });

  it("parameter cards are keyboard-focusable and open on Enter/Space, not click-only", () => {
    const root = document.createElement("div");
    const index = makeIndex();
    const callbacks = makeCallbacks();
    renderDashboard(root, index, [], "own-vault", callbacks);

    const card = root.querySelector<HTMLElement>(".hk-param-card");
    expect(card?.tabIndex).toBe(0);
    expect(card?.getAttribute("role")).toBe("button");

    card?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(callbacks.onOpenParameter).toHaveBeenCalledWith(index.parameters[0]);

    card?.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(callbacks.onOpenParameter).toHaveBeenCalledTimes(2);
  });

  it("renders one warning row per warning, never silently dropping any", () => {
    const root = document.createElement("div");
    const warnings: ParseWarning[] = [
      { sourceFile: "a.md", sourceRef: "callout#1", message: "bad domain" },
      { sourceFile: "b.md", sourceRef: "callout#2", message: "bad confidence" },
    ];
    renderDashboard(root, makeIndex(), warnings, "own-vault", makeCallbacks());

    const rows = root.querySelectorAll(".hk-warn-row");
    expect(rows.length).toBe(2);
  });

  it("shows an explicit empty message instead of a blank grid when there are no parameters", () => {
    const root = document.createElement("div");
    renderDashboard(root, makeIndex({ parameters: [], evidence: [] }), [], "own-vault", makeCallbacks());
    expect(root.textContent).toMatch(/no \[!evidence\] blocks were found/i);
  });

  it("shows the sample-specific empty message when viewing the reference profile", () => {
    const root = document.createElement("div");
    renderDashboard(root, makeIndex({ parameters: [], evidence: [] }), [], "sample", makeCallbacks());
    expect(root.textContent).toMatch(/reference profile is still being prepared/i);
  });

  it("wires the rescan button to onRescan, and only shows it for a connected vault", () => {
    const root = document.createElement("div");
    const callbacks = makeCallbacks();
    renderDashboard(root, makeIndex(), [], "own-vault", callbacks);
    const rescanBtn = root.querySelector<HTMLElement>(".hk-toolbar .hk-primary");
    expect(rescanBtn).not.toBeNull();
    rescanBtn?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(callbacks.onRescan).toHaveBeenCalledTimes(1);

    const sampleRoot = document.createElement("div");
    renderDashboard(sampleRoot, makeIndex(), [], "sample", makeCallbacks());
    expect(sampleRoot.querySelector(".hk-toolbar")).toBeNull();
  });

  it("renders the profile overview (heatmap + chart grid) above the domain grid when parameters exist", () => {
    const root = document.createElement("div");
    renderDashboard(root, makeIndex(), [], "sample", makeCallbacks());
    expect(root.querySelector(".hk-overview")).not.toBeNull();
    expect(root.querySelector(".hk-heatmap-card")).not.toBeNull();
    expect(root.querySelectorAll(".hk-chart-card").length).toBe(6);
  });

  it("opens the evidence drawer directly on card click - no mode gating (removed 2026-08-02)", () => {
    const root = document.createElement("div");
    const index = makeIndex();
    renderDashboard(root, index, [], "own-vault", {
      onOpenParameter: (param) => renderDrawer(root, param, index, () => closeDrawer(root)),
      onRescan: vi.fn(),
      onConnectOwnVault: vi.fn(),
      onViewSample: vi.fn(),
    });

    root.querySelector<HTMLElement>(".hk-param-card")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.querySelector(".hk-drawer")?.classList.contains("active")).toBe(true);
  });
});

describe("renderDashboard source banner (view: sample vs. own-vault)", () => {
  it("sample view: names the reference profile and offers to connect a vault", () => {
    const root = document.createElement("div");
    const callbacks = makeCallbacks();
    renderDashboard(root, makeIndex(), [], "sample", callbacks);

    expect(root.querySelector(".hk-source-banner")?.textContent).toMatch(/reference profile/i);
    root.querySelector<HTMLElement>(".hk-source-banner .hk-link-btn")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(callbacks.onConnectOwnVault).toHaveBeenCalledTimes(1);
  });

  it("own-vault view: says a vault is connected and offers to view the sample instead", () => {
    const root = document.createElement("div");
    const callbacks = makeCallbacks();
    renderDashboard(root, makeIndex(), [], "own-vault", callbacks);

    expect(root.querySelector(".hk-source-banner")?.textContent).toMatch(/your own vault is connected/i);
    root.querySelector<HTMLElement>(".hk-source-banner .hk-link-btn")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(callbacks.onViewSample).toHaveBeenCalledTimes(1);
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
