import { ModFile } from "@src/ModFile";
import { createFolderIfNotExist, listFilesInDirectory, deleteFileIfExists } from "./utils/fileUtils";
import { CurseforgeAPI } from "./api/CurseforgeAPI";
import { ModrinthAPI } from "./api/ModrinthAPI";

import { Callback, Step } from "./utils/Callback";
import { LoadJsonFromUrl as LoadJsonFromUrl } from "./utils/HttpUtils";
import { HashTypes } from "./hash/HashTypes";
import path from "path";

/**
 * Main class of the NexuMods library
 *
 * @export
 * @class NexusMods
 */
export class NexusMods {
    private gameDir: string;
    private modDir: string;
    private modFiles: ModFile[] = [];
    private callback: Callback | null;

    /**
     * Creates an instance of NexusMods.
     * 
     * @param {string} gameDirPath
     * @param {Callback} [callback]
     * @param {string} [modDirName="mods"] - The directory where mods will be stored, relative to the game directory.
     * @memberof NexusMods
     */
    constructor(gameDirPath: string, callback?: Callback, modDirName: string = "mods") {
        this.gameDir = gameDirPath;
        this.modDir = path.join(gameDirPath, modDirName);
        this.callback = callback;
    }

    public addModFile(modFile: ModFile): void {
        this.modFiles.push(modFile);
    }

    public async updateMods(
        checkHash: boolean = false, 
        deleteUnregisteredMods: boolean = false,
    ): Promise<void> {
        try {
            // Create folder if not exist
            if (createFolderIfNotExist(this.modDir)) {
                console.log(`Mods directory ${this.modDir} created successfully.`);
            }
            
            this.callback?.onStep(Step.FETCHING)
    
            // List all mods present in the mods folder
            const presentMods = listFilesInDirectory(this.modDir, false);
            // console.log(`List of detected files: ${presentMods}`);
    
            const totalMods = this.modFiles.length;

            // Update all mods
            for (let i = 0; i < totalMods; i++) {
                const modFile = this.modFiles[i];
                try {
                    // Trigger the progress callback
                    this.callback?.onProgress(i + 1, totalMods, modFile.getFileName());
                    

                    await modFile.update(this.gameDir, checkHash);
                    
                    // Remove current mod from the list
                    const index = presentMods.indexOf(modFile.getFileName());
    
                    // If the mod is found in the list, remove it
                    if (index !== -1) {
                        presentMods.splice(index, 1);
                    }
                } catch (error) {
                    console.error(`Error updating mod file ${modFile.getFileName}:`, error);
                }
            }
    
            if (deleteUnregisteredMods) {
                // Delete unregistered mods
                presentMods.forEach(filePath => {
                    const modPath = path.join(this.modDir, filePath);
                    console.log(`Unregistered file: ${modPath}`);
                    deleteFileIfExists(modPath);
                });
            }

            this.callback?.onStep(Step.DONE);
        } catch (error) {
            console.error('Error during mods update:', error);
        }
    }

    /**
    * This method will parse the JSON string (see modListExample.json) and load mods in a NexusMods instance.
    *
    * @param {string} jsonData - A JSON string representing the mods to be managed.
    * @returns {Promise<void>} A promise that resolves when all mod files have been successfully loaded and added.
    * @throws {Error} If the JSON parsing fails or if there is an error during the mod file retrieval process.
    */
    public async loadModsFromJson(jsonData: string): Promise<void> {
        try {
            const parsedJson = JSON.parse(jsonData);

            const curseforgeMods = parsedJson.mods.curseforge || [];
            const modrinthMods = parsedJson.mods.modrinth || [];
            const externalFilesUrl = parsedJson.externalFilesIndexUrl || null;

            const curseforgeApi = new CurseforgeAPI();
            const modrinthApi = new ModrinthAPI();

            // Process CurseForge mods
            for (const mod of curseforgeMods) {
                try {
                    const modFile = await curseforgeApi.getModFile(mod.projectId, mod.fileId);
                    this.addModFile(modFile);
                } catch (error) {
                    console.error(`Failed to load CurseForge mod ${mod.displayName}:`, error);
                }
            }

            // Process Modrinth mods
            for (const mod of modrinthMods) {
                try {
                    const modFile = await modrinthApi.getModFile(mod.versionId);
                    this.addModFile(modFile);
                } catch (error) {
                    console.error(`Failed to load Modrinth mod ${mod.displayName}:`, error);
                }
            }

            // Process External Files
            if (externalFilesUrl) {
                await this.loadExternalFilesFromJsonUrl(externalFilesUrl);
            }

            console.log("Mods loaded from JSON successfully.");
        } catch (error) {
            console.error("Failed to load mods from JSON:", error);
        }
    }

    public async loadExternalFiles(baseUrl: string, jsonData: any): Promise<void> {
        jsonData = JSON.parse(jsonData);
        const externalFiles = jsonData.files || [];

        for (const file of externalFiles) {
            this.addModFile(new ModFile(
                file.path, 
                file.hash, 
                HashTypes.SHA1, 
                new URL(file.path, new URL("storage/", baseUrl).href).href
            ));
        }
    }

    /**
     * Load mods from a modlist.json url, using `loadModsFromJson`.
     *
     * @param {string} url - The URL from which to fetch the JSON file containing the mod information.
     * @returns {Promise<void>} A promise that resolves when all mod files have been successfully loaded and added.
     * 
     * @memberof NexusMods
     */
    public async loadModsFromJsonUrl(url: string): Promise<void> {
        await this.loadModsFromJson(await LoadJsonFromUrl(url));
    }

    /**
     * Load external files from the reposotory url, using `loadExtFilesFromJson`.
     *
     * @param {string} url Repo url (listing external files metainfo)
     * @return {*}  {Promise<void>}

     * @memberof NexusMods
     */
    public async loadExternalFilesFromJsonUrl(baseUrl: string): Promise<void> {
        if (!baseUrl.endsWith("/")) {
            baseUrl += "/";
        }

        const indexUrl = new URL("index.json", baseUrl).href;
        this.loadExternalFiles(baseUrl, await LoadJsonFromUrl(indexUrl));
    }
}