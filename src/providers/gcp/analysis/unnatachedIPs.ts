import { google } from "googleapis";
import { getGCPCredentials, readFincostsConfig } from "../credentials";

async function getCompute() {
  const authClient: any = await getGCPCredentials();
  google.options({ auth: authClient });

  return google.compute("v1");
}

export async function listUnattachedIPs() {
  const compute = await getCompute();

  const config = readFincostsConfig();
  const projectId = config.defaultProfile;
  const region = config.defaultRegion;

  const result = await compute.addresses.list({
    project: projectId,
    region: region,
  });

  const unattachedIPs = result.data.items?.filter((address) => address.status === "RESERVED");

  return unattachedIPs;
}

async function deleteUnattachedIPs() {
  const compute = await getCompute();

  const config = readFincostsConfig();
  const projectId = config.defaultProfile;
  const region = config.defaultRegion;

  const unattachedIPs: any = await listUnattachedIPs();

  for (const address of unattachedIPs) {
    await compute.addresses.delete({
      project: projectId,
      region: region,
      address: address.name,
    });
  }
}

listUnattachedIPs()
  .then((unattachedIPs) => {
    console.log("Unattached IPs:", unattachedIPs);

    deleteUnattachedIPs()
      .then(() => {
        console.log("All unattached IPs deleted");
      })
      .catch(console.error);
  })
  .catch(console.error);
