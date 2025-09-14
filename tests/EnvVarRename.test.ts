import { ModFile } from '../src/ModFile';
import { HashTypes } from '../src/hash/HashTypes';
import * as path from 'path';

describe('Environment Variable File Renaming', () => {
    // Store original environment variables to restore them after tests
    const originalEnv = { ...process.env };

    beforeEach(() => {
        // Reset environment variables before each test
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        // Restore original environment variables after all tests are done
        process.env = originalEnv;
    });

    it('should NOT rename the file path when the feature is disabled', () => {
        process.env.NM_REPLACE_ENV_VARIABLES = 'false';
        process.env.NM_TEST_VAR = 'should_not_be_used';

        const filePath = 'mods/${NM_TEST_VAR}.jar';
        const modFile = new ModFile(filePath, 'hash', HashTypes.SHA1, 'url');

        const expectedPath = path.normalize(filePath);
        expect(modFile.getFilePath()).toBe(expectedPath);
    });

    it('should rename the file path when the feature is enabled with default prefix', () => {
        process.env.NM_REPLACE_ENV_VARIABLES = 'true';
        process.env.NM_RANDOM_FILE_NAME = 'hello_world';

        const filePath = 'mods/${NM_RANDOM_FILE_NAME}_maria.jar';
        const modFile = new ModFile(filePath, 'hash', HashTypes.SHA1, 'url');

        const expectedPath = path.normalize('mods/hello_world_maria.jar');
        expect(modFile.getFilePath()).toBe(expectedPath);
    });

    it('should rename the file path when the feature is enabled with a custom prefix', () => {
        process.env.NM_REPLACE_ENV_VARIABLES = 'true';
        process.env.NM_REPLACE_ENV_VARIABLE_PREFIX = 'CUSTOM_PREFIX_';
        process.env.CUSTOM_PREFIX_MY_MOD = 'my_custom_mod_name';

        const filePath = 'mods/${CUSTOM_PREFIX_MY_MOD}.jar';
        const modFile = new ModFile(filePath, 'hash', HashTypes.SHA1, 'url');

        const expectedPath = path.normalize('mods/my_custom_mod_name.jar');
        expect(modFile.getFilePath()).toBe(expectedPath);
    });

    it('should handle multiple placeholders in the file path', () => {
        process.env.NM_REPLACE_ENV_VARIABLES = 'true';
        process.env.NM_MOD_NAME = 'coolmod';
        process.env.NM_VERSION = '1.2.3';

        const filePath = 'mods/${NM_MOD_NAME}-${NM_VERSION}.jar';
        const modFile = new ModFile(filePath, 'hash', HashTypes.SHA1, 'url');

        const expectedPath = path.normalize('mods/coolmod-1.2.3.jar');
        expect(modFile.getFilePath()).toBe(expectedPath);
    });

    it('should leave the placeholder unchanged if the environment variable is not set', () => {
        process.env.NM_REPLACE_ENV_VARIABLES = 'true';

        const filePath = 'mods/${NM_UNDEFINED_VAR}.jar';
        const modFile = new ModFile(filePath, 'hash', HashTypes.SHA1, 'url');

        // The path should remain exactly as it was defined
        const expectedPath = path.normalize('mods/${NM_UNDEFINED_VAR}.jar');
        expect(modFile.getFilePath()).toBe(expectedPath);
    });

    it('should not rename if the prefix does not match the placeholder', () => {
        process.env.NM_REPLACE_ENV_VARIABLES = 'true';
        process.env.NM_REPLACE_ENV_VARIABLE_PREFIX = 'NM_';
        process.env.WRONG_PREFIX_VAR = 'should_not_be_used';

        const filePath = 'mods/${WRONG_PREFIX_VAR}.jar';
        const modFile = new ModFile(filePath, 'hash', HashTypes.SHA1, 'url');

        const expectedPath = path.normalize(filePath);
        expect(modFile.getFilePath()).toBe(expectedPath);
    });
});