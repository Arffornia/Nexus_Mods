import nock from "nock";
import * as path from "path";
import { CurseforgeAPI } from "@src/api/CurseforgeAPI";
import { ModrinthAPI } from "@src/api/ModrinthAPI";
import { GithubReleasesAPI } from "@src/api/GithubReleasesAPI";
import { HashTypes } from "@src/hash/HashTypes";
import { CF_API, MR_API, GH_API, CDN, cfFile, mrVersion, sha1, sha256 } from "./helpers/fixtures";

describe("API adapters (mocked HTTP)", () => {
    beforeAll(() => jest.spyOn(console, "error").mockImplementation(() => undefined));
    afterAll(() => jest.restoreAllMocks());

    it("CurseForge: maps file name, SHA1 hash and download URL", async () => {
        nock(CF_API).get("/v1/cf/mods/1/files/2").reply(200, cfFile("a.jar", "A"));

        const modFile = await new CurseforgeAPI().getModFile("1", "2");

        expect(modFile.getFilePath()).toBe(path.join("mods", "a.jar"));
        expect(modFile.getHash()).toBe(sha1("A"));
        expect(modFile.gethashType()).toBe(HashTypes.SHA1);
        expect(modFile.getUrl()).toBe(`${CDN}/cf/a.jar`);
    });

    it("CurseForge: maps algo 2 to MD5", async () => {
        nock(CF_API).get("/v1/cf/mods/1/files/2").reply(200, {
            data: { fileName: "a.jar", hashes: [{ value: "abc", algo: 2 }], downloadUrl: `${CDN}/a.jar` },
        });

        expect((await new CurseforgeAPI().getModFile("1", "2")).gethashType()).toBe(HashTypes.MD5);
    });

    it("CurseForge: rejects on HTTP error", async () => {
        nock(CF_API).get("/v1/cf/mods/1/files/2").reply(404, {});

        await expect(new CurseforgeAPI().getModFile("1", "2")).rejects.toThrow();
    });

    it("Modrinth: maps the first file of a version", async () => {
        nock(MR_API).get("/v2/version/abc").reply(200, mrVersion("b.jar", "B"));

        const modFile = await new ModrinthAPI("mods").getModFile("abc");

        expect(modFile.getFilePath()).toBe(path.join("mods", "b.jar"));
        expect(modFile.getHash()).toBe(sha1("B"));
        expect(modFile.getUrl()).toBe(`${CDN}/mr/b.jar`);
    });

    it("GitHub Releases: uses the sha256 digest of the asset, latest tag", async () => {
        nock(GH_API).get("/repos/o/r/releases/latest").reply(200, {
            assets: [
                { name: "other.jar", browser_download_url: `${CDN}/other.jar`, digest: null },
                { name: "c.jar", browser_download_url: `${CDN}/c.jar`, digest: `sha256:${sha256("C")}` },
            ],
        });

        const modFile = await new GithubReleasesAPI().getModFile("o", "r", "latest", "c.jar");

        expect(modFile.getHash()).toBe(sha256("C"));
        expect(modFile.gethashType()).toBe(HashTypes.SHA256);
    });

    it("GitHub Releases: no digest means HashTypes.NONE, named tag", async () => {
        nock(GH_API).get("/repos/o/r/releases/tags/v1").reply(200, {
            assets: [{ name: "c.jar", browser_download_url: `${CDN}/c.jar`, digest: null }],
        });

        const modFile = await new GithubReleasesAPI().getModFile("o", "r", "v1", "c.jar");

        expect(modFile.gethashType()).toBe(HashTypes.NONE);
    });

    it("GitHub Releases: rejects when the asset is missing", async () => {
        nock(GH_API).get("/repos/o/r/releases/latest").reply(200, { assets: [] });

        await expect(new GithubReleasesAPI().getModFile("o", "r", "latest", "c.jar")).rejects.toThrow(/not found/);
    });
});
