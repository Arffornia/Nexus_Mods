import { ModFile } from "@src/ModFile";
import { createFolderIfNotExist, listFilesInDirectory, deleteFileIfExists } from "./utils/fileUtils";

import * as fs from 'fs';
import path from "path";

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
        deleteUnauthorizedMods: boolean = false
    ): Promise<void> {
        try {
            // Create folder if not exist
            if (createFolderIfNotExist(this.modDir)) {
                console.log(`Mods directory ${this.modDir} created successfully.`);
            }

            // List all mods presents in the mods folder
            const presentMods = listFilesInDirectory(this.modDir, false);
            console.log(`List of detected files: ${presentMods}`);
    
            // Update all mods
            await Promise.all(this.modFiles.map(async (modFile) => {
                try {
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
            }));

            if(deleteUnauthorizedMods) {
                // Delete unauthorized mods
                presentMods.forEach(modName => {
                    console.log(`Unauthorized mod: ${modName}`);
                    deleteFileIfExists(path.join(this.modDir, modName));
                });
            }
        } catch (error) {
            console.error('Error during mods update:', error);
        }
    }
}