import { analyzeBlobUsage } from "./analyzeBlobUsage";
import { BlobServiceClient } from "@azure/storage-blob";
import ora from "ora";

jest.mock("@azure/storage-blob");
jest.mock("ora");

describe("Analyze Blob Usage Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return Blob usage", async () => {
    // Mock dos métodos necessários
    const getPropertiesMock = jest.fn().mockResolvedValue({ contentLength: 1000 });
    const getBlobClientMock = jest.fn().mockReturnValue({ getProperties: getPropertiesMock });
    const listBlobsFlatMock = jest.fn().mockResolvedValue([{ name: "blob1" }]);
    const getContainerClientMock = jest.fn().mockReturnValue({ listBlobsFlat: listBlobsFlatMock, getBlobClient: getBlobClientMock });
    const listContainersMock = jest.fn().mockResolvedValue([{ name: "container1" }]);
    BlobServiceClient.prototype.listContainers = listContainersMock;
    BlobServiceClient.prototype.getContainerClient = getContainerClientMock;

    ora.prototype.start = jest.fn().mockReturnThis();
    ora.prototype.succeed = jest.fn();

    const blobUsage = await analyzeBlobUsage();

    expect(blobUsage).toEqual([{ containerName: "container1", totalSizeInBytes: 1000 }]);
  });

  test("should handle errors", async () => {
    BlobServiceClient.prototype.listContainers = jest.fn().mockRejectedValue(new Error("An error occurred"));

    ora.prototype.start = jest.fn().mockReturnThis();
    ora.prototype.fail = jest.fn();

    await expect(analyzeBlobUsage()).rejects.toThrow("An error occurred");
    expect(ora.prototype.fail).toHaveBeenCalledWith("Failed to analyze Blob usage");
  });
});
