import { ModFile } from "@src/ModFile";
import { CurseforgeAPI } from "@src/api/CurseforgeAPI";
import { ModrinthAPI } from "@src/api/ModrinthAPI";

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

    public updateMods(
        checkHash: boolean = false, 
        deleteUnauthorizedMods: boolean = false
    ) {
        // Create folder if not exist
        if(!fs.existsSync(this.modDir)) {
            fs.mkdirSync(this.modDir, { recursive: true });
            console.log(`Mods directory ${this.modDir} created successfully.`);
        }

        // Update all mods
        this.modFiles.forEach(modFile => {
            modFile.update(
                this.modDir,
                checkHash
            )
        });
    }
}