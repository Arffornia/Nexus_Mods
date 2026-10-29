import nock from "nock";
import * as fs from "fs";
import * as path from "path";
import { NexusMods } from "@src/NexusMods";
import { NexusModsUpdateError } from "@src/UpdateResult";
import { CF_API, MR_API, CDN, cfFile, mrVersion, modList, makeGameDir, removeDir, sha1 } from "./helpers/fixtures";

describe("NexusMods.updateMods failure semantics", () => {
    let gameDir: string;
    let modsDir: string;

    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(console, "warn").mockImplementation(() => undefined);
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => jest.restoreAllMocks());

    beforeEach(() => {
        gameDir = makeGameDir();
        modsDir = path.join(gameDir, "mods");
    });
    afterEach(() => removeDir(gameDir));

    const twoMods = modList(
        [{ displayName: "Alpha", projectId: "1", fileId: "10" }],
        [{ displayName: "Beta", versionId: "beta" }],
    );

    it("downloads registered mods and deletes unregistered ones when everything resolves", async () => {
        fs.writeFileSync(path.join(modsDir, "stale.jar"), "old");
        nock(CF_API).get("/v1/cf/mods/1/files/10").reply(200, cfFile("alpha.jar", "A"));
        nock(MR_API).get("/v2/version/beta").reply(200, mrVersion("beta.jar", "B"));
        nock(CDN).get("/cf/alpha.jar").reply(200, "A").get("/mr/beta.jar").reply(200, "B");

        const nexus = new NexusMods(gameDir);
        await nexus.loadModsFromJson(twoMods);
        const result = await nexus.updateMods(true, true);

        expect(result.ok).toBe(true);
        expect(result.failures).toEqual([]);
        expect(result.downloaded.sort()).toEqual([path.join("mods", "alpha.jar"), path.join("mods", "beta.jar")]);
        expect(result.deleted).toEqual(["stale.jar"]);
        expect(result.deletionSkipped).toBe(false);
        expect(fs.readdirSync(modsDir).sort()).toEqual(["alpha.jar", "beta.jar"]);
    });

    it("never deletes a mod whose lookup failed, and reports it", async () => {
        // beta.jar is installed from a previous run; its lookup now fails.
        fs.writeFileSync(path.join(modsDir, "beta.jar"), "B");
        fs.writeFileSync(path.join(modsDir, "stale.jar"), "old");
        nock(CF_API).get("/v1/cf/mods/1/files/10").reply(200, cfFile("alpha.jar", "A"));
        nock(MR_API).get("/v2/version/beta").reply(503, "unavailable");
        nock(CDN).get("/cf/alpha.jar").reply(200, "A");

        const nexus = new NexusMods(gameDir);
        await nexus.loadModsFromJson(twoMods);
        const result = await nexus.updateMods(true, true);

        expect(result.ok).toBe(false);
        expect(result.failures).toHaveLength(1);
        expect(result.failures[0]).toMatchObject({ stage: "lookup", name: "modrinth: Beta" });
        expect(result.deletionSkipped).toBe(true);
        expect(result.deleted).toEqual([]);
        expect(fs.existsSync(path.join(modsDir, "beta.jar"))).toBe(true);
        // Deletion is skipped as a whole: the wanted set is unknown.
        expect(fs.existsSync(path.join(modsDir, "stale.jar"))).toBe(true);
    });

    it("keeps an installed mod whose re-download failed, and reports it", async () => {
        fs.writeFileSync(path.join(modsDir, "alpha.jar"), "outdated");
        nock(CF_API).get("/v1/cf/mods/1/files/10").reply(200, cfFile("alpha.jar", "A"));
        nock(MR_API).get("/v2/version/beta").reply(200, mrVersion("beta.jar", "B"));
        nock(CDN).get("/cf/alpha.jar").reply(500).get("/mr/beta.jar").reply(200, "B");

        const nexus = new NexusMods(gameDir);
        await nexus.loadModsFromJson(twoMods);
        const result = await nexus.updateMods(true, true);

        expect(result.ok).toBe(false);
        expect(result.failures).toEqual([
            expect.objectContaining({ stage: "download", name: path.join("mods", "alpha.jar") }),
        ]);
        expect(result.deleted).toEqual([]);
        expect(fs.existsSync(path.join(modsDir, "alpha.jar"))).toBe(true);
        expect(fs.readFileSync(path.join(modsDir, "beta.jar"), "utf-8")).toBe("B");
    });

    it("rejects with NexusModsUpdateError when throwOnFailure is set", async () => {
        nock(CF_API).get("/v1/cf/mods/1/files/10").reply(404, {});
        nock(MR_API).get("/v2/version/beta").reply(200, mrVersion("beta.jar", "B"));
        nock(CDN).get("/mr/beta.jar").reply(200, "B");

        const nexus = new NexusMods(gameDir);
        await nexus.loadModsFromJson(twoMods);

        const promise = nexus.updateMods(true, true, { throwOnFailure: true });
        await expect(promise).rejects.toBeInstanceOf(NexusModsUpdateError);
        await promise.catch((err: NexusModsUpdateError) => {
            expect(err.result.failures[0]).toMatchObject({ stage: "lookup", name: "curseforge: Alpha" });
        });
    });

    it("does not throw by default (backward compatible)", async () => {
        nock(CF_API).get("/v1/cf/mods/1/files/10").reply(404, {});
        nock(MR_API).get("/v2/version/beta").reply(404, {});

        const nexus = new NexusMods(gameDir);
        await nexus.loadModsFromJson(twoMods);

        await expect(nexus.updateMods(true, true)).resolves.toMatchObject({ ok: false });
        expect(nexus.getLoadFailures()).toHaveLength(2);
    });

    it("loads external files and awaits the index before updating", async () => {
        const base = "https://files.example.test/config/server/";
        nock("https://files.example.test")
            .get("/config/server/index.json")
            .reply(200, { files: [{ path: "config/a.toml", hash: sha1("x=1"), override: true }] })
            .get("/config/server/storage/config/a.toml")
            .reply(200, "x=1");

        const nexus = new NexusMods(gameDir);
        await nexus.loadExternalFilesFromJsonUrl(base);
        const result = await nexus.updateMods(true, false);

        expect(result.ok).toBe(true);
        expect(fs.readFileSync(path.join(gameDir, "config", "a.toml"), "utf-8")).toBe("x=1");
    });
});
