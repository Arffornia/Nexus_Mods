import axios from 'axios';
import path from 'path';
import { ModFile } from '@src/ModFile';
import { HashTypes } from '@src/hash/HashTypes';
import { USER_AGENT } from './../utils/HttpUtils';

interface ReleaseAsset {
    name: string;
    browser_download_url: string;
    digest: string;
}

export class GithubReleasesAPI {
    private modDir: string;
    private readonly apiBaseUrl: string = "https://api.github.com";

    constructor(modDirName: string = "mods") {
        this.modDir = modDirName;
    }

    
    /**
     * Retrieves a ModFile object from a GitHub Release registry, including its SHA256 hash.
     *
     * @param {string} owner - The repository owner (e.g., "Arffornia").
     * @param {string} repoName - The repository name (e.g., "Arffornia_Mods").
     * @param {string} tag - The release's tag (e.g., "v1.0.0" or "latest").
     * @param {string} assetName - Name of the asset to download (e.g., "arffornia-1.0.0.jar").
     * @returns {Promise<ModFile>} A promise that resolves to a ModFile object.
     * @throws Will throw an error if the SHA1 checksum file cannot be fetched.
     */
    public async getModFile(owner: string, repoName: string, tag: string, assetName: string): Promise<ModFile> {
        let releaseUrl = `${this.apiBaseUrl}/repos/${owner}/${repoName}/releases/`;

        if (tag.toLowerCase() === 'latest') {
            releaseUrl += 'latest';
        } else {
            releaseUrl += `tags/${tag}`;
        }

        try {
            const releaseResponse = await axios.get(releaseUrl, { headers: { 'User-Agent': USER_AGENT } });
            const assets: ReleaseAsset[] = releaseResponse.data.assets;

            const mainAsset = assets.find(asset => asset.name === assetName);
            if (!mainAsset) {
                throw new Error(`Asset '${assetName}' not found in release '${tag}'.`);
            }

            const digestParts = mainAsset.digest.split(':');
            if (digestParts.length < 2 || digestParts[0] !== 'sha256') {
                throw new Error(`Unsupported digest format from API: ${mainAsset.digest}`);
            }
            const hash = digestParts[1];

            return new ModFile(
                path.join(this.modDir, mainAsset.name),
                hash,
                HashTypes.SHA256,
                mainAsset.browser_download_url
            );

        } catch (err) {
            console.error(`Failed to fetch mod from GitHub Releases for ${repoName} (tag: ${tag}):`, err);
            throw err;
        }
    }
}