// Parameter Compiler + Relationship Compiler. Spec: docs/specification-v0.1.md §5.
// Contract (Tension C boundary rule): pure functions over already-parsed data.
// This module never touches the file system or the index file - see store/.

import type { Evidence, Parameter, Relationship } from "../types.js";
import type { RawEvidenceBlock, RawRelationshipBlock, ParseWarning } from "../evidence-parser/index.js";

export interface CompileResult {
  evidence: Evidence[];
  parameters: Parameter[];
  relationships: Relationship[];
  warnings: ParseWarning[];
}

/** Confidence aggregation rule (Spec §5): arithmetic mean, recalculated every call.
 * Never cached, never manually overridden - this IS "the kernel interprets, it does
 * not own" (Brief v2 §7) expressed as code. */
function meanConfidence(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function compile(
  rawEvidence: RawEvidenceBlock[],
  rawRelationships: RawRelationshipBlock[]
): CompileResult {
  const warnings: ParseWarning[] = [];

  // Step 1 (Spec §5): one Evidence object per raw block.
  const evidence: Evidence[] = rawEvidence.map((raw) => ({
    id: crypto.randomUUID(),
    sourceFile: raw.sourceFile,
    sourceRef: raw.sourceRef,
    // TODO (Post-MVD): use the vault file's actual mtime, and a real heading-path
    // for `context` once vault-reader exposes both - not implemented yet, so both
    // currently fall back to values available at parse time. Flagged, not hidden.
    timestamp: new Date().toISOString(),
    context: raw.sourceFile,
    observation: raw.observation,
    confidence: raw.confidence,
  }));

  // Step 2 (Spec §5): group by (domain, normalized parameter name).
  const groups = new Map<string, { raw: RawEvidenceBlock; evidenceId: string }[]>();
  rawEvidence.forEach((raw, idx) => {
    const key = `${raw.domain}::${raw.parameterName}`;
    const list = groups.get(key) ?? [];
    const ev = evidence[idx];
    if (ev === undefined) return; // unreachable - evidence is built 1:1 from rawEvidence above
    list.push({ raw, evidenceId: ev.id });
    groups.set(key, list);
  });

  const parameters: Parameter[] = [];
  const parameterIdByName = new Map<string, string>(); // normalized name -> Parameter.id

  for (const [key, members] of groups) {
    const [domain, name] = key.split("::") as [Parameter["domain"], string];
    const id = crypto.randomUUID();
    parameterIdByName.set(name, id);

    const confidences = members.map((m) => m.raw.confidence);
    const patterns = new Set(members.map((m) => m.raw.pattern).filter((p): p is string => Boolean(p)));
    const statuses = members.map((m) => m.raw.status ?? "draft");

    // Step 3 (Spec §5) status derivation:
    let status: Parameter["status"] = "draft";
    if (statuses.some((s) => s === "disputed")) status = "disputed";
    else if (statuses.every((s) => s === "verified")) status = "verified";

    parameters.push({
      id,
      name,
      domain,
      evidenceIds: members.map((m) => m.evidenceId), // schema requires minItems:1 - always true here, since a Parameter can't exist without at least one member
      pattern: patterns.size === 1 ? [...patterns][0] : undefined,
      confidence: meanConfidence(confidences),
      status,
    });

    if (patterns.size > 1) {
      const first = members[0];
      if (first !== undefined) {
        warnings.push({
          sourceFile: first.raw.sourceFile,
          sourceRef: first.raw.sourceRef,
          message: `Parameter "${name}" has conflicting pattern labels (${[...patterns].join(", ")}) - left unset, not guessed (Spec §5).`,
        });
      }
    }
  }

  // Relationship Compiler (Spec §5): resolve from/to against compiled Parameter names.
  const relationships: Relationship[] = [];
  for (const raw of rawRelationships) {
    const sourceId = parameterIdByName.get(raw.fromParameterName);
    const targetId = parameterIdByName.get(raw.toParameterName);
    if (!sourceId || !targetId) {
      warnings.push({
        sourceFile: raw.sourceFile,
        sourceRef: raw.sourceRef,
        message: `Unresolved relationship reference: "${raw.fromParameterName}" -> "${raw.toParameterName}" has no matching Parameter on at least one side. Relationship NOT created (never invent).`,
      });
      continue;
    }
    relationships.push({
      id: crypto.randomUUID(),
      sourceParameterId: sourceId,
      targetParameterId: targetId,
      relationshipType: raw.relationshipType,
      confidence: raw.confidence,
      verification: "unverified", // compiler never sets "user-confirmed" - ADR-0005
    });
  }

  return { evidence, parameters, relationships, warnings };
}
