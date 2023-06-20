import { google } from "googleapis";
import { getGCPCredentials, readFincostsConfig } from "../credentials";

async function getCompute() {
  const authClient: any = await getGCPCredentials();
  google.options({ auth: authClient });

  return google.compute("v1");
}

async function listUnattachedDisks() {
  const compute = await getCompute();

  const config = readFincostsConfig();
  const projectId = config.defaultProfile;

  const result = await compute.disks.aggregatedList({
    project: projectId,
  });

  const disks = [];
  for (const zone in result.data.items) {
    const zoneDisks = result.data.items[zone].disks;
    if (zoneDisks) {
      for (const disk of zoneDisks) {
        if (!disk.users || disk.users.length === 0) {
          disks.push({
            name: disk.name,
            zone: zone,
            size: disk.sizeGb,
            type: disk.type,
          });
        }
      }
    }
  }

  return disks;
}

async function deleteUnattachedDisks(disks: any) {
  const compute = await getCompute();

  const config = readFincostsConfig();
  const projectId = config.defaultProfile;

  for (const disk of disks) {
    await compute.disks.delete({
      project: projectId,
      zone: disk.zone,
      disk: disk.name,
    });
    console.log(`Deleted disk: ${disk.name}`);
  }
}

listUnattachedDisks()
  .then((disks) => {
    console.log("Unattached Disks:", disks);

    deleteUnattachedDisks(disks)
      .then(() => {
        console.log("All unattached disks deleted");
      })
      .catch(console.error);
  })
  .catch(console.error);
