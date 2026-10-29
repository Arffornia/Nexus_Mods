import nock from "nock";
import * as fs from "fs";
import * as path from "path";
import { NexusMods } from "@src/NexusMods";
import { ModrinthAPI } from "@src/api/ModrinthAPI";
import { CurseforgeAPI } from "@src/api/CurseforgeAPI";
import { configureHttp, isRetryableError, mapWithConcurrency, withRetry } from "@src/utils/HttpClient";
import { downloadFile } from "@src/utils/fileUtils";
import { HashTypes } from "@src/hash/HashTypes";
import { CF_API, CDN, MR_API, cfFile, makeGameDir, modList, mrVersion, removeDir, sha1 } from "./helpers/fixtures";

describe("HTTP resilience", () => {
    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(console, "warn").mockImplementation(() => undefined);
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => jest.restoreAllMocks());

    describe("isRetryableError", () => {
        it.each([[500], [502], [503], [429], [408]])("retries HTTP %s", (status) => {
            expect(isRetryableError({ response: { status } })).toBe(true);
        });
        it.each([[400], [403], [404]])("does not retry HTTP %s", (status) => {
            expect(isRetryableError({ response: { status } })).toBe(false);
        });
        it("retries network errors and timeouts", () => {
            expect(isRetryableError({ code: "ECONNRESET" })).toBe(true);
            expect(isRetryableError({ code: "ECONNABORTED" })).toBe(true);
        });
        it("does not retry application errors", () => {
            expect(isRetryableError(new Error("Hash mismatch"))).toBe(false);
        });
    });

    describe("withRetry", () => {
        it("stops after the configured number of retries", async () => {
            configureHttp({ retries: 2 });
            const fn = jest.fn().mockRejectedValue({ response: { status: 503 } });

            await expect(withRetry(fn)).rejects.toEqual({ response: { status: 503 } });
            expect(fn).toHaveBeenCalledTimes(3);
        });

        it("does not retry a non-retryable error", async () => {
            configureHttp({ retries: 5 });
            const fn = jest.fn().mockRejectedValue({ response: { status: 404 } });

            await expect(withRetry(fn)).rejects.toBeDefined();
            expect(fn).toHaveBeenCalledTimes(1);
        });
    });

    it("metadata lookup succeeds after transient 503s", async () => {
        configureHttp({ retries: 3 });
        nock(MR_API)
            .get("/v2/version/abc").reply(503)
            .get("/v2/version/abc").reply(429)
            .get("/v2/version/abc").reply(200, mrVersion("b.jar", "B"));

        const modFile = await new ModrinthAPI().getModFile("abc");

        expect(modFile.getHash()).toBe(sha1("B"));
        expect(nock.isDone()).toBe(true);
    });

    it("metadata lookup times out", async () => {
        configureHttp({ retries: 0, timeoutMs: 50 });
        nock(MR_API).get("/v2/version/slow").delay(500).reply(200, mrVersion("b.jar", "B"));

        await expect(new ModrinthAPI().getModFile("slow")).rejects.toThrow(/timeout/i);
    });

    it("download retries a failed attempt and still writes atomically", async () => {
        configureHttp({ retries: 2 });
        const gameDir = makeGameDir();
        try {
            const target = path.join(gameDir, "mods", "a.jar");
            nock(CDN).get("/a.jar").replyWithError({ code: "ECONNRESET", message: "reset" })
                .get("/a.jar").reply(200, "A");

            await downloadFile(target, `${CDN}/a.jar`, sha1("A"), HashTypes.SHA1);

            expect(fs.readFileSync(target, "utf-8")).toBe("A");
            expect(fs.readdirSync(path.dirname(target))).toEqual(["a.jar"]);
        } finally {
            removeDir(gameDir);
        }
    });

    describe("mapWithConcurrency", () => {
        it("never exceeds the limit and keeps input order", async () => {
            let inFlight = 0;
            let maxInFlight = 0;
            const items = Array.from({ length: 20 }, (_, i) => i);

            const results = await mapWithConcurrency(items, 4, async (i) => {
                inFlight++;
                maxInFlight = Math.max(maxInFlight, inFlight);
                await new Promise(r => setTimeout(r, 5 + (i % 3) * 5));
                inFlight--;
                if (i === 7) throw new Error("boom");
                return i * 2;
            });

            expect(maxInFlight).toBe(4);
            expect(results[7]).toEqual({ ok: false, error: expect.any(Error) });
            expect(results.filter(r => r.ok).map(r => (r as { value: number }).value))
                .toEqual(items.filter(i => i !== 7).map(i => i * 2));
        });

        it("handles an empty list", async () => {
            await expect(mapWithConcurrency([], 8, async () => 1)).resolves.toEqual([]);
        });
    });

    it("loadModsFromJson resolves lookups with bounded concurrency and keeps mod list order", async () => {
        const gameDir = makeGameDir();
        const original = CurseforgeAPI.prototype.getModFile;
        let inFlight = 0;
        let maxInFlight = 0;
        const spy = jest.spyOn(CurseforgeAPI.prototype, "getModFile").mockImplementation(async function (this: CurseforgeAPI, p: string, f: string) {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            try {
                return await original.call(this, p, f);
            } finally {
                inFlight--;
            }
        });
        try {
            const mods = Array.from({ length: 9 }, (_, i) => ({ displayName: `M${i}`, projectId: `${i}`, fileId: `${i}` }));
            // Reverse delays so later entries resolve first.
            mods.forEach((_, i) => {
                nock(CF_API).get(`/v1/cf/mods/${i}/files/${i}`).delay((9 - i) * 10).reply(200, cfFile(`m${i}.jar`, `${i}`));
            });

            const nexus = new NexusMods(gameDir, undefined, "mods", { concurrency: 3 });
            await nexus.loadModsFromJson(modList(mods));

            const files = (nexus as unknown as { modFiles: { getFileName(): string }[] }).modFiles;
            expect(files.map(m => m.getFileName())).toEqual(mods.map((_, i) => `m${i}.jar`));
            expect(maxInFlight).toBe(3);
        } finally {
            spy.mockRestore();
            removeDir(gameDir);
        }
    });
});
