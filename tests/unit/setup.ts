import nock from "nock";
import { configureHttp, resetHttpOptions } from "@src/utils/HttpClient";

// Unit tests must never reach the network. Drop proxy settings so axios talks to nock
// directly, and block any request that is not mocked.
for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy"]) {
    delete process.env[key];
}

beforeAll(() => {
    nock.disableNetConnect();
});

// Fast, single-attempt HTTP by default; retry tests opt in explicitly.
beforeEach(() => {
    resetHttpOptions();
    configureHttp({ retries: 0, retryBaseDelayMs: 1, retryMaxDelayMs: 2, timeoutMs: 2000 });
});

afterEach(() => {
    nock.cleanAll();
});

afterAll(() => {
    nock.enableNetConnect();
});
