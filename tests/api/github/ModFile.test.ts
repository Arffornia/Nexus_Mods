import { ModFile } from "@src/ModFile";
import { GithubReleasesAPI } from '@src/api/GithubReleasesAPI';
import { HashTypes } from '@src/hash/HashTypes';
import path from "path";

describe('GithubReleasesAPI getModFile', () => {
  it('Should return the ModFile of a Arffornia mod from github release', async () => {
    const expected = new ModFile(
        path.normalize("mods/arffornia.jar"),
        "dc8d9c8a553689d55c6ec6254aa0cec54f03bc9432ee4e2e5a487e3c9c1c96e1",
        HashTypes.SHA256,
        "https://github.com/Arffornia/Arffornia_Mods/releases/download/v1.0.6/arffornia.jar"
    );


    const githubAPI = new GithubReleasesAPI();

    const owner = 'Arffornia';
    const repoName = 'Arffornia_Mods';
    const tag = 'v1.0.6';
    const assetName = "arffornia.jar";

    const result = await githubAPI.getModFile(owner, repoName, tag, assetName);
    
    expect(expected).toEqual(result);
  });
});

describe('GithubReleasesAPI getModFile', () => {
  it('GithubReleasesAPI get ModFile with invalid tag', async () => {
    const expected = new ModFile(
        path.normalize("mods/arffornia.jar"),
        "958177d3b0ee08f4273ed449e95f413770667347a3b68769f6f92917bad41db3",
        HashTypes.SHA256,
        "https://github.com/Arffornia/Arffornia_Mods/releases/download/v1.0.0/arffornia.jar"
    );


    const githubAPI = new GithubReleasesAPI();

    const owner = 'Arffornia';
    const repoName = 'Arffornia_Mods';
    const tag = 'v0.invalid.0';
    const assetName = "arffornia.jar";

    await expect(githubAPI.getModFile(owner, repoName, tag, assetName)).rejects.toThrow();
  });
});