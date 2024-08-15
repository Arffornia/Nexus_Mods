import { ModFile } from "@src/ModFile";
import { NexusMods } from "@src/NexusMods";
import { CurseforgeAPI } from "@src/api/CurseforgeAPI";
import { HashTypes } from "@src/hash/HashTypes";
import * as path from 'path';
import * as fs from 'fs';
import { listFilesInDirectory, createFolderIfNotExist, deleteFileIfExists } from "@src/utils/fileUtils";

describe("Deleting unauthorized mods", () => {
    const modsDir = path.join("./.minecraft", "unauthorizedModsTest");

    // Create ModFile instances for valid mods
    const validMods = [
        new ModFile(
            "appliedenergistics2-forge-15.2.11.jar",
            "16ab2c2ede29a5f2c749f6b0151b1de2cacc76ba",
            HashTypes.SHA1,
            "https://cdn.modrinth.com/data/XxWD5pD3/versions/kF3whRqC/appliedenergistics2-forge-15.2.11.jar"
        ),
        new ModFile(
            "Mekanism-1.20.1-10.4.8.43.jar",
            "15badf085388fbd8bcb7948310bfb3a1e39e1e7f",
            HashTypes.SHA1,
            "https://edge.forgecdn.net/files/5395/221/Mekanism-1.20.1-10.4.8.43.jar"
        )
    ];

    beforeAll(async () => {
        // Cleanup: Delete the entire mods directory and its contents
        fs.rmSync(modsDir, { recursive: true, force: true });

        // Create mods directory
        createFolderIfNotExist(modsDir);

        // Add some unauthorized files
        const unauthorizedMods = [
            "unauthorizedMod1.jar",
            "unauthorizedMod2.jar"
        ];

        unauthorizedMods.forEach((file) => {
            const unauthorizedFilePath = path.join(modsDir, file);
            fs.writeFileSync(unauthorizedFilePath, "dummy content");
        });

        // Add valid mod files
        for (const modFile of validMods) {
            await modFile.update(modsDir, true);
        }
    }, 60 * 1000);

    afterAll(() => {
        // Cleanup: Delete the entire mods directory and its contents
        fs.rmSync(modsDir, { recursive: true, force: true });
    });

    it("Should delete unauthorized mods and keep only the valid mods", async () => {                
        const nexusMods = new NexusMods(modsDir);

        // Add valid mods to the manager
        validMods.forEach(modFile => nexusMods.addModFile(modFile));

        // Perform the update, expecting unauthorized mods to be deleted
        await nexusMods.updateMods(true, true);

        // List the remaining files in the mods directory
        const remainingMods = listFilesInDirectory(modsDir, false);

        // Check that only valid mod files are left
        expect(remainingMods).toHaveLength(validMods.length);
        expect(remainingMods).toContain(validMods[0].getFileName());
        expect(remainingMods).toContain(validMods[1].getFileName());
        expect(remainingMods).not.toContain("unauthorizedMod1.jar");
        expect(remainingMods).not.toContain("unauthorizedMod2.jar");
    }, 60 * 1000); 
});