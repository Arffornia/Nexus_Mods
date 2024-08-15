import { ModFile } from "@src/ModFile";
import { HashTypes } from "@src/hash/HashTypes";
import { deleteFileIfExists, createFolderIfNotExist, hashFile } from "@src/utils/fileUtils";

import path = require("path");


describe("Download AE2 mod", () => {
    const modFile = new ModFile(
        "appliedenergistics2-forge-15.2.11.jar",
        "16ab2c2ede29a5f2c749f6b0151b1de2cacc76ba",
        HashTypes.SHA1,
        "https://cdn.modrinth.com/data/XxWD5pD3/versions/kF3whRqC/appliedenergistics2-forge-15.2.11.jar"
    );

    const modsDir = path.join("./.minecraft", "mods");
    const filePath = path.join(modsDir, modFile.getFileName());

    beforeAll(() => {
        deleteFileIfExists(filePath);
    });

    afterAll(() => {
        deleteFileIfExists(filePath);
    })

    it("Should download the AE2 jar file", async () => {        
        const modsDir = path.join("./.minecraft", "mods");
        createFolderIfNotExist(modsDir);
        
        try {
            await modFile.update(modsDir, false);
            
            const currentFileHash = await hashFile(filePath, HashTypes.SHA1);

            expect(currentFileHash).toEqual(modFile.getHash());
        } catch (error) {
            console.error('Test failed with error:', error);
            throw error;
        }
    }, 60 * 1000); 
});

describe("Download Mekanism mod", () => {
    const modFile = new ModFile(
        "Mekanism-1.20.1-10.4.8.43.jar",
        "15badf085388fbd8bcb7948310bfb3a1e39e1e7f",
        HashTypes.SHA1,
        "https://edge.forgecdn.net/files/5395/221/Mekanism-1.20.1-10.4.8.43.jar"
    );

    const modsDir = path.join("./.minecraft", "mods");
    const filePath = path.join(modsDir, modFile.getFileName());

    beforeAll(() => {
        deleteFileIfExists(filePath);
    });

    afterAll(() => {
        deleteFileIfExists(filePath);
    })

    it("Should download the Mekanism jar file", async () => {        
        const modsDir = path.join("./.minecraft", "mods");
        createFolderIfNotExist(modsDir);
        
        try {
            await modFile.update(modsDir, false);
            
            const currentFileHash = await hashFile(filePath, HashTypes.SHA1);

            expect(currentFileHash).toEqual(modFile.getHash());
        } catch (error) {
            console.error('Test failed with error:', error);
            throw error;
        }
    }, 60 * 1000); 
});

describe("Overwriting test", () => {
    const oldModFile = new ModFile(
        "EnderIO-1.20.1.jar", //Specific version deliberately not specified for this test
        "ccd574b455859801058799e10ec8c2aca4060f0f",
        HashTypes.SHA1,
        "https://edge.forgecdn.net/files/5460/93/EnderIO-1.20.1-6.1.2-beta-all.jar"
    );

    const newModFile = new ModFile(
        "EnderIO-1.20.1.jar", //Specific version deliberately not specified for this test
        "7d8a8fb4fc58839ef56336fa998d82f312367f1d",
        HashTypes.SHA1,
        "https://edge.forgecdn.net/files/5549/669/EnderIO-1.20.1-6.1.8-beta-all.jar"
    );

    const modsDir = path.join("./.minecraft", "mods");
    const oldFilePath = path.join(modsDir, oldModFile.getFileName());
    const newFilePath = path.join(modsDir, newModFile.getFileName());

    beforeAll(() => {
        deleteFileIfExists(oldFilePath);
        deleteFileIfExists(newFilePath);
    });

    afterAll(() => {
        deleteFileIfExists(oldFilePath);
        deleteFileIfExists(newFilePath);
    })

    it("Should download and overwrite the EnderIO jar file", async () => {        
        createFolderIfNotExist(modsDir);

        try {
            // First download
            await oldModFile.update(modsDir, true);
            let currentFileHash = await hashFile(oldFilePath, HashTypes.SHA1);
            expect(currentFileHash).toEqual(oldModFile.getHash());

            // Second download (to test overwrite)
            await newModFile.update(modsDir, true);
            currentFileHash = await hashFile(newFilePath, HashTypes.SHA1);
            expect(currentFileHash).toEqual(newModFile.getHash());

        } catch (error) {
            console.error('Test failed with error:', error);
            throw error;
        }
    }, 60 * 1000); 
});
