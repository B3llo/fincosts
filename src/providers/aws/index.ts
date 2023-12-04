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

const resourceCosts = {
  LowCPUInstances: 0.24,
  UnattachedEIPs: 0.005,
  UnusedNatGateways: 0.045,
  OldSnapshots: 0.01,
  UnattachedEBSVolumes: 0.1,
  UnattachedENIs: 0.005,
  UnusedIPv4s: 0.004,
};

function calculateSavings(analysisData: any, resourceCosts: any) {
  let totalSavings = 0;

  analysisData.values.forEach((item: any) => {
    const resourceType = item.type;
    const costPerHour = resourceCosts[resourceType];
    if (costPerHour) {
      totalSavings += item.data.length * costPerHour * 24 * 30; // Cálculo para um mês
    }
  });

  return totalSavings.toFixed(2);
}

function calculateCostEffect(analysisResults: any, resourceCosts: any) {
  return analysisResults.map((item: any) => {
    const resourceType = item.type;
    const count = item.data.length;
    const costPerUnit = resourceCosts[resourceType] || 0;
    const totalCostEffect = count * costPerUnit;
    return {
      type: resourceType,
      costEffect: totalCostEffect,
    };
  });
}

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

    const costEffects = calculateCostEffect(analysisResults, resourceCosts);

    const analysisData = {
      labels: analysisResults.map((item) => item.type),
      values: analysisResults,
      costEffects: costEffects,
      potencialSavings: 0,
    };

    let totalSavings = calculateSavings(analysisData, resourceCosts);
    analysisData.potencialSavings = Number(totalSavings);

    return analysisData;
  } catch (error: any) {
    console.error("Error with AWS analysis: ", error.message);
    return analysisResults;
  }
}
