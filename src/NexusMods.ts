import { ModFile } from "@src/ModFile";
import { createFolderIfNotExist, listFilesInDirectory, deleteFileIfExists } from "./utils/fileUtils";
import { CurseforgeAPI } from "./api/CurseforgeAPI";
import { ModrinthAPI } from "./api/ModrinthAPI";

import path from "path";
import axios from 'axios';

export class NexusMods {
    private modDir: string;
    private modFiles: ModFile[] = [];

    constructor(modDir: string) {
        this.modDir = modDir;
    }

    public addModFile(modFile: ModFile): void {
        this.modFiles.push(modFile);
    }

    public async updateMods(
        checkHash: boolean = false, 
        deleteUnregisteredMods: boolean = false,
        onProgress?: (currentModIndex: number, totalMods: number, currentModDisplayName: string) => void
    ): Promise<void> {
        try {
            // Create folder if not exist
            if (createFolderIfNotExist(this.modDir)) {
                console.log(`Mods directory ${this.modDir} created successfully.`);
            }
    
            // List all mods present in the mods folder
            const presentMods = listFilesInDirectory(this.modDir, false);
            console.log(`List of detected files: ${presentMods}`);
    
            const totalMods = this.modFiles.length;

            // Update all mods
            for (let i = 0; i < totalMods; i++) {
                const modFile = this.modFiles[i];
                try {
                    // Trigger the progress callback
                    if (onProgress) {
                        onProgress(i + 1, totalMods, modFile.getFileName());
                    }
    
                    await modFile.update(this.modDir, checkHash);
    
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
                presentMods.forEach(modName => {
                    console.log(`unregistered mod: ${modName}`);
                    deleteFileIfExists(path.join(this.modDir, modName));
                });
            }
        } catch (error) {
            console.error('Error during mods update:', error);
        }
    }

    /**
    * This method will parse the JSON string (see modListExample.json) and load mods in a NexusMods instance.
    *
    * @param {string} jsonString - A JSON string representing the mods to be managed.
    * @returns {Promise<void>} A promise that resolves when all mod files have been successfully loaded and added.
    * @throws {Error} If the JSON parsing fails or if there is an error during the mod file retrieval process.
    */
    public async loadModsFromJson(jsonString: string): Promise<void> {
        try {
            const parsedJson = JSON.parse(jsonString);

            const curseforgeMods = parsedJson.mods.curseforge || [];
            const modrinthMods = parsedJson.mods.modrinth || [];

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

            console.log("Mods loaded from JSON successfully.");
        } catch (error) {
            console.error("Failed to load mods from JSON:", error);
        }
    }

    /**
     * This method fetches a JSON file from the provided URL and load mods in a NexusMods instance, using `loadModsFromJson`.
     *
     * @param {string} url - The URL from which to fetch the JSON file containing the mod information.
     * @returns {Promise<void>} A promise that resolves when all mod files have been successfully loaded and added.
     * @throws {Error} If the HTTP request fails, if the JSON format is invalid, or if there is an error during the mod file retrieval process.
     */
    public async loadModsFromJsonUrl(url: string): Promise<void> {
        try {
            const response = await axios.get(url);
            const jsonData = response.data;

            if (typeof jsonData === 'string') {
                await this.loadModsFromJson(jsonData);
            } else if (typeof jsonData === 'object') {
                await this.loadModsFromJson(JSON.stringify(jsonData));
            } else {
                throw new Error("Invalid JSON format from URL");
            }
        } catch (error) {
            console.error(`Failed to load mods from URL ${url}:`, error);
            throw error;
        }
    }
}