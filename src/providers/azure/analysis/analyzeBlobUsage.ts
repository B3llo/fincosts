import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import ora from "ora";

interface BlobUsage {
  containerName: string;
  totalSizeInBytes: number;
}

export const analyzeBlobUsage = async (): Promise<BlobUsage[]> => {
  const spinner = ora("Analyzing Blob usage").start();

  try {
    const credential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient("<your-blob-service-endpoint>", credential);

    let blobUsage: BlobUsage[] = [];

    for await (const container of blobServiceClient.listContainers()) {
      const containerClient = blobServiceClient.getContainerClient(container.name);
      let totalSizeInBytes = 0;

      for await (const blob of containerClient.listBlobsFlat()) {
        const blobClient = containerClient.getBlobClient(blob.name);
        const properties = await blobClient.getProperties();
        totalSizeInBytes += properties.contentLength!;
      }

      blobUsage.push({
        containerName: container.name,
        totalSizeInBytes,
      });
    }

    spinner.succeed("Blob usage analysis completed");
    return blobUsage;
  } catch (error) {
    spinner.fail("Failed to analyze Blob usage");
    console.error(error);
    throw error;
  }
};
