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