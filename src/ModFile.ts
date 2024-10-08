import { HashTypes } from "@src/hash/HashTypes";
import { existFile, hashFile, downloadFile } from "@src/utils/fileUtils";
import path from "path";

/**
 * Normalized representation of a mod file.
 *
 * @export
 * @class ModFile
 */
export class ModFile {
    private filename: string;
    private hash: string;
    private hashType: HashTypes;
    private url: string;

    constructor(filename: string, hash: string, hashType: HashTypes, url: string) {
        this.filename = filename;
        this.hash = hash;
        this.hashType = hashType;
        this.url = url;
    }   

    public async update(
        modDir: string,
        checkHash: boolean = false, 
    ): Promise<void> {
        const filePath = path.join(modDir, this.filename);
        var needToDownload = false;
    
        try {
            // Check if the file exists
            const fileExist = await existFile(filePath);
            
            if (fileExist) {
                if (checkHash) {
                    // Check that the files are the same via their hashes
                    const currentFileHash = await hashFile(filePath, this.hashType);
                    if (currentFileHash !== this.hash) {
                        needToDownload = true;
                    }
                }
            } else {
                needToDownload = true;
            }

            if(!needToDownload) {
                return;
            }          
            
            // Download file
            await downloadFile(filePath, this.url);
        } catch (error) {
            console.error('Error during file update:', error);
        }
    }

    public toString(): string {
        return `ModFile {
            filename: ${this.filename},
            hash: ${this.hash},
            hashType: ${this.hashType},
            url: ${this.url}
        }`;
    }

    public getFileName(): string {
        return this.filename;
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
