// Reads/writes .human-kernel/index.json. Spec: docs/specification-v0.1.md §2.
// Contract (Tension C boundary rule): this is the ONLY module that touches the
// index file. `dashboard` must never read it directly - always go through here.

import type { HumanKernelIndex, Evidence, Parameter, Relationship } from "../types.js";

const INDEX_DIR = ".human-kernel";
const INDEX_FILE = "index.json";

function sortById<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Deterministic serialization (Spec §2) - re-parsing an unchanged vault must
 * produce a byte-identical file (aside from generatedAt) to keep Git diffs sane. */
export function serialize(
  evidence: Evidence[],
  parameters: Parameter[],
  relationships: Relationship[]
): HumanKernelIndex {
  return {
    schemaVersion: "0.1",
    generatedAt: new Date().toISOString(),
    evidence: sortById(evidence),
    parameters: sortById(parameters),
    relationships: sortById(relationships),
  };
}

/**
 * Writes the index atomically. IMPORTANT: in the File System Access API, a
 * FileSystemWritableFileStream already writes to a temporary swap file - the
 * real on-disk file is only replaced when `close()` resolves. That IS this
 * project's atomic-write requirement (ADR-0001, added at the simulated
 * walkthrough) - there is no separate temp-file-then-rename step to write
 * ourselves, the platform already provides it. Do not add one.
 */
export async function writeIndex(
  vaultHandle: FileSystemDirectoryHandle,
  index: HumanKernelIndex
): Promise<void> {
  const dirHandle = await vaultHandle.getDirectoryHandle(INDEX_DIR, { create: true });
  const fileHandle = await dirHandle.getFileHandle(INDEX_FILE, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(index, null, 2));
  await writable.close(); // commit point - a crash before this leaves the old file untouched
}

export async function readIndex(
  vaultHandle: FileSystemDirectoryHandle
): Promise<HumanKernelIndex | null> {
  try {
    const dirHandle = await vaultHandle.getDirectoryHandle(INDEX_DIR);
    const fileHandle = await dirHandle.getFileHandle(INDEX_FILE);
    const file = await fileHandle.getFile();
    return JSON.parse(await file.text()) as HumanKernelIndex;
  } catch {
    return null; // no index yet - first run, or it was deleted (fully disposable by design, Spec §2)
  }
}

/** Debounce helper (Spec §2 / ADR-0001) - re-parse on save/idle, never on every keystroke. */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}
