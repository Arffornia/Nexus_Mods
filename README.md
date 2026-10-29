# Nexus Mods

`@arffornia/nexus_mods` downloads and keeps up to date Minecraft mods and extra files (configs,
scripts, resources) from **CurseForge**, **Modrinth**, **GitHub Releases** and an external file index.

In the Arffornia ecosystem it is used by the Electron launcher (players' game directory) and by the
`config-updater` init container from [Arffornia_Provisioning](https://github.com/Arffornia/Arffornia_Provisioning)
(server and proxy `/data`). Architecture docs (coming soon): https://arffornia.github.io/docs/

## Requirements
Node.js 20+ (CI uses 22). Network access to the mod APIs at runtime.

## Install
```bash
npm i @arffornia/nexus_mods
```

## Usage

```typescript
import { NexusMods } from "@arffornia/nexus_mods";

const nexusMods = new NexusMods(
    "./.minecraft",   // game directory
    callback,         // optional, see Callback below
    "mods",           // mod directory name, relative to the game directory (default: "mods")
);

await nexusMods.loadModsFromJsonUrl("https://example.com/modList.json");
await nexusMods.loadExternalFilesFromJsonUrl("https://example.com/config/server/"); // reads <url>/index.json

const checkHash = true;              // compare existing files by hash; false = only download missing files
const deleteUnregisteredMods = true; // delete files in mods/ that are not in the list
await nexusMods.updateMods(checkHash, deleteUnregisteredMods);
```

### Mod list format
See [modListExample.json](./modListExample.json).

```json
{
    "mods": {
        "curseforge": [
            { "displayName": "Mekanism", "projectId": "268560", "fileId": "4776410" }
        ],
        "modrinth": [
            { "displayName": "Applied Energistics 2", "versionId": "kF3whRqC" }
        ],
        "github-releases": [
            { "displayName": "Arffornia Mod", "owner": "Arffornia", "repoName": "Arffornia_Mods",
              "tag": "latest", "assetName": "arffornia.jar" }
        ]
    },
    "externalFilesIndexUrl": "https://raw.githubusercontent.com/Arffornia/Nexus_Mods/refs/heads/main/externalFiles/"
}
```

- `loadModsFromJson(jsonString)` parses a list already in memory; `loadModsFromJsonUrl(url)` fetches it.
- `tag: "latest"` resolves the latest GitHub release. GitHub assets are hash-checked with the release
  `sha256` digest when GitHub provides one, otherwise they are re-downloaded on every update.

### External files
External files are listed in an [`index.json`](./externalFiles/index.json) (`path`, `hash` (SHA1), `override`)
and served from `<baseUrl>/storage/<path>`.

- From the mod list: set `externalFilesIndexUrl` (a base URL ending with `/`).
- In code: `await nexusMods.loadExternalFilesFromJsonUrl(baseUrl)` or
  `await nexusMods.loadExternalFiles(baseUrl, indexJsonString)`.

Generate an index from a storage directory ([example](./generateIndex.ts)):

```typescript
import { generateIndex } from "@arffornia/nexus_mods";
await generateIndex(storageDir, outputIndexFile); // absolute paths
```

### Adding single files from an API

```typescript
// CurseForge (resolved through https://api.curse.tools/v1/cf)
const cf = new CurseforgeAPI();
nexusMods.addModFile(await cf.getModFile("64578", "5460093"));

// Modrinth
const mr = new ModrinthAPI();
nexusMods.addModFile(await mr.getModFile("kF3whRqC"));

// GitHub Releases
const gh = new GithubReleasesAPI();
nexusMods.addModFile(await gh.getModFile("Arffornia", "Arffornia_Mods", "v1.0.0", "arffornia-1.0.0.jar"));
```

### Callbacks
An optional [`Callback`](./src/utils/Callback.ts) receives `onStep(step)` (`FETCHING`, `DONE`) and
`onProgress(current, total, fileName)` during `updateMods`.

## Configuration (environment variables)

| Variable | Default | Effect |
|---|---|---|
| `NM_REPLACE_ENV_VARIABLES` | `false` | Replace `${<PREFIX>...}` placeholders in file paths with env values |
| `NM_REPLACE_ENV_VARIABLE_PREFIX` | `NM_` | Prefix of placeholders that may be replaced |

Example: with `NM_REPLACE_ENV_VARIABLES=true` and `NM_SERVER_ID=arcane`, an index entry
`config/bluemap/maps/${NM_SERVER_ID}_world.conf` is written as `config/bluemap/maps/arcane_world.conf`.
Unknown variables are left as-is. Replacement happens in `ModFile`, so it applies to every source.

## Development

```bash
npm ci
make check       # typecheck + offline unit tests + build (what CI runs)
make test        # offline unit tests (tests/unit)
make test-live   # live-network tests (tests/live), also run nightly by .github/workflows/live-tests.yml
make build       # dist/
```

## Release process
1. Bump `version` in `package.json` (semver; this package is consumed by the launcher and the config-updater).
2. Merge to `main`, then from a clean checkout: `npm run deploy` (build + `npm publish --access public`).
3. Bump the dependency in consumers (Arffornia_Provisioning, Arffornia_Launcher).

## License
MIT, see [LICENSE](LICENSE).
