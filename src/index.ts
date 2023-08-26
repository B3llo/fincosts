import { AvailableProviders } from "./enums/availableProviders.enum";
import { fetchUnattachedEBSVolumes, fetchLowCPUInstances, fetchUnattachedEIPs, fetchUnusedNatGateways, fetchUnattachedENIs, fetchOldSnapshots } from "./utils/aws/analysis";
import { getCloudSQLStats, analyzeBucketUsage, fetchLowCPUInstancesGCP } from "./utils/gcp/analysis";
// import { fetchLowCPUInstancesAzure, analyzeBlobUsage, getAzureSQLStats } from "./utils/azure/analysis";
import { listAvailableProfiles, readFincostsConfig, setCredentials, setRegion, getDefaultRegion } from "./utils/unifiedCredentials";
import inquirer from "inquirer";
import chalk from "chalk";
import puppeteer from "puppeteer";

export async function getProvider(): Promise<"aws" | "gcp" | "azure"> {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "cloudProvider",
      message: "\nWhich cloud provider do you want to analyze?",
      choices: Object.values(AvailableProviders), // Using the values directly
    },
  ]);
  return answer.cloudProvider.toLowerCase() as "aws" | "gcp" | "azure";
}

type AWSProfile = {
  credentialsFile: Record<string, unknown>;
};

export async function getCredentialProfile(provider: "aws" | "gcp" | "azure"): Promise<string> {
  const credentials = await listAvailableProfiles(provider);
  let choices: string[] = [];

  if (provider === "aws" && isAWSProfile(credentials)) {
    choices = Object.keys(credentials.credentialsFile);
  } else if (Array.isArray(credentials)) {
    choices = credentials;
  }

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "credentialProfile",
      message: `\nWhich ${provider.toUpperCase()} credential profile do you want to use?`, // Convert to uppercase for display
      choices: choices,
    },
  ]);

  return answer.credentialProfile;
}

function isAWSProfile(credentials: any): credentials is AWSProfile {
  return credentials && typeof credentials === "object" && "credentialsFile" in credentials;
}

export async function getRegion(provider: "aws" | "gcp" | "azure") {
  const defaultRegion = readFincostsConfig(provider).defaultRegion;
  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "region",
      message: `\nWhich region do you want to use? (${defaultRegion})`,
      default: defaultRegion,
    },
  ]);
  setRegion(provider, answer.region);
}

async function generateReport() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const content = `
    <html>
      <body>
        <h1>Analysis Report</h1>
        <div id="chart-div" style="width:400px; height:400px;"></div>
      </body>
      <script>
        // Your Chart.js code here to generate charts
        // You could use your analysis data to populate the charts
      </script>
    </html>
  `;

  await page.setContent(content);
  await page.pdf({ path: "AnalysisReport.pdf", format: "A4" });

  await browser.close();
  console.log("Report has been generated as AnalysisReport.pdf");
}

(async () => {
  const provider = await getProvider();

  if (!Object.values(AvailableProviders).includes(provider)) {
    console.log("\n😞 Sorry, we currently do not support this provider");
    return;
  }

  console.log("👉  You selected", chalk.green(provider));
  const credentialProfile = await getCredentialProfile(provider);
  console.log(`👉  Using ${provider} credential profile`, chalk.green(credentialProfile));
  setCredentials(provider, credentialProfile);
  getDefaultRegion(provider);
  await getRegion(provider);
  console.log("\n🧪", chalk.bold("Starting analysis..."));

  switch (provider) {
    case "aws":
      await fetchLowCPUInstances();
      await fetchUnattachedEIPs();
      await fetchUnusedNatGateways();
      await fetchOldSnapshots();
      await fetchUnattachedEBSVolumes();
      await fetchUnattachedENIs();
      break;
    case "gcp":
      await getCloudSQLStats("5657281292773709007");
      await analyzeBucketUsage();
      await fetchLowCPUInstancesGCP();
      break;
    case "azure":
      // await fetchLowCPUInstancesAzure();
      // await analyzeBlobUsage();
      // await getAzureSQLStats();
      break;
  }

  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "downloadReport",
      message: "Would you like to download the analysis report?",
    },
  ]);

  if (answers.downloadReport) {
    await generateReport();
  }
})().catch((error) => {
  console.log(chalk.red("\n✖", error.message));
  process.exit(1);
});
