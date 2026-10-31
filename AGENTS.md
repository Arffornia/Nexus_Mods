# AGENTS.md — Nexus_Mods

## Purpose
`@arffornia/nexus_mods` (npm) is the owner's mod and file sync library. It resolves mod metadata
(file name, hash, download URL) from CurseForge, Modrinth and GitHub Releases, downloads missing or
changed files, deletes unregistered jars, and syncs extra files listed in an `index.json`.
Consumers: `Arffornia_Launcher_V.5.2/src/main/minecraftManager.js` (players' PCs) and
`Arffornia_Provisioning/src/configUpdater.ts` (server/proxy init container). A bug here reaches every
player and server, so be conservative.

## Repo map
- `src/NexusMods.ts` — main class: load mod lists, `updateMods()`, delete unregistered files.
- `src/ModFile.ts` — one target file (path, hash, hash type, URL) and its `update()`.
- `src/api/` — `CurseforgeAPI` (via `api.curse.tools`), `ModrinthAPI`, `GithubReleasesAPI`.
- `src/utils/fileUtils.ts` — hashing, download, directory helpers.
- `src/utils/HttpUtils.ts` — JSON fetch, `USER_AGENT`.
- `src/utils/envUtils.ts` — `${NM_*}` path placeholder replacement.
- `src/GenerateExternalFiles.ts` — `generateIndex(storageDir, indexFile)`.
- `src/index.ts` — public exports (keep them stable).
- `tests/unit/` — offline unit tests (default `npm test`, run on PRs).
- `tests/live/` — live-network tests (`npm run test:live`, nightly workflow).
- `externalFiles/` — sample storage + index used by live tests; `generateExtIndex.yml` regenerates it on `main`.

## Commands
```bash
npm ci
make check       # typecheck + unit tests + build (CI)
make test        # unit tests only
make test-live   # live tests (needs internet; may fail on third-party outages)
make build       # tsc + tsc-alias -> dist/
```

## Conventions
- TypeScript, CommonJS output, `@src/*` path alias (resolved by `tsc-alias` at build and by Jest's
  `moduleNameMapper` in tests).
- Conventional Commits, one PR per issue, `Closes #n`.
- Unit tests mock HTTP; never hit the network from `tests/unit`.

## Hard rules
- English for code, comments, docs, commits, issues.
- This is the owner's library: improve it, never replace it with a third-party package.
- Never commit secrets or API keys. Never merge, tag, publish or push to `main`.
- Keep the public API backward compatible (consumers pin exact versions). New behaviour goes behind
  options or new return fields; document it in README and note any version bump in the PR.

## Testing strategy
- Unit: API adapters with mocked HTTP; `updateMods` failure semantics; file safety (paths, atomic writes).
- Live: real downloads, run nightly, not a merge gate.

## Gotchas (from the 2026-10 audit)
- Historically, per-mod lookup/download errors were logged and swallowed, and
  `deleteUnregisteredMods=true` then deleted the jars of mods whose lookup failed.
- Metadata is resolved sequentially (~330 calls for the server pack) without timeout/retry.
- `axios` must be a runtime dependency (it is imported by `src/`).
- `index.json` `override` is generated but not read by the consumer.
- GitHub assets without a digest (`HashTypes.NONE`) are re-downloaded on every update.
- axios < 1.16.1 mishandles HTTPS proxies (405) in sandboxed environments.

## Related repos
- Arffornia/Arffornia_Provisioning — modpack config + config-updater image (main consumer).
- Arffornia/Arffornia_Launcher_V.5.2 — Electron launcher (consumer).
- TheGostsniperfr/infra — Kubernetes manifests running the config-updater init container.
