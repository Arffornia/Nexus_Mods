import axios from 'axios';
import path from 'path';
import { ModFile } from '@src/ModFile';
import { HashTypes } from '@src/hash/HashTypes';
import { USER_AGENT } from './../utils/HttpUtils';

export class GithubAPI {
    private modDir: string;
    private readonly mavenBaseUrl: string = "https://maven.pkg.github.com";

    /**
     * Creates an instance of the GithubAPI.
     * @param {string} [modDirName="mods"] - The directory name for mods.
     */
    constructor(modDirName: string = "mods") {
        this.modDir = modDirName;
    }

    /**
     * Retrieves a ModFile object from a GitHub Packages repository, including its SHA1 hash.
     *
     * @param {string} owner - The repository owner (e.g., "Arffornia").
     * @param {string} repoName - The repository name (e.g., "Arffornia_Mods").
     * @param {string} groupId - The Maven package's groupId.
     * @param {string} artifactId - The Maven package's artifactId.
     * @param {string} version - The package version.
     * @returns {Promise<ModFile>} A promise that resolves to a ModFile object.
     * @throws Will throw an error if the SHA1 checksum file cannot be fetched.
     */
    public async getModFile(owner: string, repoName: string, groupId: string, artifactId: string, version: string): Promise<ModFile> {
        const groupPath = groupId.replace(/\./g, '/');
        const repoPath = `${this.mavenBaseUrl}/${owner}/${repoName}`;
        const artifactPath = `${groupPath}/${artifactId}/${version}`;

        const fileName = `${artifactId}-${version}.jar`;
        const downloadUrl = `${repoPath}/${artifactPath}/${fileName}`;
        const sha1Url = `${downloadUrl}.sha1`;

        try {
            // Fetch the SHA1 hash from the corresponding .sha1 checksum file
            const sha1Response = await axios.get(sha1Url, {
                headers: { 
                    'User-Agent': USER_AGENT
                    // For private packages, an Authorization header is required:
                    // 'Authorization': `Bearer YOUR_GITHUB_TOKEN`
                }
            });

            const hash = sha1Response.data.trim();
            if (!hash) {
                throw new Error(`SHA1 hash is empty for package ${artifactId}-${version}`);
            }

            const modFile = new ModFile(
                path.join(this.modDir, fileName),
                hash,
                HashTypes.SHA1,
                downloadUrl
            );

            return modFile;

        } catch (err) {
            console.error(`Failed to fetch mod file or checksum from GitHub Packages for ${fileName}:`, err);
            throw err;
        }
    }
}