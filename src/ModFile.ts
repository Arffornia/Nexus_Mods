import { HashTypes } from "@src/hash/HashTypes";
import { existFile, hashFile, downloadFile, createFolderIfNotExist } from "@src/utils/fileUtils";
import path from "path";
import { resolvePathFromEnv } from "./utils/envUtils";

/**
 * Normalized representation of a mod file.
 *
 * @export
 * @class ModFile
 */
export class ModFile {
    private filePath: string;
    private hash: string;
    private hashType: HashTypes;
    private url: string;

    constructor(filePath: string, hash: string, hashType: HashTypes, url: string) {
        this.filePath = resolvePathFromEnv(filePath);
        this.hash = hash;
        this.hashType = hashType;
        this.url = url;
    }   

    public async update(
        basePath: string,
        checkHash: boolean = false, 
    ): Promise<void> {
        let needToDownload = false;
    
        try {
            const fullPath = path.join(basePath, this.filePath);
            
            createFolderIfNotExist(path.dirname(fullPath));

            const fileExist = await existFile(fullPath);
            
            if (!fileExist) {
                needToDownload = true;
            } else {
                if (this.hashType === HashTypes.NONE) {
                    needToDownload = true;
                } else if (checkHash) {
                    const currentFileHash = await hashFile(fullPath, this.hashType);
                    if (currentFileHash !== this.hash) {
                        needToDownload = true;
                    }
                }
            }

            if (!needToDownload) {
                return;
            }          
            
            // Download file
            await downloadFile(fullPath, this.url);
        } catch (error) {
            console.error('Error during file update:', error);
        }
    }

    public toString(): string {
        return `ModFile {
            filename: ${this.filePath},
            hash: ${this.hash},
            hashType: ${this.hashType},
            url: ${this.url}
        }`;
    }

    public getFileName(): string {
        return path.basename(this.filePath);
    }

    public getFilePath(): string {
        return this.filePath;
    }

    public getHash(): string {
        return this.hash;
    }

    public gethashType(): HashTypes {
        return this.hashType;
    }

    public getUrl(): string {
        return this.url;
    }
}

/**
 * Converts a string representation of a hash type to its corresponding enum value.
 *
 * @export
 * @param {string} hashType - The string representation of the hash type (e.g., "sha256", "sha1", "md5").
 * @returns {HashTypes} The corresponding HashTypes enum value.
 * @throws {Error} If the provided hash type string does not match any known hash type.
 */
export function getHashTypeFromStr(hashType: string): HashTypes {
    switch (hashType.toLowerCase()) {
        case "sha256":
            return HashTypes.SHA256;
        case "sha1":
            return HashTypes.SHA1;
        case "md5":
            return HashTypes.MD5;
        default:
            return HashTypes.NONE;
    }
}