import { setAWSCredentials, setAWSRegion, getDefaultRegion, listAvailableProfiles } from "./credentials";
import {
  fetchUnattachedEBSVolumes,
  fetchLowCPUInstances,
  fetchUnattachedEIPs,
  fetchUnusedNatGateways,
  fetchUnattachedENIs,
  fetchOldSnapshots,
  fetchUnusedIPv4s,
} from "./analysis";

export async function performAnalysis(askCredential?: boolean) {
  let analysisResults: any[] = [];

  try {
    if (askCredential) {
      const credentialProfile = await listAvailableProfiles();
      setAWSCredentials(credentialProfile);
      const defaultRegion = await getDefaultRegion(credentialProfile);
      setAWSRegion(defaultRegion);
    }

    analysisResults.push({ type: "LowCPUInstances", data: await fetchLowCPUInstances() });
    analysisResults.push({ type: "UnattachedEIPs", data: await fetchUnattachedEIPs() });
    analysisResults.push({ type: "UnusedNatGateways", data: await fetchUnusedNatGateways() });
    analysisResults.push({ type: "OldSnapshots", data: await fetchOldSnapshots() });
    analysisResults.push({ type: "UnattachedEBSVolumes", data: await fetchUnattachedEBSVolumes() });
    analysisResults.push({ type: "UnattachedENIs", data: await fetchUnattachedENIs() });
    analysisResults.push({ type: "UnusedIPv4s", data: await fetchUnusedIPv4s() });

    const labels = analysisResults.map((item) => item.type);

    const analysisData = {
      labels: labels,
      values: analysisResults,
    };

    return analysisData;
  } catch (error: any) {
    console.error("Error with AWS analysis: ", error.message);
    return analysisResults;
  }
}
