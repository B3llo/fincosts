import { getDefaultRegion, listAvailableProfiles, readFincostsConfig, setAWSCredentials, setAWSRegion } from "./utils/aws/credentials";
import { findLowCpuEC2Instances, findUnattachedEIPs, findUnusedNatGateways } from "./utils/aws/animations";
import { AvailableProviders } from "./enums/availableProviders.enum";
import inquirer from "inquirer";
import chalk from "chalk";
import { fetchUnattachedEBSVolumes } from "./utils/aws/analysis/unnatachedEBSVolumes";

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

export async function getCredentialProfile(): Promise<string> {
  const credentials = await listAvailableProfiles();
  const choices = Object.keys(credentials.credentialsFile);

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "credentialProfile",
      message: "\nWhich AWS credential profile do you want to use?",
      choices: choices,
    },
  ]);

  return answer.credentialProfile;
}

export async function getRegion() {
  const defaultRegion = readFincostsConfig().defaultRegion;
  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "region",
      message: `\nWhich region do you want to use? (${defaultRegion})`,
      default: defaultRegion,
    },
  ]);

  setAWSRegion(answer.region);
}

(async () => {
  let provider = await getProvider();

  if (!Object.values(AvailableProviders).includes(provider)) {
    console.log("\n😞 Sorry, we currently do not support this provider");
    return;
  }

  console.log("👉  You selected", chalk.green(provider));

  const credentialProfile = await getCredentialProfile();
  console.log("👉  Using AWS credential profile", chalk.green(credentialProfile));

  setAWSCredentials(credentialProfile);

  getDefaultRegion(credentialProfile);
  await getRegion();

  console.log("\n🧪", chalk.bold("Starting analysis..."));

  /* Analysis Functions */
  await findLowCpuEC2Instances();
  await findUnattachedEIPs();
  await findUnusedNatGateways();
  await fetchUnattachedEBSVolumes();
})().catch((error) => {
  console.log(chalk.red("\n✖", error.message));
  process.exit(1);
});
