import { ModFile } from "@src/ModFile";
import { createFolderIfNotExist } from "./utils/fileUtils";

import * as fs from 'fs';

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
    
            // Update all mods
            await Promise.all(this.modFiles.map(async (modFile) => {
                try {
                    await modFile.update(this.modDir, checkHash);
                } catch (error) {
                    console.error(`Error updating mod file ${modFile.getFileName}:`, error);
                }
            }));
    
        } catch (error) {
            console.error('Error during mods update:', error);
        }
    }
}