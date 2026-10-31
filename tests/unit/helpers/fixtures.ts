import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export function sha1(content: string | Buffer): string {
    return crypto.createHash("sha1").update(content).digest("hex");
}

export function sha256(content: string | Buffer): string {
    return crypto.createHash("sha256").update(content).digest("hex");
}

/** Create a fresh temporary game directory with an empty `mods/` folder. */
export function makeGameDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nexus-mods-test-"));
    fs.mkdirSync(path.join(dir, "mods"));
    return dir;
}

export function removeDir(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true });
}

export const CF_API = "https://api.curse.tools";
export const MR_API = "https://api.modrinth.com";
export const GH_API = "https://api.github.com";
export const CDN = "https://cdn.example.test";

/** CurseForge `/v1/cf/mods/{projectId}/files/{fileId}` response body. */
export function cfFile(fileName: string, content: string) {
    return {
        data: {
            fileName,
            hashes: [{ value: sha1(content), algo: 1 }],
            downloadUrl: `${CDN}/cf/${fileName}`,
        },
    };
}

/** Modrinth `/v2/version/{id}` response body. */
export function mrVersion(fileName: string, content: string) {
    return {
        files: [{ filename: fileName, hashes: { sha1: sha1(content) }, url: `${CDN}/mr/${fileName}` }],
    };
}

export function modList(curseforge: object[] = [], modrinth: object[] = [], githubReleases: object[] = []): string {
    return JSON.stringify({
        mods: { curseforge, modrinth, "github-releases": githubReleases },
    });
}
