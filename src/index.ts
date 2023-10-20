import { AvailableProviders } from "./enums/availableProviders.enum";
import inquirer from "inquirer";
import chalk from "chalk";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { performAnalysis as performAWSAnalysis } from "./providers/aws";
// import { performAnalysis as performGCPAnalysis } from "./providers/gcp";
import { performAnalysis as performAzureAnalysis } from "./providers/azure";
import { setAWSCredentials } from "./providers/aws/credentials";

const argv: any = yargs(hideBin(process.argv))
  .option("provider", {
    alias: "c",
    description: "Specify the cloud provider",
    type: "string",
    demandOption: true,
  })
  .option("profile", {
    alias: "p",
    description: "Specify the profile",
    type: "string",
    demandOption: true,
  })
  .option("generate-report", {
    alias: "r",
    description: "Generate a report",
    type: "boolean",
    default: false,
  })
  .help()
  .alias("help", "h").argv;

function ensureFincostsFileExists() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const fincostsPath = path.join(__dirname, ".fincosts");

  console.log(`Looking for .fincosts file at: ${fincostsPath}`);
  if (!fs.existsSync(fincostsPath)) {
    fs.writeFileSync(fincostsPath, "{}");
    console.log(chalk.green("Created a new .fincosts file."));
  }
}

export async function getProvider(): Promise<keyof typeof AvailableProviders> {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "cloudProvider",
      message: "\nWhich cloud provider do you want to analyze?",
      choices: Object.values(AvailableProviders),
    },
  ]);
  return answer.cloudProvider;
}

async function getDownloadReportPreference(): Promise<boolean> {
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "downloadReport",
      message: "Would you like to download the analysis report?",
    },
  ]);
  return answers.downloadReport;
}

async function generateReport(data: { labels: any; values: any } | undefined) {
  const content = `
    <html>
      <head>
        <title>Analysis Report</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body {
            font-family: Arial, sans-serif;
          }
          .chart-container {
            width: 400px;
            height: 400px;
            margin: auto;
          }
        </style>
      </head>
      <body>
        <h1 style="text-align: center;">Analysis Report</h1>
        
        <h2>Resource Distribution</h2>
        <div id="pie-chart-div" class="chart-container"></div>

        <h2>Number of Instances</h2>
        <div id="bar-chart-div" class="chart-container"></div>

      </body>
      <script>
        const pieCtx = document.getElementById('pie-chart-div').getContext('2d');
        const barCtx = document.getElementById('bar-chart-div').getContext('2d');

        new Chart(pieCtx, {
          type: 'pie',
          data: {
            labels: ${JSON.stringify(data?.labels)},
            datasets: [{
              data: ${JSON.stringify(data?.values)},
              backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(255, 205, 86, 0.5)'],
              borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 205, 86, 1)'],
              borderWidth: 1
            }]
          },
          options: {
            animation: {
                duration: 0
            }
          }
        });

        new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(data?.labels)},
            datasets: [{
              label: '# of Instances',
              data: ${JSON.stringify(data?.values)},
              backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(255, 205, 86, 0.5)'],
              borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 205, 86, 1)'],
              borderWidth: 1
            }]
          },
          options: {
            animation: {
                duration: 0
            }
          }
        });
      </script>
    </html>
  `;

  fs.writeFileSync("report.html", content);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`file://${path.resolve("report.html")}`, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    path: "report.pdf",
    printBackground: true,
  });

  await browser.close();
  console.log("Report has been generated as FinCosts_Analysis_Report.pdf");
}

(async () => {
  ensureFincostsFileExists();
  const provider = argv.provider || (await getProvider());
  const profile = argv.profile;

  profile != null && setAWSCredentials(profile);

  if (!Object.values(AvailableProviders).includes(provider)) {
    console.log("\n😞 Sorry, we currently do not support this provider");
    return;
  }

  console.log("👉  You selected", chalk.green(provider));
  console.log("\n🧪", chalk.bold("Starting analysis..."));

  try {
    switch (provider) {
      case AvailableProviders.AWS:
        profile != null ? await performAWSAnalysis(false) : await performAWSAnalysis(true);
        await performAWSAnalysis();
        break;
      // case AvailableProviders.GCP:
      //   await performGCPAnalysis();
      //   break;
      // case AvailableProviders.Azure:
      //   await performAzureAnalysis();
      //   break;
    }

    const downloadReport: boolean = argv["generate-report"] || (await getDownloadReportPreference());

    if (downloadReport) {
      const analysisData = {
        labels: ["Low Usage EC2", "Old EBS Snapshots", "Unattached EBS Volumes", "Unattached EIP", "Unattached ENI", "Unused Load Balancers", "Unused NAT Gateways"],
        values: [10, 15, 8, 5, 7, 2, 3],
      };
      await generateReport(analysisData);
    }
  } catch (error: any) {
    console.log(chalk.red("\n✖", error.message));
    process.exit(1);
  }
})();
