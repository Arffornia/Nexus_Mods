# Nexus mods

This package allows you to manage the download and update Minecraft mods.

## Included APIs

- CurseForge
- Modrinth

## Usage : 

First, you need to instantiate an instance of NexusMods :

```typescript
const nexusMods = new NexusMods("Your Minecraft directory path ("./.minecraft")");
```

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
        ]
    }
}
```

then just call loadModsFromJson to load the mods in NexusMods :

```typescript
await nexusMods.loadModsFromJson(jsonModList);
```

You can also load the json file using an url (Coming soon) :

```typescript
await nexusMods.loadModsFromJsonUrl(jsonUrlModList);
```

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
// Example to get Ender IO mod.
const modrinthAPI = new ModrinthAPI();
const versionId = 'kF3whRqC';

const modFile = await modrinthAPI.getModFile(versionId);
nexusMods.addModFile(modFile);
```

<br>

#### Download / Update mods :
Once you have loaded the mods into a NexusMods instance, you can download/update them simply with :

```typescript 
const checkHash = true; // Compare files by hash. On false, it's like a forced download.
const deleteUnauthorizedMods = true; // Delete unauthorized mods from the mod folder.

await nexusMods.updateMods(true, true);
```

<br>

#### Progress details callback :
Coming soon

## Tests

Tests are managed by **Jest** 

You can run the tests using :

```bash
npm test
```

## License

This project is licensed under the MIT licence. You can consult the complete text of the licence in the file [LICENSE](LICENSE).



