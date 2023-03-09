import { AvailableProviders } from "./enums/availableProviders.enum";
import inquirer from "inquirer";
import chalk from "chalk";
import { getCredentials } from "./utils/credentials";

export async function getProvider(): Promise<string> {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "cloudProvider",
      message: "Which cloud provider do you want to analyze?",
      choices: ["AWS", "GCP", "Azure"],
    },
  ]);

  return answer.cloudProvider;
}

export async function getCredentialProfile(): Promise<string> {
  const credentials = await getCredentials();
  const choices = Object.keys(credentials);

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "credentialProfile",
      message: "Which AWS credential profile do you want to use?",
      choices: choices,
    },
  ]);

  return answer.credentialProfile;
}

(async () => {
  let provider = await getProvider();

  if (!Object.values(AvailableProviders).includes(provider)) {
    console.log("\n😞 Sorry, we currently do not support this provider");
    return;
  }

  console.log("\n👉  You selected", chalk.green(provider) + "\n");

  if (provider === "AWS") {
    const credentialProfile = await getCredentialProfile();
    console.log("\n👉  Using AWS credential profile", chalk.green(credentialProfile));
  }

  console.log("\n🧪", chalk.bold("Starting analysis..."));
})().catch((error) => {
  console.log(chalk.red("✖", error.message));
  process.exit(1);
});
