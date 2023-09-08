import { ComputeManagementClient } from "@azure/arm-compute";
import { DefaultAzureCredential } from "@azure/identity";
import { readFincostsConfig } from "../credentials";

const SUBSCRIPTION_ID = readFincostsConfig().defaultProfile; // Assuming your defaultProfile contains Subscription ID

const credential = new DefaultAzureCredential();
const subscriptionId = readFincostsConfig().defaultProfile || "";
const computeClient = new ComputeManagementClient(credential, subscriptionId);

export async function analyzeDiskVolumes() {
  const diskList = computeClient.disks.list();
  const allDisks: any[] = [];
  for await (const disk of diskList) {
    allDisks.push(disk);
  }

  const oversizedDisks = allDisks
    .map((disk: { diskSizeGB: number; diskStateSizeGB: number; name: any }) => {
      const provisionedSizeGB = disk.diskSizeGB || 0;
      const usedSizeGB = disk.diskStateSizeGB || 0; // This property may not exist in SDK, you may need to find the actual property
      const utilizationPercentage = (usedSizeGB / provisionedSizeGB) * 100;

      return {
        diskName: disk.name,
        provisionedSizeGB,
        usedSizeGB,
        utilizationPercentage,
      };
    })
    .filter((diskInfo: { utilizationPercentage: number }) => diskInfo.utilizationPercentage < 50); // Filtering disks with less than 50% utilization

  return oversizedDisks;
}

analyzeDiskVolumes()
  .then((oversizedDisks) => {
    console.log("Oversized Disk Volumes:", oversizedDisks);
  })
  .catch(console.error);
