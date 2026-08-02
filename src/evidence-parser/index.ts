// Parses Obsidian-style callout blocks into raw Evidence/Relationship candidates.
// Spec: docs/specification-v0.1.md §4.
//
// Contract (Tension C boundary rule, README): this module ONLY parses text
// already read from disk by vault-reader. It never touches the file system.

import type { Domain, RelationshipType } from "../types.js";

const VALID_DOMAINS: readonly Domain[] = [
  "Reality", "Human", "Civilization", "Strategy", "Adaptation", "Legacy",
];
const VALID_RELATIONSHIP_TYPES: readonly RelationshipType[] = [
  "causal", "correlated", "contradicts", "supports",
];

export interface ParseWarning {
  sourceFile: string;
  sourceRef: string;
  message: string;
}

export interface RawEvidenceBlock {
  sourceFile: string;
  sourceRef: string;
  domain: Domain;
  parameterName: string;
  confidence: number;
  pattern?: string;
  status?: "draft" | "verified" | "disputed";
  observation: string;
  date?: string; // ISO 8601 - optional override for Evidence.timestamp (see compiler/index.ts)
}

export interface RawRelationshipBlock {
  sourceFile: string;
  sourceRef: string;
  fromParameterName: string;
  toParameterName: string;
  relationshipType: RelationshipType;
  confidence: number;
  note: string;
}

export interface ParseResult {
  evidence: RawEvidenceBlock[];
  relationships: RawRelationshipBlock[];
  warnings: ParseWarning[];
}

/** Splits `key:value key2:"quoted value" key3:0.8` into a map. Quoted values may contain spaces. */
function parseAttributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /(\w+):(?:"([^"]*)"|(\S+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const key = m[1];
    const value = m[2] !== undefined ? m[2] : m[3];
    if (key !== undefined && value !== undefined) {
      attrs[key] = value;
    }
  }
  return attrs;
}

function normalizeParameterName(name: string): string {
  return name.trim().toLowerCase();
}

/** Parses one markdown file's text into raw Evidence/Relationship candidates + warnings.
 * Rejects invalid blocks outright (bad domain, out-of-range confidence) rather than
 * guessing or clamping - this IS "never invent" (Brief v2 §10) enforced at parse time. */
export function parseVaultFile(sourceFile: string, text: string): ParseResult {
  const evidence: RawEvidenceBlock[] = [];
  const relationships: RawRelationshipBlock[] = [];
  const warnings: ParseWarning[] = [];

  const lines = text.split(/\r?\n/);
  let calloutIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue; // unreachable given the loop bound; satisfies strict indexing

    const titleMatch = line.match(/^>\s*\[!(evidence|relationship)\]\s*(.*)$/i);
    if (!titleMatch) continue;

    const kind = titleMatch[1];
    if (kind !== "evidence" && kind !== "relationship") continue; // regex guarantees this; keeps TS honest and narrows the type
    const attrs = parseAttributes(titleMatch[2] ?? "");
    calloutIndex += 1;
    const sourceRef = `callout#${calloutIndex}`;

    // Collect body: subsequent lines that continue the blockquote ("> ...").
    const bodyLines: string[] = [];
    let j = i + 1;
    while (j < lines.length) {
      const bodyLine = lines[j];
      if (bodyLine === undefined || !/^>/.test(bodyLine)) break;
      bodyLines.push(bodyLine.replace(/^>\s?/, ""));
      j += 1;
    }
    const body = bodyLines.join("\n").trim();
    i = j - 1;

    if (kind === "evidence") {
      const domainRaw = attrs.domain ?? "";
      const domain = VALID_DOMAINS.find((d) => d.toLowerCase() === domainRaw.toLowerCase());
      if (!domain) {
        warnings.push({
          sourceFile, sourceRef,
          message: `Unrecognized domain "${domainRaw}" - must be one of ${VALID_DOMAINS.join(", ")}. Block rejected, not guessed.`,
        });
        continue;
      }

      const confidence = Number(attrs.confidence);
      if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
        warnings.push({
          sourceFile, sourceRef,
          message: `confidence "${attrs.confidence ?? ""}" is not a number in [0.0, 1.0]. Rejected, not clamped (Spec §4).`,
        });
        continue;
      }

      if (!attrs.parameter) {
        warnings.push({ sourceFile, sourceRef, message: `Missing required "parameter" key.` });
        continue;
      }
      if (!body) {
        warnings.push({ sourceFile, sourceRef, message: `Empty observation body - schema requires minLength 1.` });
        continue;
      }

      // Optional explicit date (Post-MVD TODO closed 2026-08-02): lets a vault
      // note declare when the observation actually happened/was last true,
      // e.g. date:"2025-06-22" - the real file mtime is a legitimate proxy for
      // this. Absent -> compiler falls back to pure capture-time, unchanged
      // from prior behavior. Invalid -> rejected outright, same "never guess"
      // rule as domain/confidence above, not silently dropped or clamped.
      let date: string | undefined;
      if (attrs.date !== undefined) {
        const parsed = new Date(attrs.date);
        if (Number.isNaN(parsed.getTime())) {
          warnings.push({
            sourceFile, sourceRef,
            message: `date "${attrs.date}" is not a valid date. Block rejected, not guessed.`,
          });
          continue;
        }
        date = parsed.toISOString();
      }

      evidence.push({
        sourceFile,
        sourceRef,
        domain,
        parameterName: normalizeParameterName(attrs.parameter),
        confidence,
        pattern: attrs.pattern,
        status: attrs.status as RawEvidenceBlock["status"],
        observation: body,
        date,
      });
    } else {
      const relType = VALID_RELATIONSHIP_TYPES.find((t) => t === (attrs.type ?? "").toLowerCase());
      if (!relType) {
        warnings.push({
          sourceFile, sourceRef,
          message: `Unrecognized relationship type "${attrs.type ?? ""}" - must be one of ${VALID_RELATIONSHIP_TYPES.join(", ")}.`,
        });
        continue;
      }
      const confidence = Number(attrs.confidence);
      if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
        warnings.push({ sourceFile, sourceRef, message: `confidence "${attrs.confidence ?? ""}" is not a number in [0.0, 1.0]. Rejected.` });
        continue;
      }
      if (!attrs.from || !attrs.to) {
        warnings.push({ sourceFile, sourceRef, message: `Relationship block missing "from" or "to".` });
        continue;
      }

      relationships.push({
        sourceFile,
        sourceRef,
        fromParameterName: normalizeParameterName(attrs.from),
        toParameterName: normalizeParameterName(attrs.to),
        relationshipType: relType,
        confidence,
        note: body,
      });
    }
  }

  return { evidence, relationships, warnings };
}
