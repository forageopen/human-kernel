/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import {
  renderEmptyState,
  renderUnsupportedBrowser,
  renderDashboard,
  renderDrawer,
  closeDrawer,
  renderImmersiveLockPrompt,
  closeImmersiveLockPrompt,
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

    renderDashboard(root, index, [], "inspect", { onOpenParameter, onRescan, onModeChange: vi.fn() });

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
    renderDashboard(root, makeIndex(), warnings, "inspect", {
      onOpenParameter: vi.fn(),
      onRescan: vi.fn(),
      onModeChange: vi.fn(),
    });

    const rows = root.querySelectorAll(".hk-warn-row");
    expect(rows.length).toBe(2);
  });

  it("shows an explicit empty-vault message instead of a blank grid when there are no parameters", () => {
    const root = document.createElement("div");
    renderDashboard(root, makeIndex({ parameters: [], evidence: [] }), [], "inspect", {
      onOpenParameter: vi.fn(),
      onRescan: vi.fn(),
      onModeChange: vi.fn(),
    });
    expect(root.textContent).toMatch(/no \[!evidence\] blocks were found/i);
  });

  it("wires the rescan button to onRescan", () => {
    const root = document.createElement("div");
    const onRescan = vi.fn();
    renderDashboard(root, makeIndex(), [], "inspect", { onOpenParameter: vi.fn(), onRescan, onModeChange: vi.fn() });
    root.querySelector<HTMLElement>(".hk-toolbar .hk-primary")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(onRescan).toHaveBeenCalledTimes(1);
  });
});

describe("renderDashboard mode toggle (Brief v2 §9: Immersive/Inspect)", () => {
  it("marks the current mode's button active and the other one not", () => {
    const root = document.createElement("div");
    renderDashboard(root, makeIndex(), [], "immersive", {
      onOpenParameter: vi.fn(),
      onRescan: vi.fn(),
      onModeChange: vi.fn(),
    });
    const buttons = Array.from(root.querySelectorAll<HTMLElement>(".hk-mode-btn"));
    const immersiveBtn = buttons.find((b) => b.textContent === "Immersive");
    const inspectBtn = buttons.find((b) => b.textContent === "Inspect");
    expect(immersiveBtn?.classList.contains("active")).toBe(true);
    expect(inspectBtn?.classList.contains("active")).toBe(false);
  });

  it("calls onModeChange with the clicked mode", () => {
    const root = document.createElement("div");
    const onModeChange = vi.fn();
    renderDashboard(root, makeIndex(), [], "immersive", { onOpenParameter: vi.fn(), onRescan: vi.fn(), onModeChange });
    const inspectBtn = Array.from(root.querySelectorAll<HTMLElement>(".hk-mode-btn")).find(
      (b) => b.textContent === "Inspect"
    );
    inspectBtn?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(onModeChange).toHaveBeenCalledWith("inspect");
  });

  it("applies the scroll-lock class to body only in immersive mode", () => {
    const root = document.createElement("div");
    renderDashboard(root, makeIndex(), [], "immersive", {
      onOpenParameter: vi.fn(),
      onRescan: vi.fn(),
      onModeChange: vi.fn(),
    });
    expect(document.body.classList.contains("hk-immersive")).toBe(true);

    renderDashboard(root, makeIndex(), [], "inspect", {
      onOpenParameter: vi.fn(),
      onRescan: vi.fn(),
      onModeChange: vi.fn(),
    });
    expect(document.body.classList.contains("hk-immersive")).toBe(false);
  });
});

describe("renderImmersiveLockPrompt / closeImmersiveLockPrompt", () => {
  it("shows a prompt instead of doing nothing when evidence is blocked", () => {
    const root = document.createElement("div");
    renderImmersiveLockPrompt(root, vi.fn());
    const toast = root.querySelector(".hk-lock-toast");
    expect(toast?.classList.contains("active")).toBe(true);
    expect(toast?.textContent).toMatch(/observation only/i);
  });

  it("calls onSwitchToInspect when its own action button is clicked", () => {
    const root = document.createElement("div");
    const onSwitchToInspect = vi.fn();
    renderImmersiveLockPrompt(root, onSwitchToInspect);
    root.querySelector<HTMLElement>(".hk-lock-toast-btn")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(onSwitchToInspect).toHaveBeenCalledTimes(1);
  });

  it("closeImmersiveLockPrompt removes the active class without destroying the toast", () => {
    const root = document.createElement("div");
    renderImmersiveLockPrompt(root, vi.fn());
    closeImmersiveLockPrompt(root);
    expect(root.querySelector(".hk-lock-toast")?.classList.contains("active")).toBe(false);
  });

  it("the toast's own close control also dismisses it", () => {
    const root = document.createElement("div");
    renderImmersiveLockPrompt(root, vi.fn());
    root.querySelector<HTMLElement>(".hk-lock-toast .hk-close")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.querySelector(".hk-lock-toast")?.classList.contains("active")).toBe(false);
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
