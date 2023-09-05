import { DefaultAzureCredential } from "@azure/identity";
import { NetworkManagementClient } from "@azure/arm-network";
import { readFincostsConfig } from "../credentials";
import ora from "ora";

interface UnattachedPublicIP {
  ipAddress: string;
  id: string;
}

export const fetchUnattachedPublicIPs = async (): Promise<UnattachedPublicIP[]> => {
  const { defaultProfile, defaultRegion } = readFincostsConfig();

  if (!defaultProfile) {
    throw new Error("No default profile found in configuration.");
  }

  const credentials = new DefaultAzureCredential();
  const networkClient = new NetworkManagementClient(credentials, defaultProfile);

  const spinner = ora("Fetching unattached public IPs").start();

  try {
    const publicIPIterator = networkClient.publicIPAddresses.listAll();
    const unattachedPublicIPs: UnattachedPublicIP[] = [];

    for await (const ip of publicIPIterator) {
      if (!ip.ipConfiguration) {
        unattachedPublicIPs.push({
          ipAddress: ip.ipAddress || "",
          id: ip.id || "",
        });
      }
    }

    spinner.succeed(`Found ${unattachedPublicIPs.length} unattached public IPs`);

    return unattachedPublicIPs;
  } catch (err) {
    spinner.fail(`Failed to fetch unattached public IPs: ${err}`);
    throw err;
  }
};
