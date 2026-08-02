# Human Kernel

[![CI](https://github.com/forageopen/human-kernel/actions/workflows/ci.yml/badge.svg)](https://github.com/forageopen/human-kernel/actions/workflows/ci.yml)

Browser-native, local-first knowledge environment that compiles a person's own notes into an evidence-linked model of their behavioral patterns — visualized as a dashboard, not asserted as a personality score. No install, no account, no server-side storage of personal data.

Reference implementation of Forage DeepMind's Digital Human Modeling thesis. Built for a courseware context first (Forage's Digital Human Modeling module), productization deferred until validated ([ADR-0004](docs/adr/0004-product-positioning.md)).

## Status

MVD (Minimum Viable Demonstration) in active development. Planning and specification phase is complete and Approved (Founder). `evidence-parser` and `compiler` are implemented and tested (CI badge above); `vault-reader` and `store` are implemented but not yet wired together; `dashboard` is not started. See [`docs/agile-backlog.md`](docs/agile-backlog.md) for the MVD critical path (9 stories, 37 points) and current build order.

**Start here:** [`docs/INDEX.md`](docs/INDEX.md) — full map of every document in this repo, what it's for, and its current status.

## Core Principles

1. **Extract or compile, never invent.** No claim renders without a linked `Evidence` object.
2. **Every claim needs a witness.** `confidence` is required, not optional.
3. **Open or not at all.** MIT-licensed, no closed telemetry, no server dependency for core function.

Full detail: [`docs/project-brief-v2.md`](docs/project-brief-v2.md) §10.

## Architecture

```
Local Files (.md vault)
   → vault-reader
   → evidence-parser
   → compiler (Parameter Compiler / Pattern Engine / Relationship Compiler)
   → store (.human-kernel/index.json)
   → dashboard
```

Module boundary rule: only `vault-reader` touches the file system, only `store` touches the index file, `dashboard` touches neither directly. Full spec: [`docs/specification-v0.1.md`](docs/specification-v0.1.md).

## Repo Layout

- `docs/` — brief, spec, ADRs, process docs, planning docs. Read `docs/INDEX.md` first.
- `schema/` — JSON Schema (2020-12) for `Evidence`, `Parameter`, `Relationship`, and the root index file.
- `wireframes/` — clickable HTML wireframe covering the data states not shown in the original interaction-model prototype.
- `src/` — application code, split along the module boundaries above. `evidence-parser` and `compiler` are real and tested; `vault-reader` and `store` are implemented but unwired; `dashboard` is a README, not code yet. See `docs/agile-backlog.md` for the exact build order.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) — every PR is checked against the three principles above, not just style.

## License

MIT — see [`LICENSE`](LICENSE).
