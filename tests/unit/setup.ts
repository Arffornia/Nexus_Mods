import nock from "nock";

// Unit tests must never reach the network. Drop proxy settings so axios talks to nock
// directly, and block any request that is not mocked.
for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy"]) {
    delete process.env[key];
}

beforeAll(() => {
    nock.disableNetConnect();
});

afterEach(() => {
    nock.cleanAll();
});

afterAll(() => {
    nock.enableNetConnect();
});
