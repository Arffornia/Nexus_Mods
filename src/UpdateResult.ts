/**
 * Stage at which an entry failed.
 * - `load`: a whole mod list or external file index could not be parsed.
 * - `lookup`: metadata for one mod could not be resolved (API error, missing asset...).
 * - `download`: the file could not be downloaded or written.
 * - `update`: unexpected error in `updateMods` itself (e.g. mod directory not writable).
 */
export type FailureStage = "load" | "lookup" | "download" | "update";

export interface UpdateFailure {
    stage: FailureStage;
    /** Display name, file name or source of the failed entry. */
    name: string;
    /** Error message. */
    error: string;
}

/**
 * Outcome of `NexusMods.updateMods()`.
 */
export interface UpdateResult {
    /** `true` when there is no failure at all. */
    ok: boolean;
    /** Relative paths that were downloaded during this run. */
    downloaded: string[];
    /** Relative paths that were already present and valid. */
    upToDate: string[];
    /** File names deleted from the mod directory as unregistered. */
    deleted: string[];
    /**
     * `true` when `deleteUnregisteredMods` was requested but skipped because at least
     * one mod list entry could not be resolved (so the full list of wanted mods is unknown).
     */
    deletionSkipped: boolean;
    /** Every failure, including lookup failures recorded while loading mod lists. */
    failures: UpdateFailure[];
}

export interface UpdateOptions {
    /**
     * When `true`, `updateMods` rejects with a `NexusModsUpdateError` (carrying the result)
     * if there is any failure. Default `false`: failures are returned in the result.
     */
    throwOnFailure?: boolean;
}

/**
 * Error thrown by `updateMods` when `throwOnFailure` is set and something failed.
 */
export class NexusModsUpdateError extends Error {
    public readonly result: UpdateResult;

    constructor(result: UpdateResult) {
        const summary = result.failures
            .slice(0, 10)
            .map(f => `[${f.stage}] ${f.name}: ${f.error}`)
            .join("; ");
        const more = result.failures.length > 10 ? ` (+${result.failures.length - 10} more)` : "";
        super(`${result.failures.length} mod file(s) failed to update: ${summary}${more}`);
        this.name = "NexusModsUpdateError";
        this.result = result;
    }
}

export function errorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
