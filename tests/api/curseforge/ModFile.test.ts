import { ModFile } from "@src/ModFile";
import { CurseforgeAPI } from "@src/api/CurseforgeAPI";
import { HashTypes } from "@src/hash/HashTypes";

describe("CurseForge get ModFile AE2", () => {
    it("Should return the ModFile of a AE2 mod", async () => {        
        const expected = new ModFile(
            "appliedenergistics2-forge-15.2.11.jar",
            "16ab2c2ede29a5f2c749f6b0151b1de2cacc76ba",
            HashTypes.SHA1,
            "https://edge.forgecdn.net/files/5565/729/appliedenergistics2-forge-15.2.11.jar"
        );

        const curseforgeAPI = new CurseforgeAPI();

        const projectId = '223794';
        const fileId = '5565729';

        const result = await curseforgeAPI.getModFile(projectId, fileId);

        expect(expected).toEqual(result);
    });
});

describe("CurseForge get ModFile with invalid projectId and fileId", () => {
    let originalConsoleError: typeof console.error;

    beforeAll(() => {
        // Set silent the console.error
        originalConsoleError = console.error;
        console.error = jest.fn();
    });

    afterAll(() => {
        // Restore the console.error
        console.error = originalConsoleError;
    });

    it("Should throw an error for an invalid projectId and fileId", async () => {
        const curseforgeAPI = new CurseforgeAPI();
        const invalidProjectId = 'invalid_project_id';
        const invalidFileId = 'invalid_file_id';

        // Expect an error to be thrown when invalid projectId and fileId are used
        await expect(curseforgeAPI.getModFile(invalidProjectId, invalidFileId)).rejects.toThrow();
    });
});