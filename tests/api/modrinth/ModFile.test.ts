import { ModFile } from "@src/ModFile";
import { ModrinthAPI } from "@src/api/ModrinthAPI";
import { HashTypes } from "@src/hash/HashTypes";

describe("Modrinth get ModFile AE2", () => {
    it("Should return the ModFile of a AE2 mod", async () => {        
        const expected = new ModFile(
            "appliedenergistics2-forge-15.2.11.jar",
            "16ab2c2ede29a5f2c749f6b0151b1de2cacc76ba",
            HashTypes.SHA1,
            "https://cdn.modrinth.com/data/XxWD5pD3/versions/kF3whRqC/appliedenergistics2-forge-15.2.11.jar"
        );

        const modrinthAPI = new ModrinthAPI();

        const versionId = 'kF3whRqC';
        
        const result = await modrinthAPI.getModFile(versionId);

        expect(expected).toEqual(result);
    });
});

describe("Modrinth get ModFile with invalid versionId", () => {
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

    it("Should throw an error for an invalid versionId", async () => {
        const modrinthAPI = new ModrinthAPI();
        const invalidVersionId = 'invalid_version_id';

        // Expect an error to be thrown when an invalid versionId is used
        await expect(modrinthAPI.getModFile(invalidVersionId)).rejects.toThrow();
    });
});