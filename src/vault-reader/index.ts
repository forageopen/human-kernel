// The ONLY module that touches the real file system (Tension C boundary rule).
// Spec: docs/specification-v0.1.md, walkthrough §3.

export interface VaultFile {
  path: string; // relative to vault root
  text: string;
}

/** Opens the browser's native folder picker. Chromium-only (ADR-0003) - callers
 * MUST feature-detect `"showDirectoryPicker" in window` and show the explicit
 * unsupported-browser message (ADR-0003) before calling this, not after it throws. */
export async function pickVault(): Promise<FileSystemDirectoryHandle> {
  // @ts-expect-error - showDirectoryPicker isn't in every lib.dom.d.ts version yet
  return await window.showDirectoryPicker();
}

/** Recursively reads every .md file under the vault root. Skips dotfile
 * directories (.human-kernel/, .obsidian/, etc.) - those aren't vault content. */
export async function readAllMarkdownFiles(
  dirHandle: FileSystemDirectoryHandle,
  relativePath = ""
): Promise<VaultFile[]> {
  const files: VaultFile[] = [];
  // @ts-expect-error - FileSystemDirectoryHandle.entries() async iterator typing varies by TS lib version
  for await (const [name, handle] of dirHandle.entries()) {
    if (name.startsWith(".")) continue;
    const path = relativePath ? `${relativePath}/${name}` : name;
    if (handle.kind === "file" && name.endsWith(".md")) {
      const file = await handle.getFile();
      files.push({ path, text: await file.text() });
    } else if (handle.kind === "directory") {
      files.push(...(await readAllMarkdownFiles(handle, path)));
    }
  }
  return files;
}

// TODO (Post-MVD, EPIC-1.2 in docs/agile-backlog.md): live file watching.
// The File System Access API has NO native watch/subscribe primitive - this
// is a real platform constraint, not an oversight. V1 will need a polling
// strategy (re-read on an interval, or on window focus/visibilitychange)
// rather than true push updates. Do not assume this is a trivial follow-up.
