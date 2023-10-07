import { readFincostsConfig, setAzureCredentials, setAzureRegion } from "./credentials";
import { analyzeBlobUsage, getAzureSQLStats, fetchLowCPUInstancesAzure, fetchUnattachedPublicIPs, analyzeDiskVolumes } from "./analysis";
import { CredentialUnavailableError } from "@azure/identity";

export async function performAnalysis(startAnalysis?: boolean): Promise<void> {
  try {
    const config = readFincostsConfig();
    setAzureCredentials(config.defaultProfile || "");
    setAzureRegion(config.defaultRegion || "eastus");

    if (startAnalysis) {
      await fetchLowCPUInstancesAzure();
      await getAzureSQLStats();
      await analyzeBlobUsage();
      await fetchUnattachedPublicIPs();
      await analyzeDiskVolumes();
    }
  } catch (error: any) {
    if (error instanceof CredentialUnavailableError) {
      console.error("Azure authentication failed. Please check your credentials.");
    } else {
      console.error("Error with Azure analysis: ", error.message);
    }
  }
}
