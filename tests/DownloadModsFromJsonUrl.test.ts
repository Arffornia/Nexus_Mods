import { NexusMods } from "@src/NexusMods";
import { listFilesInDirectory, createFolderIfNotExist } from "@src/utils/fileUtils";
import { ModFile } from "@src/ModFile";
import { HashTypes } from "@src/hash/HashTypes";

import path = require("path");
import * as fs from 'fs';
import exp = require("constants");

// Json Test 1
describe("Download Mods from Json URL", () => {

    const jsonModListUrl = "https://arffornia.ddns.net/files/NexusModList.json";

    const modsDir = path.join("./.minecraft", "modsFromJsonUrlTest1");

    // Create mods directory
     createFolderIfNotExist(modsDir);

    afterAll(() => {
        // Cleanup: Delete the entire mods directory and its contents.
        fs.rmSync(modsDir, { recursive: true, force: true });
    });

    beforeAll(() => {
        // Cleanup: Delete the entire mods directory and its contents.
        fs.rmSync(modsDir, { recursive: true, force: true });
    })

    it("Should download AE2, Mekanism, EnderIO", async () => {     
        const nexusMods = new NexusMods(modsDir);
        
        // Load mods list from the json file.
        await nexusMods.loadModsFromJsonUrl(jsonModListUrl);

        // Update all mods.
        await nexusMods.updateMods(true, true);

        // List the remaining files in the mods directory.
        const remainingMods = listFilesInDirectory(modsDir, false);
        
        // Verify that only the mods you specified have been downloaded.
        expect(remainingMods).toContain("EnderIO-1.20.1-6.1.2-beta-all.jar");
        expect(remainingMods).toContain("Mekanism-1.20.1-10.4.0.14.jar");
        expect(remainingMods).toContain("appliedenergistics2-forge-15.2.11.jar");
        expect(remainingMods).toHaveLength(3);

    }, 60 * 1000);
});

// Json test 2
describe("Download Mods from Json URL", () => {

    const jsonModListUrl = "https://arffornia.ddns.net/files/NexusModList.json";

    const modsDir = path.join("./.minecraft", "modsFromJsonUrlTest2");

    beforeAll(async () => {
        // Cleanup: Delete the entire mods directory and its contents.
        fs.rmSync(modsDir, { recursive: true, force: true });
        
        // Create mods directory
        createFolderIfNotExist(modsDir);

        const BotaniaModFile = new ModFile(
            "Botania-1.20.1-446-FORGE.jar",
            "30ca9f036aaf7f18ebaa2cb5aa578c6ba1d273e6",
            HashTypes.SHA1,
            "https://edge.forgecdn.net/files/5594/997/Botania-1.20.1-446-FORGE.jar"
        );

        await BotaniaModFile.update(modsDir);
    }),

    afterAll(() => {
        // Cleanup: Delete the entire mods directory and its contents.
        fs.rmSync(modsDir, { recursive: true, force: true });        
    }, 60 * 1000);

    it("Should download AE2, Mekanism, EnderIO", async () => {     
        const nexusMods = new NexusMods(modsDir);
        
        // Load mods list from the json file.
        await nexusMods.loadModsFromJsonUrl(jsonModListUrl);

        // Update all mods.
        await nexusMods.updateMods(true, true);

        // List the remaining files in the mods directory.
        const remainingMods = listFilesInDirectory(modsDir, false);
        
        // Verify that only the mods you specified have been downloaded.
        expect(remainingMods).toContain("EnderIO-1.20.1-6.1.2-beta-all.jar");
        expect(remainingMods).toContain("Mekanism-1.20.1-10.4.0.14.jar");
        expect(remainingMods).toContain("appliedenergistics2-forge-15.2.11.jar");
        expect(remainingMods).not.toContain("Botania-1.20.1-446-FORGE.jar");
        expect(remainingMods).toHaveLength(3);

    }, 60 * 1000);
});