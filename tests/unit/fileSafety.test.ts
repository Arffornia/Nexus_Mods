import nock from "nock";
import * as fs from "fs";
import * as path from "path";
import { ModFile } from "@src/ModFile";
import { NexusMods } from "@src/NexusMods";
import { CurseforgeAPI } from "@src/api/CurseforgeAPI";
import { HashTypes } from "@src/hash/HashTypes";
import { assertPlainFileName, downloadFile, resolveInside } from "@src/utils/fileUtils";
import { CF_API, CDN, makeGameDir, removeDir, sha1 } from "./helpers/fixtures";

describe("file write safety", () => {
    let gameDir: string;

    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(console, "warn").mockImplementation(() => undefined);
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => jest.restoreAllMocks());

    beforeEach(() => {
        gameDir = makeGameDir();
    });
    afterEach(() => removeDir(gameDir));

    describe("resolveInside", () => {
        it.each([
            ["mods/a.jar"],
            ["config/sub/dir/file.toml"],
            ["./mods/a.jar"],
            ["mods/../config/a.toml"],
        ])("accepts %s", (p) => {
            expect(resolveInside(gameDir, p).startsWith(path.resolve(gameDir) + path.sep)).toBe(true);
        });

        it.each([
            ["../outside.txt"],
            ["mods/../../outside.txt"],
            ["/etc/passwd"],
            ["C:\\Windows\\x.dll"],
            [""],
            ["."],
        ])("rejects %s", (p) => {
            expect(() => resolveInside(gameDir, p)).toThrow();
        });
    });

    describe("assertPlainFileName", () => {
        it("accepts a plain jar name", () => {
            expect(assertPlainFileName("a-1.0+mc1.21.jar")).toBe("a-1.0+mc1.21.jar");
        });

        it.each([["../a.jar"], ["a/b.jar"], ["a\\b.jar"], [".."], [""]])("rejects %s", (n) => {
            expect(() => assertPlainFileName(n)).toThrow();
        });
    });

    it("an API file name with a directory part is reported as a lookup failure", async () => {
        nock(CF_API).get("/v1/cf/mods/1/files/2").reply(200, {
            data: { fileName: "../../evil.jar", hashes: [{ value: "x", algo: 1 }], downloadUrl: `${CDN}/x` },
        });

        await expect(new CurseforgeAPI().getModFile("1", "2")).rejects.toThrow(/Invalid file name/);
    });

    it("an index entry outside the game directory is reported and nothing is written", async () => {
        const base = "https://files.example.test/config/server/";
        nock("https://files.example.test")
            .get("/config/server/index.json")
            .reply(200, { files: [{ path: "../escaped.txt", hash: sha1("x"), override: true }] });

        const nexus = new NexusMods(gameDir);
        await nexus.loadExternalFilesFromJsonUrl(base);
        const result = await nexus.updateMods(true, false);

        expect(result.ok).toBe(false);
        expect(result.failures[0].error).toMatch(/outside/);
        expect(fs.existsSync(path.join(gameDir, "..", "escaped.txt"))).toBe(false);
    });

    describe("atomic download", () => {
        const target = () => path.join(gameDir, "mods", "a.jar");
        const leftovers = () => fs.readdirSync(path.join(gameDir, "mods")).filter(f => f.endsWith(".part"));

        it("writes the file when the hash matches and leaves no temp file", async () => {
            nock(CDN).get("/a.jar").reply(200, "NEW");

            await downloadFile(target(), `${CDN}/a.jar`, sha1("NEW"), HashTypes.SHA1);

            expect(fs.readFileSync(target(), "utf-8")).toBe("NEW");
            expect(leftovers()).toEqual([]);
        });

        it("keeps the old file and removes the temp file on hash mismatch", async () => {
            fs.writeFileSync(target(), "OLD");
            nock(CDN).get("/a.jar").reply(200, "TAMPERED");

            await expect(downloadFile(target(), `${CDN}/a.jar`, sha1("NEW"), HashTypes.SHA1)).rejects.toThrow(/Hash mismatch/);

            expect(fs.readFileSync(target(), "utf-8")).toBe("OLD");
            expect(leftovers()).toEqual([]);
        });

        it("keeps the old file and removes the temp file when the stream fails mid-way", async () => {
            fs.writeFileSync(target(), "OLD");
            nock(CDN).get("/a.jar").replyWithError("socket hang up");

            await expect(downloadFile(target(), `${CDN}/a.jar`, sha1("NEW"), HashTypes.SHA1)).rejects.toThrow();

            expect(fs.readFileSync(target(), "utf-8")).toBe("OLD");
            expect(leftovers()).toEqual([]);
        });

        it("skips verification when the hash type is NONE", async () => {
            nock(CDN).get("/a.jar").reply(200, "ANY");

            await downloadFile(target(), `${CDN}/a.jar`, "", HashTypes.NONE);

            expect(fs.readFileSync(target(), "utf-8")).toBe("ANY");
        });

        it("ModFile.sync reports a hash mismatch as a download failure", async () => {
            nock(CDN).get("/a.jar").reply(200, "TAMPERED");
            const modFile = new ModFile(path.join("mods", "a.jar"), sha1("NEW"), HashTypes.SHA1, `${CDN}/a.jar`);

            await expect(modFile.sync(gameDir, true)).rejects.toThrow(/Hash mismatch/);
            expect(fs.existsSync(target())).toBe(false);
        });
    });
});
