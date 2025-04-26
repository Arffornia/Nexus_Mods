import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * File interface 
 * @param path - Relatif path to the file (from storage dir)
 * @param hash - SHA1 of the file
 * @param override - Always rewrite the file when TRUE
 *
 * @interface FileInfo
 */
interface FileInfo {
    path: string;
    hash: string;
    override: boolean;
}

/**
 * Simple hash func for the calculation of SHA1 on a file
 *
 * @param {string} filePath - path of the file to hash
 * @return {*}  {string} Hash string of the file
 */
function calculateHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha1');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

/**
 * Get all files recursively from a dir with a relative path.
 *
 * @param {string} dir source dir to list all files
 * @param {string} [basePath=''] relarive basepath
 * @return {*}  {FileInfo[]} List of founded files
 */
function getFiles(dir: string, basePath: string = ''): FileInfo[] {
    const files: FileInfo[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);

        if (fs.statSync(fullPath).isDirectory()) {
            files.push(...getFiles(fullPath, relativePath));
        } else {
            const hash = calculateHash(fullPath);
            files.push({ path: relativePath, hash, override: true });
        }
    }

    return files;
}

/**
 * Generate or update an external file index.
 *
 * @param storageDir Absolute path to the storage directory
 * @param outputIndexFile Absolute path to the output index.json file
 */
export async function generateIndex(storageDir: string, outputIndexFile: string): Promise<void> {
    const files = getFiles(storageDir);

    let existingIndex: { generatedAt: string; files: FileInfo[] } = { generatedAt: '', files: [] };
    if (fs.existsSync(outputIndexFile)) {
        const rawData = fs.readFileSync(outputIndexFile, 'utf-8');
        existingIndex = JSON.parse(rawData);
    }

    const updatedFiles: FileInfo[] = files.map(newFile => {
        const existingFile = existingIndex.files.find(f => f.path === newFile.path);

        if (existingFile) {
            return { ...existingFile, hash: newFile.hash };
        } else {
            return newFile;
        }
    });

    const updatedIndex = {
        generatedAt: new Date().toISOString(),
        files: updatedFiles,
    };

    fs.writeFileSync(outputIndexFile, JSON.stringify(updatedIndex, null, 2), 'utf-8');
    console.log('Index file updated at:', outputIndexFile);
}
