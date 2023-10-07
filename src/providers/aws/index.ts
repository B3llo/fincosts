import { setAWSCredentials, setAWSRegion, getDefaultRegion, listAvailableProfiles } from "./credentials";
import { fetchUnattachedEBSVolumes, fetchLowCPUInstances, fetchUnattachedEIPs, fetchUnusedNatGateways, fetchUnattachedENIs, fetchOldSnapshots } from "./analysis";

export async function performAnalysis() {
  try {
    const credentialProfile = await listAvailableProfiles();

    setAWSCredentials(credentialProfile);

    const defaultRegion = await getDefaultRegion(credentialProfile);

    setAWSRegion(defaultRegion);

    await fetchLowCPUInstances();
    await fetchUnattachedEIPs();
    await fetchUnusedNatGateways();
    await fetchOldSnapshots();
    await fetchUnattachedEBSVolumes();
    await fetchUnattachedENIs();
  } catch (error: any) {
    console.error("Error with AWS analysis: ", error.message);
  }
}
