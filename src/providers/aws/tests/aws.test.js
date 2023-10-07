const fs = require("fs");
const os = require("os");
const { readFincostsConfig } = require("./aws");

jest.mock("fs");
jest.mock("os");

describe("readFincostsConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return a valid AWS config object when the file exists and is valid", () => {
    const mockConfig = { aws: { defaultRegion: "us-east-1" } };
    fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
    os.homedir.mockReturnValue("/home/user");

    const config = readFincostsConfig();
    expect(config).toEqual(mockConfig.aws);
  });

  test("should return a default config object when the file does not exist", () => {
    fs.readFileSync.mockImplementation(() => {
      throw new Error("File not found");
    });

    const config = readFincostsConfig();
    expect(config).toEqual({
      defaultRegion: "",
      defaultProfile: "",
      misusedResources: {},
    });
  });

  test("should return a default config object when the file is invalid JSON", () => {
    fs.readFileSync.mockReturnValue("invalid json");

    const config = readFincostsConfig();
    expect(config).toEqual({
      defaultRegion: "",
      defaultProfile: "",
      misusedResources: {},
    });
  });
});
