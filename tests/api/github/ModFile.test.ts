import axios from 'axios';
    import { GithubAPI } from '@src/api/GithubAPI';
    import { HashTypes } from '@src/hash/HashTypes';

    // Mock the axios module
    jest.mock('axios');
    const mockedAxios = axios as jest.Mocked<typeof axios>;

    describe('GithubAPI getModFile', () => {
      beforeEach(() => {
        // Clear mock history before each test
        mockedAxios.get.mockClear();
      });

      it('should return a ModFile with a fetched SHA1 hash', async () => {
        const githubAPI = new GithubAPI();

        const owner = 'Arffornia';
        const repoName = 'Arffornia_Mods';
        const groupId = 'fr.thegostsniperfr.arffornia';
        const artifactId = 'arffornia';
        const version = '1.0.0';

        const mockSha1Hash = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
        
        // Mock the GET request to the .sha1 URL
        mockedAxios.get.mockResolvedValue({ data: mockSha1Hash });

        const result = await githubAPI.getModFile(owner, repoName, groupId, artifactId, version);
        
        const expectedJarUrl = `https://maven.pkg.github.com/${owner}/${repoName}/${groupId.replace(/\./g, '/')}/${artifactId}/${version}/${artifactId}-${version}.jar`;

        // Verify that axios was called correctly
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${expectedJarUrl}.sha1`,
          expect.any(Object)
        );

        // Assert the properties of the returned ModFile
        expect(result.getFileName()).toBe('arffornia-1.0.0.jar');
        expect(result.getHash()).toBe(mockSha1Hash);
        expect(result.gethashType()).toBe(HashTypes.SHA1);
        expect(result.getUrl()).toBe(expectedJarUrl);
      });

      it('should throw an error if the hash fetch request fails', async () => {
        const githubAPI = new GithubAPI();
        
        // Mock a rejected promise to simulate a network error
        mockedAxios.get.mockRejectedValue(new Error('Network error'));

        await expect(githubAPI.getModFile('owner', 'repo', 'group', 'artifact', 'version'))
            .rejects
            .toThrow('Network error');
      });
    });