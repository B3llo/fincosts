import { getDefaultRegion, listAvailableProfiles, readFincostsConfig, setAWSCredentials, setAWSRegion } from "./utils/aws/credentials";
import { AvailableProviders } from "./enums/availableProviders.enum";
import { fetchUnattachedEBSVolumes, fetchLowCPUInstances, fetchUnattachedEIPs, fetchUnusedNatGateways, fetchUnattachedENIs, fetchOldSnapshots } from "./utils/aws/analysis";
import { getCloudSQLStats, analyzeBucketUsage, fetchLowCPUInstancesGCP } from "./utils/gcp/analysis";
import {
  getDefaultRegion as getDefaultRegionGCP,
  listAvailableProfiles as listAvailableProfilesGCP,
  readFincostsConfig as readFincostsConfigGCP,
  setGCPCredentials,
  setGCPRegion,
} from "./utils/gcp/credentials";
import inquirer from "inquirer";
import chalk from "chalk";
export async function getProvider(): Promise<string> {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "cloudProvider",
      message: "\nWhich cloud provider do you want to analyze?",
      choices: ["AWS", "GCP", "Azure"],
    },
  ]);

  return answer.cloudProvider;
}

export async function getCredentialProfile(provider: string): Promise<string> {
  let credentials: any;

  if (provider === "AWS") {
    credentials = await listAvailableProfiles();
  } else if (provider === "GCP") {
    credentials = await listAvailableProfilesGCP();
  }

  const choices = Object.keys(credentials?.credentialsFile);

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "credentialProfile",
      message: `\nWhich ${provider} credential profile do you want to use?`,
      choices: choices,
    },
  ]);

  return answer.credentialProfile;
}

export async function getRegion(provider: string) {
  let defaultRegion;
  if (provider === "AWS") {
    defaultRegion = readFincostsConfig().defaultRegion;
  } else if (provider === "GCP") {
    defaultRegion = readFincostsConfigGCP().defaultRegion;
  }

  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "region",
      message: `\nWhich region do you want to use? (${defaultRegion})`,
      default: defaultRegion,
    },
  ]);

  if (provider === "AWS") {
    setAWSRegion(answer.region);
  } else if (provider === "GCP") {
    setGCPRegion(answer.region);
  }
}

(async () => {
  let provider = await getProvider();

  if (!Object.values(AvailableProviders).includes(provider)) {
    console.log("\n😞 Sorry, we currently do not support this provider");
    return;
  }

  console.log("👉  You selected", chalk.green(provider));

  const credentialProfile = await getCredentialProfile(provider);
  console.log(`👉  Using ${provider} credential profile`, chalk.green(credentialProfile));

  if (provider === "AWS") {
    setAWSCredentials(credentialProfile);
    getDefaultRegion(credentialProfile);
  } else if (provider === "GCP") {
    setGCPCredentials(credentialProfile);
    getDefaultRegionGCP(credentialProfile);
  }

  await getRegion(provider);

  console.log("\n🧪", chalk.bold("Starting analysis..."));

  /* Analysis Functions */
  if (provider === "AWS") {
    await fetchLowCPUInstances();
    await fetchUnattachedEIPs();
    await fetchUnusedNatGateways();
    await fetchOldSnapshots();
    await fetchUnattachedEBSVolumes();
    await fetchUnattachedENIs();
  } else if (provider === "GCP") {
    await getCloudSQLStats("5657281292773709007");
    await analyzeBucketUsage();
    await fetchLowCPUInstancesGCP();
    await checkCloudSQL();
  }
})().catch((error) => {
  console.log(chalk.red("\n✖", error.message));
  process.exit(1);
});
function checkCloudSQL() {
  throw new Error("Function not implemented.");
}
