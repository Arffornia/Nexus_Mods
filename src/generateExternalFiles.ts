import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface FileInfo {
    path: string;
    hash: string;
    override: boolean;
}

const STORAGE_DIR_PATH = path.join(__dirname, '..', 'externalFiles', 'storage');
const INDEX_FILE_PATH = path.join(__dirname, '..', 'externalFiles', 'index.json');

function calculateHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha1');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

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

function generateOrUpdateIndex() {
    const files = getFiles(STORAGE_DIR_PATH);

    let existingIndex: { generatedAt: string; files: FileInfo[] } = { generatedAt: '', files: [] };
    if (fs.existsSync(INDEX_FILE_PATH)) {
        const rawData = fs.readFileSync(INDEX_FILE_PATH, 'utf-8');
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

    fs.writeFileSync(INDEX_FILE_PATH, JSON.stringify(updatedIndex, null, 2), 'utf-8');
    console.log('Index file updated at:', INDEX_FILE_PATH);
}

generateOrUpdateIndex();
