import { readFincostsConfig, setGCPCredentials, setGCPRegion } from "./credentials";
import { GoogleAuth } from "google-auth-library";
import { analyzeBucketUsage, fetchLowCPUInstancesGCP, listUnattachedDisks, listUnattachedIPs } from "./analysis";

export async function performGCPAnalysis() {
  try {
    const config = readFincostsConfig();
    setGCPCredentials(config.defaultProfile || "");
    setGCPRegion(config.defaultRegion || "us-central1"); // Supondo "us-central1" como padrão

    await analyzeBucketUsage();
    await fetchLowCPUInstancesGCP();
    await listUnattachedDisks();
    await listUnattachedIPs();
  } catch (error: any) {
    if (error instanceof GoogleAuth) {
      console.error("GCP authentication failed. Please check your credentials.");
    } else {
      console.error("Error with GCP analysis: ", error.message);
    }
  }
}
