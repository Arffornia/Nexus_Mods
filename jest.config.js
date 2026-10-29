// Offline unit tests only. Live-network tests (tests/live) use jest.live.config.js
// via `npm run test:live` and run in the nightly workflow, never on PRs.
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
    setupFilesAfterEnv: ["<rootDir>/tests/unit/setup.ts"],
    moduleNameMapper: {
        '^@src/(.*)$': '<rootDir>/src/$1',
        '^@gameDir/(.*)$': '<rootDir>/.minecraft/$1',
    }
};
