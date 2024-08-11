import axios from 'axios';
import { ModFile } from '@src/ModFile';
import { HashTypes } from '@src/hash/HashTypes';

export class ModrinthAPI {
    private endpointURL: string;

    constructor() {
        this.endpointURL = "https://api.modrinth.com/v2";
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
            const rep = await axios.get(url);
            const data = rep.data;

            const fileData = data.files[0];

            const modFile: ModFile = new ModFile(
                fileData.filename,
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
