# Nexus mods

This package allows you to manage the download and update Minecraft mods and external files.

## Included APIs :

- CurseForge
- Modrinth
- Github Release

## Install : 

To include Nexus Mods in your project, you can install it using npm:
```bash
npm i @arffornia/nexus_mods
```

## Usage : 

First, you need to instantiate an instance of NexusMods :

```typescript
const nexusMods = new NexusMods(
    "Your Minecraft directory path ("./.minecraft")",
    callback?
    modDirName, // default: mods
);
```
- You can also specify an optional callback function using the [Callback interface](./src/utils/Callback.ts).

<br>

#### Load from Json file :

NexusMods lets you easily manage all your mods in a json file.
Who can look like that :
 
```json
{
    "mods": {
        "curseforge": [
            {
                "displayName": "Mekanism",
                "projectId": "268560",
                "fileId": "4776410"
            },
            {
                "displayName": "Ender IO",
                "projectId": "64578",
                "fileId": "5460093"
            }
        ],
        "modrinth": [
            {
                "displayName": "Applied Energistics 2",
                "versionId": "kF3whRqC"
            }
        ],
        "github": [
            {
                "displayName": "Arffornia Mod",
                "owner": "Arffornia",
                "repoName": "Arffornia_Mods",
                "groupId": "fr.thegostsniperfr.arffornia",
                "artifactId": "arffornia",
                "version": "1.0.0"
            }
        ]
    },
    "externalFilesIndexUrl": "https://raw.githubusercontent.com/Arffornia/Nexus_Mods/refs/heads/main/externalFiles/index.json"
}
```

then just call loadModsFromJson to load the mods in NexusMods :

```typescript
await nexusMods.loadModsFromJson(jsonModList);
```

You can also load the json file using an url :

```typescript
await nexusMods.loadModsFromJsonUrl(jsonUrlModList);
```

### Loading External Files

Nexus Mods can also manage **external files** using an index system, similar to how it handles mod files.  
This is useful, for example, when you want to update configuration files or other resources alongside your mods.

External files are listed inside an [`index.json`](./externalFiles/index.json), which contains metadata for each file (such as `path`, `hash`, etc.).

There are two ways to load an external file index:

- **From your mod list file**:  
  Add the URL of the external index by using the `externalFilesIndexUrl` field.

- **Programmatically**:  
  You can load the external files manually in your code using one of these methods:

```typescript
await nexusMods.loadExternalFiles(jsonIndexFile);
```
*(where `jsonIndexFile` is a parsed JSON object)*

or

```typescript
await nexusMods.loadExternalFilesFromJsonUrl(jsonIndexFileUrl);
```
*(where `jsonIndexFileUrl` is a URL pointing to a remote `index.json`)*

### Generating an External File Index

Nexus Mods provides a small utility to easily generate your [`index.json`](./externalFiles/index.json) file.

Use the following method:

```typescript
await generateIndex(storageDir, outputFile);
```

- `storageDir`: Absolute path to the storage directory.
- `outputFile`: the path where the generated [`index.json`](./externalFiles/index.json) will be saved.

This will scan all files under `storageDir`, calculate their metadata (such as paths and hashes), and output a ready-to-use index file.

[See an example](./generateIndex.ts)

<br>

#### Load from Curseforge API file :

You can load a mod directly into the code using the Curseforge api:

```typescript
// Example to get Ender IO mod.
const curseforgeAPI = new CurseforgeAPI();
const projectId = '64578';
const fileId = '5460093';

const modFile = await curseforgeAPI.getModFile(projectId, fileId);
nexusMods.addModFile(modFile);
```

<br>

#### Load from Modrinth API file :

You can load a mod directly into the code using the Modrinth api:

```typescript
// Example to get Arffornia mod.
const githubAPI = new GithubAPI();

const owner = 'Arffornia';
const repoName = 'Arffornia_Mods';
const groupId = 'fr.thegostsniperfr.arffornia';
const artifactId = 'arffornia';
const version = '1.0.0';

const modFile = await githubAPI.getModFile(owner, repoName, groupId, artifactId, version);
nexusMods.addModFile(modFile);
```

<br>

#### Load from Github Release Registry file :

You can update file from Github Registry:

```typescript
// Example to get Arffornia mod.
 const githubAPI = new GithubReleasesAPI();

const owner = 'Arffornia';
const repoName = 'Arffornia_Mods';
const tag = 'v1.0.0';
const assetName = "arffornia-1.0.0.jar";

const modFile = await githubAPI.getModFile(owner, repoName, tag, assetName);
nexusMods.addModFile(modFile);
```

<br>

#### Download / Update mods :
Once you have loaded the mods into a NexusMods instance, you can download/update them simply with :

```typescript 
const checkHash = true; // Compare files by hash. On false, it's like a forced download.
const deleteUnregisteredMods = true; // Delete unregistered mods from the mod folder.

await nexusMods.updateMods(checkHash, deleteUnregisteredMods);
```

<br>

### Advanced: Dynamic File Renaming with Environment Variables

Nexus Mods supports dynamic file renaming using environment variables. This is useful for cases where file names need to be configured externally, for instance, in a CI/CD environment or for different deployment targets.

This feature is controlled by the following environment variables:

-   `NM_REPLACE_ENV_VARIABLES`: A boolean (`true` or `false`) that enables or disables the feature. **Default: `false`**.
-   `NM_REPLACE_ENV_VARIABLE_PREFIX`: A string that defines the prefix for the environment variables to be replaced. **Default: `"NM_"`**.

When enabled, any file path provided to a `ModFile` constructor will be scanned for placeholders in the format `${PREFIX_...}`. If a matching environment variable is found, the placeholder is replaced with its value.

> Note: This renaming process is applied at the core ModFile level, meaning it works seamlessly for all mods and files, whether they are loaded from a JSON mod list or fetched directly from APIs (CurseForge, Modrinth, GitHub Releases).

#### Example

Suppose you have a configuration file that you want to rename based on the environment.

**1. Set your environment variables:**

```bash
export NM_REPLACE_ENV_VARIABLES=true
export NM_CONFIG_FILE_NAME="production_settings"
```

**2. Define the file path with a placeholder:**

In your mod list JSON or when creating a `ModFile` programmatically, use a placeholder for the part of the filename you want to replace.

For an external file, your `index.json` might look like this:

```json
{
  "path": "config/${NM_CONFIG_FILE_NAME}.properties",
  "hash": "...",
  "override": true
}
```

**3. Result:**

When Nexus Mods processes this file, it will resolve the path to `config/production_settings.properties` before downloading or updating it. If the `NM_CONFIG_FILE_NAME` environment variable was not set, the path would remain `config/${NM_CONFIG_FILE_NAME}.properties`.

<br>


### Callbacks (Progress & Steps)

Nexus Mods supports an optional **callback** system to track download and update progress.

You can provide a `Callback` object when initializing `NexusMods`.  
The callback allows you to monitor different steps and track download progress.

You can take a look of the step enum & Callback interface [here](./src/utils/Callback.ts).

## Tests

Tests are managed by **Jest** 

You can run the tests using :

```bash
npm test
```

## License

This project is licensed under the MIT licence. You can consult the complete text of the licence in the file [LICENSE](LICENSE).
