// Canonical data model - mirrors /schema/*.schema.json exactly.
// Source of truth for shape is docs/specification-v0.1.md §3.
// If you change a field here, update the matching .schema.json AND bump
// schemaVersion (Spec §6) - do not let these drift silently.

export type Domain =
  | "Reality"
  | "Human"
  | "Civilization"
  | "Strategy"
  | "Adaptation"
  | "Legacy";

export interface Evidence {
  id: string; // uuid
  sourceFile: string; // relative path within vault
  sourceRef?: string; // block reference - heading path + callout index
  timestamp: string; // ISO 8601 - capture time, not event time
  context: string;
  observation: string;
  confidence: number; // 0.0-1.0
}

export interface Parameter {
  id: string;
  name: string;
  domain: Domain;
  evidenceIds: string[]; // MUST be non-empty - see schema/parameter.schema.json minItems:1
  pattern?: string; // human-authored only, no AI in v1 (ADR-0002)
  confidence: number; // DERIVED - see compiler/confidence.ts, never set directly
  status: "draft" | "verified" | "disputed";
}

export type RelationshipType = "causal" | "correlated" | "contradicts" | "supports";

export interface Relationship {
  id: string;
  sourceParameterId: string;
  targetParameterId: string;
  relationshipType: RelationshipType;
  confidence: number;
  verification: "unverified" | "user-confirmed" | "contradicted";
}

export interface HumanKernelIndex {
  schemaVersion: "0.1";
  generatedAt: string;
  evidence: Evidence[];
  parameters: Parameter[];
  relationships: Relationship[];
}
