import { getCloudSQLStats } from "./checkCloudSQL";
import { google } from "googleapis";
import { getGCPCredentials, readFincostsConfig } from "../credentials";

jest.mock("googleapis");
jest.mock("../credentials");

describe("Get Cloud SQL Stats Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockedGetGCPCredentials = getGCPCredentials as jest.MockedFunction<typeof getGCPCredentials>;

  test("should return Cloud SQL stats", async () => {
    mockedGetGCPCredentials.mockResolvedValue("some-auth-token");
    mockedGetGCPCredentials.mockReturnValue({ defaultProfile: "default" });
    const listMock = jest.fn().mockResolvedValue({ data: { timeSeries: [{ points: [{ interval: { endTime: { seconds: 1234567890 } }, value: { doubleValue: 50 } }] }] } });
    google.monitoring = jest.fn().mockReturnValue({ v3: { projects: { timeSeries: { list: listMock } } } });

    const stats = await getCloudSQLStats("<id da instance>");

    expect(stats).toEqual([{ timestamp: 1234567890, cpuUtilization: 50 }]);
  });

  test("should handle no data scenario", async () => {
    mockedGetGCPCredentials.mockResolvedValue("token de authentication");
    mockedGetGCPCredentials.mockReturnValue({ defaultProfile: "default" });
    const listMock = jest.fn().mockResolvedValue({ data: { timeSeries: [] } });
    google.monitoring = jest.fn().mockReturnValue({ v3: { projects: { timeSeries: { list: listMock } } } });

    const stats = await getCloudSQLStats("<id da instance>");

    expect(stats).toBeUndefined();
  });
});
