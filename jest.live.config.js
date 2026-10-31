// Live-network integration tests: real CurseForge (via api.curse.tools), Modrinth,
// GitHub and forgecdn downloads. Flaky by nature; run nightly or by hand.
const base = require("./jest.config.js");

module.exports = {
    ...base,
    testMatch: ["<rootDir>/tests/live/**/*.test.ts"],
    setupFilesAfterEnv: [],
    testTimeout: 120000,
};
