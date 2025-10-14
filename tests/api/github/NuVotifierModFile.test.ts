import { ModFile } from "@src/ModFile";
import { GithubReleasesAPI } from '@src/api/GithubReleasesAPI';
import { HashTypes } from '@src/hash/HashTypes';
import path from "path";

describe('GithubReleasesAPI with hashless asset (NuVotifier)', () => {
    it('should create a ModFile with HashTypes.NONE when digest is null', async () => {
        const githubAPI = new GithubReleasesAPI();
        const owner = 'NuVotifier';
        const repoName = 'NuVotifier';
        const tag = 'v2.7.3';
        const assetName = 'nuvotifier.jar';

        const result = await githubAPI.getModFile(owner, repoName, tag, assetName);

        expect(result).toBeInstanceOf(ModFile);
        expect(result.getHash()).toBe('');
        expect(result.gethashType()).toBe(HashTypes.NONE);
        expect(result.getFileName()).toBe('nuvotifier.jar');
        expect(result.getFilePath()).toBe(path.normalize('mods/nuvotifier.jar'))
        expect(result.getUrl()).toBe('https://github.com/NuVotifier/NuVotifier/releases/download/v2.7.3/nuvotifier.jar');
    }, 15 * 1000); 
});