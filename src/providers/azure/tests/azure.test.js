const fs = require("fs");
const os = require("os");
const { setAzureRegion, readFincostsConfig } = require("./azure");

jest.mock("fs");
jest.mock("os");

describe("setAzureRegion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should set Azure region correctly and update the .fincosts file", () => {
    const mockConfig = { azure: { defaultRegion: "eastus" } };
    fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
    os.homedir.mockReturnValue("/home/user");
    fs.writeFileSync.mockImplementation(() => {});

    setAzureRegion("westus");

    const config = readFincostsConfig();
    expect(config.defaultRegion).toBe("westus");
    expect(fs.writeFileSync).toHaveBeenCalledWith("/home/user/.fincosts", JSON.stringify({ azure: { ...mockConfig.azure, defaultRegion: "westus" } }, null, 2));
  });
});
