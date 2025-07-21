import { ModFile } from "@src/ModFile";
import { GithubReleasesAPI } from '@src/api/GithubReleasesAPI';
import { HashTypes } from '@src/hash/HashTypes';
import path from "path";

describe('GithubReleasesAPI getModFile', () => {
  it('Should return the ModFile of a Arffornia mod from github release', async () => {
    const expected = new ModFile(
        path.normalize("mods/arffornia-1.0.0.jar"),
        "d4864b4489c424429836de80eb538a2155549192bb6a0ae5fbf64f488cf656b7",
        HashTypes.SHA256,
        "https://github.com/Arffornia/Arffornia_Mods/releases/download/v1.0.0/arffornia-1.0.0.jar"
    );


    const githubAPI = new GithubReleasesAPI();

    const owner = 'Arffornia';
    const repoName = 'Arffornia_Mods';
    const tag = 'v1.0.0';
    const assetName = "arffornia-1.0.0.jar";

    const result = await githubAPI.getModFile(owner, repoName, tag, assetName);
    
    expect(expected).toEqual(result);
  });
});

describe('GithubReleasesAPI getModFile', () => {
  it('GithubReleasesAPI get ModFile with invalid tag', async () => {
    const expected = new ModFile(
        path.normalize("mods/arffornia-1.0.0.jar"),
        "d4864b4489c424429836de80eb538a2155549192bb6a0ae5fbf64f488cf656b7",
        HashTypes.SHA256,
        "https://github.com/Arffornia/Arffornia_Mods/releases/download/v1.0.0/arffornia-1.0.0.jar"
    );


    const githubAPI = new GithubReleasesAPI();

    const owner = 'Arffornia';
    const repoName = 'Arffornia_Mods';
    const tag = 'v0.invalid.0';
    const assetName = "arffornia-1.0.0.jar";

    await expect(githubAPI.getModFile(owner, repoName, tag, assetName)).rejects.toThrow();
  });
});