import { ModFile } from "@src/ModFile";
import { HashTypes } from "@src/hash/HashTypes";
import { deleteFileIfExists, createFolderIfNotExist, hashFile } from "@src/utils/fileUtils";
import { NexusMods } from "@src/NexusMods";

import path = require("path");


describe("Download Botania & Create using NexusMods", () => {
    const BotaniaModFile = new ModFile(
        "Botania-1.20.1-446-FORGE.jar",
        "30ca9f036aaf7f18ebaa2cb5aa578c6ba1d273e6",
        HashTypes.SHA1,
        "https://edge.forgecdn.net/files/5594/997/Botania-1.20.1-446-FORGE.jar"
    );

    const CreateModFile = new ModFile(
        "create-1.20.1-0.5.1.f.jar",
        "3fee3c26ebbfdfd59e1371ab73ba1f61b44ef6d0",
        HashTypes.SHA1,
        "https://edge.forgecdn.net/files/4835/191/create-1.20.1-0.5.1.f.jar"
    );

    const modsDir = path.join("./.minecraft", "mods");
    const BotaniaFilePath = path.join(modsDir, BotaniaModFile.getFileName());
    const CreateFilePath = path.join(modsDir, CreateModFile.getFileName());

    beforeAll(() => {
        deleteFileIfExists(BotaniaFilePath);
        deleteFileIfExists(CreateFilePath);
    });

    afterAll(() => {
        deleteFileIfExists(BotaniaFilePath);
        deleteFileIfExists(CreateFilePath);
    })

    it("Should download the Botania & Create jar files.", async () => {        
        const modsDir = path.join("./.minecraft", "mods");
        createFolderIfNotExist(modsDir);
        
        try {
            const nexusMods = new NexusMods(modsDir);
            nexusMods.addModFile(BotaniaModFile);
            nexusMods.addModFile(CreateModFile);

            await nexusMods.updateMods();
            
            const currentBotaniaFileHash = await hashFile(BotaniaFilePath, HashTypes.SHA1);
            const currentCreateFileHash = await hashFile(CreateFilePath, HashTypes.SHA1);

            expect(currentBotaniaFileHash).toEqual(BotaniaModFile.getHash());
            expect(currentCreateFileHash).toEqual(CreateModFile.getHash());
        } catch (error) {
            console.error('Test failed with error:', error);
            throw error;
        }
    }, 60 * 1000); 
});