import axios from 'axios';
import path from 'path';
import { ModFile } from '@src/ModFile';
import { HashTypes } from '@src/hash/HashTypes';
import { USER_AGENT } from "./../utils/HttpUtils";

export class ModrinthAPI {
    private endpointURL: string;
    private modDir: string;

    /**
     * Creates an instance of Modrinth API.
     * 
     * @param {string} [modDirName="mods"] - The directory where mods will be stored, relative to the game directory.
     * @memberof ModrinthAPI
     */
    constructor(modDirName: string = "mods") {
        this.endpointURL = "https://api.modrinth.com/v2";
                this.modDir = modDirName;

    }

    /**
     * Return the ModFile object from Modrinth API mod version.
     *
     * @param {string} versionId - The Version Id of the target mod.
     * @return {*}  {(Promise<ModFile>)}
     * @memberof ModrinthAPI
     */
    async getModFile(versionId: string): Promise<ModFile> {
        const url = `${this.endpointURL}/version/${versionId}`;

        try {
            const rep = await axios.get(url, {
                headers: {
                    'User-Agent': USER_AGENT,
                }
            });
            const data = rep.data;

            const fileData = data.files[0];

            const modFile: ModFile = new ModFile(
                path.join(this.modDir, fileData.filename),
                fileData.hashes.sha1,
                HashTypes.SHA1,
                fileData.url
            );

            return modFile;
        } catch (err) {
            console.error(`Failed to fetch mod file from Modrinth: ${err}`);
            throw err;
        }
    }
}
