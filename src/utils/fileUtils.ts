import axios from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';

import { HashTypes } from '../hash/HashTypes';

/**
 * Hashes a file using the specified hash algorithm from HashTypes enum.
 * 
 * @param filePath - The path to the file to be hashed.
 * @param hashType - The type of hash algorithm to use.
 * @returns The hexadecimal hash string of the file.
 */
export function hashFile(filePath: string, hashType: HashTypes): Promise<string> {
    return new Promise((resolve, reject) => {
        if (hashType === HashTypes.NONE) {
            return reject(new Error('Invalid hash type: NONE is not a valid hash algorithm.'));
        }

        const hash = crypto.createHash(hashType.toLowerCase());
        const stream = fs.createReadStream(filePath);
    
        // Update the hash with data from the file stream
        stream.on('data', (data) => hash.update(data));
        // When the stream ends, resolve the promise with the hash digest
        stream.on('end', () => resolve(hash.digest('hex')));
        // Handle any errors during the reading process
        stream.on('error', (err: Error) => reject(err));
    });
}

/**
 * Downloads a file from the specified URL and saves it to the output path.
 *
 * The body is written to a temporary file next to `outputPath`. When `expectedHash` is given
 * (and `hashType` is not NONE) the temporary file is hashed and compared first. Only then is it
 * renamed over `outputPath`, so a failed, truncated or mismatching download never replaces an
 * existing file. The temporary file is removed on any error.
 *
 * @param outputPath - The path where the downloaded file will be saved.
 * @param url - The URL from which to download the file.
 * @param expectedHash - Optional expected hex digest of the downloaded file.
 * @param hashType - Hash algorithm of `expectedHash`.
 * @returns A promise that resolves when the file has been downloaded, verified and moved in place.
 */
export async function downloadFile(
    outputPath: string,
    url: string,
    expectedHash?: string,
    hashType: HashTypes = HashTypes.NONE,
): Promise<void> {
    const tempPath = `${outputPath}.${crypto.randomBytes(6).toString('hex')}.part`;

    try {
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream',
        });

        await pipeline(response.data, fs.createWriteStream(tempPath));

        if (expectedHash && hashType !== HashTypes.NONE) {
            const actualHash = await hashFile(tempPath, hashType);
            if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) {
                throw new Error(
                    `Hash mismatch for ${url}: expected ${hashType} ${expectedHash}, got ${actualHash}`
                );
            }
        }

        await fs.promises.rename(tempPath, outputPath);
    } catch (err) {
        await fs.promises.rm(tempPath, { force: true }).catch(() => undefined);
        console.error('Error in downloadFile:', err);
        throw err;
    }
}

/**
 * Resolves `relativePath` against `baseDir` and checks that the result stays inside `baseDir`.
 *
 * @param baseDir - Base directory (e.g. the game directory).
 * @param relativePath - Path relative to the base directory.
 * @returns The absolute resolved path.
 * @throws If the path is absolute or resolves outside `baseDir`.
 */
export function resolveInside(baseDir: string, relativePath: string): string {
    if (path.isAbsolute(relativePath) || path.win32.isAbsolute(relativePath)) {
        throw new Error(`Refusing absolute path: ${relativePath}`);
    }

    const base = path.resolve(baseDir);
    const target = path.resolve(base, relativePath);
    const rel = path.relative(base, target);

    if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
        throw new Error(`Refusing path outside of ${base}: ${relativePath}`);
    }

    return target;
}

/**
 * Checks that a file name coming from a remote API is a plain file name
 * (no directory separators, not `.` or `..`).
 *
 * @param fileName - File name to check.
 * @returns The same file name.
 * @throws If the file name is not a plain file name.
 */
export function assertPlainFileName(fileName: string): string {
    if (
        typeof fileName !== 'string' ||
        fileName.length === 0 ||
        fileName === '.' ||
        fileName === '..' ||
        /[\\/\0]/.test(fileName)
    ) {
        throw new Error(`Invalid file name: ${JSON.stringify(fileName)}`);
    }
    return fileName;
}

/**
 * Checks if a file exists at the specified file path.
 * 
 * @param filePath - The path to the file to check.
 * @returns A promise that resolves with `true` if the file exists, and `false` otherwise.
 */
export function existFile(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            resolve(!err);
        });
    });
}

/**
 * Creates a folder if it does not exist.
 *
 * @param folderDir - The folder path that needs to be created. If it's a file path, its parent directory is used.
 * @return {boolean} - Returns true if a folder was created, false if it already existed.
 */
export function createFolderIfNotExist(folderDir: string): boolean {
    let dirToCreate = folderDir;

    // If folderDir is a file, get its parent directory
    if (fs.existsSync(folderDir) && fs.lstatSync(folderDir).isFile()) {
        dirToCreate = path.dirname(folderDir);
    }

    // Check if the directory (or the parent of the file) exists
    if (!fs.existsSync(dirToCreate)) {
        fs.mkdirSync(dirToCreate, { recursive: true });
        return true;
    }

    return false;
}

/**
 * Deletes a file if it exists.
 *
 * @param filePath - The path to the file that needs to be deleted.
 * @returns {boolean} - Returns true if the file was deleted or did not exist. Returns false on error
 */
export function deleteFileIfExists(filePath: string): boolean {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Returns a list of all file names with extensions in a given directory.
 *
 * @param {string} directoryPath - The path to the directory to search in.
 * @param {boolean} recursive - Whether to search for files recursively in subdirectories.
 * @returns {string[]} A list of file names with their extensions.
 */
export function listFilesInDirectory(directoryPath: string, recursive: boolean = false): string[] {
    let fileList: string[] = [];

    /**
     * Internal function to process the directory and gather file names.
     * @param {string} dir - The current directory being processed.
     */
    function processDirectory(dir: string): void {
        const filesAndDirs = fs.readdirSync(dir);

        for (const entry of filesAndDirs) {
            const fullPath = path.join(dir, entry);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (recursive) {
                    processDirectory(fullPath);
                }
            } else {
                fileList.push(entry);
            }
        }
    }

    processDirectory(directoryPath);
    return fileList;
}