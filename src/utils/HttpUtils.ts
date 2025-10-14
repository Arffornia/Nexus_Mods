import axios from "axios";

export const USER_AGENT = 'Arffornia/Nexus_Mods (arffornia@gmail.com)';

/**
 * Fetching json data from an url
 *
 * @param {string} url json url to fetch
 * @return {*}  {Promise<string>} json data
 */
export async function GetJsonFromUrl(url: string): Promise<string> {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': USER_AGENT,
            }
        });

        return response.data;

    } catch (err) {
        console.error(`Failed to fetch json from: ${url}:`, err);
        throw err;
    }
}

/**
 * Load Json from an url
 *
 * @param {string} url - The URL from which to fetch the JSON file.
 * @returns {Promise<string>} The json data promise returning back
 * @throws {Error} If the JSON format is invalid, or if there is an error during the mod file retrieval process.
 * 
 * @memberof NexusMods
 */
export async function LoadJsonFromUrl(url: string): Promise<string> {
    const jsonData = await GetJsonFromUrl(url);

    if (typeof jsonData === 'string') {
        return jsonData;
    } else if (typeof jsonData === 'object') {
        return JSON.stringify(jsonData);
    } else {
        throw new Error("Invalid JSON format.");
    } 
}