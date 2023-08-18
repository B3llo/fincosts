import { getDefaultRegion, listAvailableProfiles, readFincostsConfig, setAWSCredentials, setAWSRegion } from "./utils/aws/credentials";
import { AvailableProviders } from "./enums/availableProviders.enum";
import { fetchUnattachedEBSVolumes, fetchLowCPUInstances, fetchUnattachedEIPs, fetchUnusedNatGateways, fetchUnattachedENIs, fetchOldSnapshots } from "./utils/aws/analysis";
import { getCloudSQLStats, analyzeBucketUsage, fetchLowCPUInstancesGCP } from "./utils/gcp/analysis";
import { getDefaultRegion as getDefaultRegionGCP, listAvailableProfiles as listAvailableProfilesGCP, readFincostsConfig as readFincostsConfigGCP, setGCPCredentials, setGCPRegion } from "./utils/gcp/credentials";
import { getDefaultRegion as getDefaultRegionAzure, listAvailableProfiles as listAvailableProfilesAzure, readFincostsConfig as readFincostsConfigAzure, setAzureCredentials, setAzureRegion } from "./utils/azure/credentials";
import { fetchLowCPUInstancesAzure, analyzeBlobUsage, getAzureSQLStats } from "./utils/azure/analysis";
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

  switch (provider) {
    case "AWS":
      credentials = await listAvailableProfiles();
      break;
    case "GCP":
      credentials = await listAvailableProfilesGCP();
      break;
    case "Azure":
      credentials = await listAvailableProfilesAzure();
      break;
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

  switch (provider) {
    case "AWS":
      defaultRegion = readFincostsConfig().defaultRegion;
      break;
    case "GCP":
      defaultRegion = readFincostsConfigGCP().defaultRegion;
      break;
    case "Azure":
      defaultRegion = readFincostsConfigAzure().defaultRegion;
      break;
  }

  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "region",
      message: `\nWhich region do you want to use? (${defaultRegion})`,
      default: defaultRegion,
    },
  ]);

  switch (provider) {
    case "AWS":
      setAWSRegion(answer.region);
      break;
    case "GCP":
      setGCPRegion(answer.region);
      break;
    case "Azure":
      setAzureRegion(answer.region);
      break;
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

  switch (provider) {
    case "AWS":
      setAWSCredentials(credentialProfile);
      getDefaultRegion(credentialProfile);
      break;
    case "GCP":
      setGCPCredentials(credentialProfile);
      getDefaultRegionGCP(credentialProfile);
      break;
    case "Azure":
      setAzureCredentials(credentialProfile);
      getDefaultRegionAzure(credentialProfile);
      break;
  }

  await getRegion(provider);

  console.log("\n🧪", chalk.bold("Starting analysis..."));

  /* Analysis Functions */
  switch (provider) {
    case "AWS":
      await fetchLowCPUInstances();
      await fetchUnattachedEIPs();
      await fetchUnusedNatGateways();
      await fetchOldSnapshots();
      await fetchUnattachedEBSVolumes();
      await fetchUnattachedENIs();
      break;
    case "GCP":
      await getCloudSQLStats("5657281292773709007");
      await analyzeBucketUsage();
      await fetchLowCPUInstancesGCP();
      break;
    case "Azure":
      await fetchLowCPUInstancesAzure();
      await analyzeBlobUsage();
      await getAzureSQLStats();
      break;
  }
})().catch((error) => {
  console.log(chalk.red("\n✖", error.message));
  process.exit(1);
});
