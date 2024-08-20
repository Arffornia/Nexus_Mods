import axios from 'axios';
import { ModFile } from '@src/ModFile';
import { HashTypes } from '@src/hash/HashTypes';

export class CurseforgeAPI {
    private endpointURL: string;

    constructor() {
        this.endpointURL = "https://api.curse.tools/v1/cf";
    }

    /**
     * Return the ModFile object from CurseForge API mod file.
     *
     * @param {string} projectId - The Project Id of the target mod.
     * @param {string} fileId - The File Id of the target mod.
     * @return {*}  {(Promise<ModFile>)}
     * @memberof CurseforgeAPI
     */
    async getModFile(projectId: string, fileId: string): Promise<ModFile> {
        const url = `${this.endpointURL}/mods/${projectId}/files/${fileId}`;

        try {
            const rep = await axios.get(url, {
                headers: {
                    'User-Agent': 'Arffornia/Nexus_Mods (arffornia@gmail.com)',
                }
            });
            const data = rep.data.data;

            const modFile: ModFile = new ModFile(
                data.fileName,
                data.hashes[0].value,
                this.convertHashType(data.hashes[0].algo),
                data.downloadUrl
            );

            return modFile;
        } catch (err) {
            console.error(`Failed to fetch mod file from CurseForge: ${err}`);
            throw err;
        }
    }

    /**
     * Converts an integer hash type code from CurseForge API to a HashTypes enum value.
     *
     * @private
     * @param {number} curseforgeAlgoNumber - The integer code representing the hash algorithm.
     * @return {HashTypes} - The corresponding HashTypes enum value.
     */
    private convertHashType(curseforgeAlgoNumber: number): HashTypes {
        switch (curseforgeAlgoNumber) {
            case 1:
                return HashTypes.SHA1;
            case 2:
                return HashTypes.MD5;
            default:
                return HashTypes.NONE;
        }
    }
}
