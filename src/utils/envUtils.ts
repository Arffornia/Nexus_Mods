/**
 * Retrieves an environment variable's value, falling back to a default if not set.
 *
 * @param {string} name - The name of the environment variable.
 * @param {string} defaultValue - The default value to return if the variable is not found.
 * @returns {string} The value of the environment variable or the default value.
 */
export function getEnvVariable(name: string, defaultValue: string): string {
    return process.env[name] ?? defaultValue;
}

/**
 * Retrieves an environment variable and interprets it as a boolean.
 *
 * @param {string} name - The name of the environment variable.
 * @param {boolean} defaultValue - The default value to return if the variable is not found.
 * @returns {boolean} True if the variable is 'true' or '1'; otherwise, false.
 */
export function getEnvVariableAsBoolean(name: string, defaultValue: boolean): boolean {
    const value = process.env[name]?.toLowerCase();
    if (value === undefined) {
        return defaultValue;
    }

    return value === 'true' || value === '1';
}

/**
 * Replaces placeholders in a file path with environment variable values.
 *
 * This function is controlled by the NM_REPLACE_ENV_VARIABLES environment variable.
 * If enabled, it searches for placeholders like `${NM_VAR}` and replaces them with
 * the value of the corresponding environment variable.
 *
 * @param {string} filePath - The file path containing potential placeholders.
 * @returns {string} The resolved file path with placeholders replaced.
 */
export function resolvePathFromEnv(filePath: string): string {
    const shouldReplace = getEnvVariableAsBoolean('NM_REPLACE_ENV_VARIABLES', false);
    if (!shouldReplace) {
        return filePath;
    }

    const prefix = getEnvVariable('NM_REPLACE_ENV_VARIABLE_PREFIX', 'NM_');
    const regex = new RegExp(`\\$\\{(${prefix}[^}]+)\\}`, 'g');

    return filePath.replace(regex, (match, varName) => {
        const envValue = process.env[varName];
        
        return envValue !== undefined ? envValue : match;
    });
}