import axios from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

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
 * @param outputPath - The path where the downloaded file will be saved.
 * @param url - The URL from which to download the file.
 * @returns A promise that resolves when the file has been successfully downloaded.
 */
export async function downloadFile(outputPath: string, url: string): Promise<void> {
    console.log(`Downloading file from ${url} to ${outputPath}...`);

    try {
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream',
        });

        const writer = fs.createWriteStream(outputPath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log('File download complete.');
                resolve();
            });
            writer.on('error', (error) => {
                console.error('Error writing file:', error);
                reject(error);
            });
        });
    } catch (err) {
        console.error('Error in downloadFile:', err);
        throw err;
    }
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