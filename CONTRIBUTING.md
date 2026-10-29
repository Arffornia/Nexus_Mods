# Contributing

## Setup
Node 22 (or any supported LTS ≥ 20) and npm.

```bash
npm ci
make check   # typecheck + offline unit tests + build
```

`make test-live` runs the network integration tests (real CurseForge/Modrinth/GitHub downloads).
They are not part of PR CI; a nightly workflow runs them.

## Conventions
- English everywhere (code, comments, docs, commits, issues).
- Branches: `fix/<slug>`, `feat/<slug>`, `security/<slug>`, `test/<slug>`, `ci/<slug>`, `docs/<slug>`, `chore/<slug>`.
- [Conventional Commits](https://www.conventionalcommits.org/): `fix(nexus): ...`, `feat(api): ...`.
- One pull request per issue, linked with `Closes #n`. Fill in the PR template.
- New behaviour comes with offline unit tests (`tests/unit`, HTTP mocked). Live tests go in `tests/live`.
- Keep the public API backward compatible: this package is consumed by the launcher and the config-updater.

See [AGENTS.md](AGENTS.md) for the repo map and gotchas.
