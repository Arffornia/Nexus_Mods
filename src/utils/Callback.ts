export enum Step {
    FETCHING = "FETCHING",
    UPDATING = "UPDATING",
    DONE = "DONE"
}

export interface Callback {
    onStep(step: Step): void;
    onProgress(
        totalDownloaded: number, 
        totalToDownload: number, 
        name: string
    )
}