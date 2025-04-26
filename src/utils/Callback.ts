export enum Step {
    FETCHING = "FETCHING",
    UPDATING = "UPDATING",
    DONE = "DONE"
}

export interface Callback {
    onStep(step: Step): void; // Called when the library moves to a new step 

    onProgress(
        totalDownloaded: number, // Number of mods already downloaded
        totalToDownload: number, // Total number of mods to download
        name: string              // Name of the currently downloading mod
    ): void;
}
