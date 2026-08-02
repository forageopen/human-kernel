# Human Kernel

[![CI](https://github.com/forageopen/human-kernel/actions/workflows/ci.yml/badge.svg)](https://github.com/forageopen/human-kernel/actions/workflows/ci.yml)

Browser-native, local-first knowledge environment that compiles a person's own notes into an evidence-linked model of their behavioral patterns — visualized as a dashboard, not asserted as a personality score. No install, no account, no server-side storage of personal data.

Reference implementation of Forage DeepMind's Digital Human Modeling thesis. Built for a courseware context first (Forage's Digital Human Modeling module), productization deferred until validated ([ADR-0004](docs/adr/0004-product-positioning.md)).

## Status

MVD (Minimum Viable Demonstration) in active development. Planning and specification phase is complete and Approved (Founder). All five modules — `vault-reader`, `evidence-parser`, `compiler`, `store`, `dashboard` — are implemented and wired end-to-end (CI badge above). Covered by unit tests with fakes/jsdom, not yet by a manual browser click-through with a real vault — see [`src/dashboard/README.md`](src/dashboard/README.md) for the precise "what's real / what isn't yet" line. See [`docs/agile-backlog.md`](docs/agile-backlog.md) for the MVD critical path (9 stories, 37 points) and current build order.

**Live build:** deploys to GitHub Pages on every push to `main` via [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) → `https://forageopen.github.io/human-kernel/`. First deploy needs one manual, owner-only step: repo **Settings → Pages → Build and deployment → Source → GitHub Actions**. Nobody but the repo owner can flip that, so treat the link as "will go live once that's set," not "already live."

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
- `src/` — application code, split along the module boundaries above. All five modules are implemented and wired end-to-end; `dashboard` is real code now, not just a README (though `src/dashboard/README.md` still documents the honest gaps). See `docs/agile-backlog.md` for the exact build order.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) — every PR is checked against the three principles above, not just style.

## Credits

- **Adam Rosman** — Founder, Forage DeepMind. Product direction and every Founder Override decision recorded in this repo (see [`docs/INDEX.md`](docs/INDEX.md)).
- **Claude (Anthropic)** — AI pair-programmer. Drafted the docs, schema, and everything currently in `src/` under the Founder's direction. Flagging the honest mismatch rather than papering over it: GitHub's "Contributors" graph is commit-authorship-based and tied to a real account, which Claude doesn't have — so this line is the accurate record, not that graph. Commits authored with Claude's involvement carry a `Co-Authored-By: Claude <noreply@anthropic.com>` trailer starting from this one.

## License

MIT — see [`LICENSE`](LICENSE).
