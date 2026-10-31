import { ModFile } from "@src/ModFile";
import { createFolderIfNotExist, listFilesInDirectory, deleteFileIfExists } from "./utils/fileUtils";
import { CurseforgeAPI } from "./api/CurseforgeAPI";
import { ModrinthAPI } from "./api/ModrinthAPI";
import { GithubReleasesAPI } from "./api/GithubReleasesAPI";

import { Callback, Step } from "./utils/Callback";
import { LoadJsonFromUrl as LoadJsonFromUrl } from "./utils/HttpUtils";
import { HashTypes } from "./hash/HashTypes";
import path from "path";
import { configureHttp, HttpOptions, mapWithConcurrency } from "./utils/HttpClient";
import { getEnvVariable } from "./utils/envUtils";

const DEFAULT_CONCURRENCY = 8;

function getEnvInt(name: string, fallback: number): number {
    const value = Number.parseInt(getEnvVariable(name, ""), 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

export interface NexusModsOptions {
    /** Maximum number of metadata lookups in flight (default 8, or `NM_CONCURRENCY`). */
    concurrency?: number;
    /** HTTP timeout and retry settings, applied library-wide (see `configureHttp`). */
    http?: Partial<HttpOptions>;
}
import {
    UpdateFailure,
    UpdateOptions,
    UpdateResult,
    NexusModsUpdateError,
    errorMessage,
} from "./UpdateResult";

/**
 * Main class of the NexuMods library
 *
 * @export
 * @class NexusMods
 */
export class NexusMods {
    private gameDir: string;
    private modDirName: string;
    private modDir: string;
    private modFiles: ModFile[] = [];
    private callback: Callback | null;
    private loadFailures: UpdateFailure[] = [];
    private concurrency: number;

    /**
     * Creates an instance of NexusMods.
     * 
     * @param {string} gameDirPath
     * @param {Callback} [callback]
     * @param {string} [modDirName="mods"] - The directory where mods will be stored, relative to the game directory.
     * @param {NexusModsOptions} [options] - Concurrency and HTTP settings (see README).
     * @memberof NexusMods
     */
    constructor(gameDirPath: string, callback?: Callback, modDirName: string = "mods", options: NexusModsOptions = {}) {
        this.concurrency = options.concurrency ?? getEnvInt("NM_CONCURRENCY", DEFAULT_CONCURRENCY);
        if (options.http) {
            configureHttp(options.http);
        }
        this.gameDir = gameDirPath;
        this.modDir = path.join(gameDirPath, modDirName);
        this.callback = callback;
        this.modDirName = modDirName;
    }

    public addModFile(modFile: ModFile): void {
        this.modFiles.push(modFile);
    }

    /**
     * Failures recorded while loading mod lists / indexes (lookups that could not be resolved).
     * They are included in the result of `updateMods`.
     */
    public getLoadFailures(): UpdateFailure[] {
        return [...this.loadFailures];
    }

    /**
     * Download or update every registered file, then optionally delete unregistered files
     * from the mod directory.
     *
     * Safety rules:
     * - A file whose download failed is never deleted (its old copy is kept).
     * - If any mod list entry could not be resolved, unregistered-file deletion is skipped
     *   entirely, because the full list of wanted mods is unknown (`deletionSkipped: true`).
     *
     * @param checkHash - Compare existing files by hash and re-download on mismatch.
     * @param deleteUnregisteredMods - Delete files in the mod directory that are not registered.
     * @param options - `throwOnFailure: true` rejects with `NexusModsUpdateError` on any failure.
     * @returns An `UpdateResult`. Callers that ignore it keep the previous behaviour
     *          (failures are logged, no exception).
     */
    public async updateMods(
        checkHash: boolean = false, 
        deleteUnregisteredMods: boolean = false,
        options: UpdateOptions = {},
    ): Promise<UpdateResult> {
        const result: UpdateResult = {
            ok: true,
            downloaded: [],
            upToDate: [],
            deleted: [],
            deletionSkipped: false,
            failures: [...this.loadFailures],
        };

        try {
            // Create folder if not exist
            if (createFolderIfNotExist(this.modDir)) {
                console.log(`Mods directory ${this.modDir} created successfully.`);
            }
            
            this.callback?.onStep(Step.FETCHING)
    
            // List all mods present in the mods folder
            const presentMods = listFilesInDirectory(this.modDir, false);
    
            const totalMods = this.modFiles.length;

            // Update all mods
            for (let i = 0; i < totalMods; i++) {
                const modFile = this.modFiles[i];

                // A registered file is never "unregistered", whether its update succeeds or not.
                const index = presentMods.indexOf(modFile.getFileName());
                if (index !== -1) {
                    presentMods.splice(index, 1);
                }

                try {
                    // Trigger the progress callback
                    this.callback?.onProgress(i + 1, totalMods, modFile.getFileName());

                    const status = await modFile.sync(this.gameDir, checkHash);
                    if (status === "downloaded") {
                        result.downloaded.push(modFile.getFilePath());
                    } else {
                        result.upToDate.push(modFile.getFilePath());
                    }
                } catch (error) {
                    console.error(`Error updating mod file ${modFile.getFileName()}:`, error);
                    result.failures.push({
                        stage: "download",
                        name: modFile.getFilePath(),
                        error: errorMessage(error),
                    });
                }
            }
    
            if (deleteUnregisteredMods) {
                if (this.loadFailures.length > 0) {
                    result.deletionSkipped = true;
                    console.warn(
                        `Skipping deletion of unregistered mods: ${this.loadFailures.length} mod list ` +
                        `entr${this.loadFailures.length === 1 ? "y" : "ies"} could not be resolved.`
                    );
                } else {
                    // Delete unregistered mods
                    presentMods.forEach(fileName => {
                        const modPath = path.join(this.modDir, fileName);
                        console.log(`Unregistered file: ${modPath}`);
                        if (deleteFileIfExists(modPath)) {
                            result.deleted.push(fileName);
                        } else {
                            result.failures.push({
                                stage: "update",
                                name: fileName,
                                error: `Could not delete unregistered file ${modPath}`,
                            });
                        }
                    });
                }
            }

            this.callback?.onStep(Step.DONE);
        } catch (error) {
            console.error('Error during mods update:', error);
            result.failures.push({ stage: "update", name: this.modDir, error: errorMessage(error) });
        }

        result.ok = result.failures.length === 0;

        if (!result.ok) {
            console.error(`${result.failures.length} mod file(s) failed to update.`);
            if (options.throwOnFailure) {
                throw new NexusModsUpdateError(result);
            }
        }

        return result;
    }

    /**
    * This method will parse the JSON string (see modListExample.json) and load mods in a NexusMods instance.
    *
    * @param {string} jsonData - A JSON string representing the mods to be managed.
    * @returns {Promise<void>} A promise that resolves when all mod files have been successfully loaded and added.
    * @throws {Error} If the JSON parsing fails or if there is an error during the mod file retrieval process.
    */
    public async loadModsFromJson(jsonData: string): Promise<void> {
        try {
            const parsedJson = JSON.parse(jsonData);

            const curseforgeMods = parsedJson.mods.curseforge || [];
            const modrinthMods = parsedJson.mods.modrinth || [];
            const githubReleasesMods = parsedJson.mods['github-releases'] || [];
            const externalFilesUrl = parsedJson.externalFilesIndexUrl || null;

            const curseforgeApi = new CurseforgeAPI(this.modDirName);
            const modrinthApi = new ModrinthAPI(this.modDirName);
            const githubReleasesApi = new GithubReleasesAPI(this.modDirName);

            type Lookup = { source: string; displayName: string; resolve: () => Promise<ModFile> };
            const lookups: Lookup[] = [
                ...curseforgeMods.map((mod: any): Lookup => ({
                    source: "curseforge",
                    displayName: mod.displayName,
                    resolve: () => curseforgeApi.getModFile(mod.projectId, mod.fileId),
                })),
                ...modrinthMods.map((mod: any): Lookup => ({
                    source: "modrinth",
                    displayName: mod.displayName,
                    resolve: () => modrinthApi.getModFile(mod.versionId),
                })),
                ...githubReleasesMods.map((mod: any): Lookup => ({
                    source: "github-releases",
                    displayName: mod.displayName,
                    resolve: () => githubReleasesApi.getModFile(mod.owner, mod.repoName, mod.tag, mod.assetName),
                })),
            ];

            // Resolve metadata with bounded concurrency; results keep the mod list order.
            const results = await mapWithConcurrency(lookups, this.concurrency, lookup => lookup.resolve());

            results.forEach((res, i) => {
                const lookup = lookups[i];
                if ("value" in res) {
                    this.addModFile(res.value);
                } else if ("error" in res) {
                    console.error(`Failed to load ${lookup.source} mod ${lookup.displayName}:`, errorMessage(res.error));
                    this.loadFailures.push({
                        stage: "lookup",
                        name: `${lookup.source}: ${lookup.displayName}`,
                        error: errorMessage(res.error),
                    });
                }
            });

            // Process External Files
            if (externalFilesUrl) {
                await this.loadExternalFilesFromJsonUrl(externalFilesUrl);
            }

            console.log("Mods loaded from JSON successfully.");
        } catch (error) {
            console.error("Failed to load mods from JSON:", error);
            this.loadFailures.push({ stage: "load", name: "mod list", error: errorMessage(error) });
        }
    }

    public async loadExternalFiles(baseUrl: string, jsonData: any): Promise<void> {
        jsonData = JSON.parse(jsonData);
        const externalFiles = jsonData.files || [];

        for (const file of externalFiles) {
            this.addModFile(new ModFile(
                file.path, 
                file.hash, 
                HashTypes.SHA1, 
                new URL(file.path, new URL("storage/", baseUrl).href).href
            ));
        }
    }

    /**
     * Load mods from a modlist.json url, using `loadModsFromJson`.
     *
     * @param {string} url - The URL from which to fetch the JSON file containing the mod information.
     * @returns {Promise<void>} A promise that resolves when all mod files have been successfully loaded and added.
     * 
     * @memberof NexusMods
     */
    public async loadModsFromJsonUrl(url: string): Promise<void> {
        await this.loadModsFromJson(await LoadJsonFromUrl(url));
    }

    /**
     * Load external files from the reposotory url, using `loadExtFilesFromJson`.
     *
     * @param {string} url Repo url (listing external files metainfo)
     * @return {*}  {Promise<void>}

     * @memberof NexusMods
     */
    public async loadExternalFilesFromJsonUrl(baseUrl: string): Promise<void> {
        if (!baseUrl.endsWith("/")) {
            baseUrl += "/";
        }

        const indexUrl = new URL("index.json", baseUrl).href;
        await this.loadExternalFiles(baseUrl, await LoadJsonFromUrl(indexUrl));
    }
}