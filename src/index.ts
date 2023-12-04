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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    demandOption: false,
    type: "boolean",
    default: false,
  })
  .option("no-report", {
    alias: "r",
    description: "Do not generate a report",
    demandOption: false,
    type: "boolean",
    default: false,
  })
  .help()
  .alias("help", "h").argv;

function ensureFincostsFileExists() {
  const __dirname = path.dirname(fileURLToPath(new URL(".", import.meta.url)));
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
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Detailed Analysis Report</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              margin: 0;
              padding: 0;
              background: #f7f7f7;
              color: #333;
            }
            .container {
              max-width: 1200px; 
              margin: 10px auto;
              background: white;
              padding: 20px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
            }
            h1 {
              text-align: center;
              color: #0275d8;
              margin-bottom: 40px;
            }
            .chart-container {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 20px;
              align-items: start;
              justify-content: center; 
            }
            .chart-box {
              width: 100%;
              padding: 20px;
            }
            h2 {
              color: #333;
              margin-bottom: 15px;
              font-size: 1.5em;
            }
            canvas {
              width: 100%;
              max-width: 100%;
              height: auto;
              margin: auto;
            }
            .savings-highlight {
              font-size: 1em;
              color: #28a745;
              font-weight: bold;
              padding: 20px;
              border-radius: 8px;
              background-color: #e8f5e9;
              margin: 20px auto;
              width: fit-content;
            }
            .savings-icon {
              font-size: 1em;
            }
            @media (max-width: 768px) {
              .chart-box {
                max-width: 100%;
              }
            }
            .savings-highlight {
              font-size: 2.5em;
              text-align: center;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Detailed Analysis Report</h1>
                    <div class="chart-container">
              <div class="chart-box">
                <h2>Unused Resources Distribution</h2>
                <canvas id="pie-chart-div"></canvas>
              </div>
              <div class="chart-box">
                <h2>Number of Instances</h2>
                <canvas id="bar-chart-div"></canvas>
              </div>
              <div class="chart-box">
                <h2>Usage Analysis</h2>
                <canvas id="line-chart-div"></canvas>
              </div>
              <div class="chart-box">
                <h2>Additional Data Analysis</h2>
                <canvas id="additional-chart-div"></canvas>
              </div>
            </div>

            <div class="savings-highlight">
              <span class="savings-icon">💰</span> Potential Savings: <strong>$1 Billion/month</strong>
            </div>

        <script>
          const pieCtx = document.getElementById('pie-chart-div').getContext('2d');
          const barCtx = document.getElementById('bar-chart-div').getContext('2d');
          const lineCtx = document.getElementById('line-chart-div').getContext('2d');
          const additionalCtx = document.getElementById('additional-chart-div').getContext('2d');

          const colors = [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)',
            'rgba(100, 200, 100, 0.5)',
            'rgba(200, 100, 200, 0.5)',
          ];

          const borderColor = colors.map(color => color.replace('0.5', '1'));


          new Chart(pieCtx, {
            type: 'bar',
            data: {
              labels: ${JSON.stringify(data?.labels)},
              datasets: [{
                data: ${JSON.stringify(data?.values)},
                backgroundColor: colors,
                borderColor: borderColor,
                borderWidth: 1
              }]
            }
          });

          new Chart(barCtx, {
            type: 'bar',
            data: {
              labels: ${JSON.stringify(data?.labels)},
              datasets: [{
                label: '# of Instances',
                data: ${JSON.stringify(data?.values)},
                backgroundColor: colors,
                borderColor: borderColor,
                borderWidth: 1
              }]
            }
          });

          new Chart(lineCtx, {
            type: 'line',
            data: {
              labels: ${JSON.stringify(data?.labels)},
              datasets: [{
                label: 'Tendência de Uso',
                data: ${JSON.stringify(data?.values)},
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: true,
              }]
            }
          });

          new Chart(additionalCtx, {
            type: 'radar',
            data: {
              labels: ${JSON.stringify(data?.labels)},
              datasets: [{
                data: ${JSON.stringify(data?.values)},
                backgroundColor: ['rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)'],
                borderColor: ['rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
                borderWidth: 1
              }]
            }
          });

        </script>
      </body>
    </html>
  `;

  const filePath = path.join(__dirname, "report.html");
  fs.writeFileSync(filePath, content);

  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1250, height: 1850 });

  await page.goto(`file://${filePath}`, { waitUntil: "networkidle0" });

  await page.waitForFunction(() => {
    const chartElements = document.querySelectorAll("canvas");
    return Array.from(chartElements).every((chart) => chart.offsetHeight > 0 && chart.offsetWidth > 0);
  });

  await page.pdf({
    path: "AnalysisReport.pdf",
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  console.log("Report has been generated as AnalysisReport.pdf");
}

function calculateSavings(
  analysisData: { unusedEC2Instances: number; unusedEBSVolumes: number },
  resourceCosts: { EC2: { unusedInstance: number }; EBS: { unusedVolume: number } }
) {
  let totalSavings = 0;

  if (analysisData.unusedEC2Instances) {
    totalSavings += analysisData.unusedEC2Instances * resourceCosts.EC2.unusedInstance;
  }

  if (analysisData.unusedEBSVolumes) {
    totalSavings += analysisData.unusedEBSVolumes * resourceCosts.EBS.unusedVolume;
  }

  return totalSavings.toFixed(2);
}

(async () => {
  ensureFincostsFileExists();
  const provider = argv.provider;
  const profile = argv.profile;

  if (profile) setAWSCredentials(profile);

  if (!Object.values(AvailableProviders).includes(provider)) {
    console.log("\n😞 Sorry, we currently do not support this provider");
    return;
  }

  console.log("👉  You selected", chalk.green(provider));
  console.log("\n🧪", chalk.bold("Starting analysis..."));

  try {
    let analysisData: any;
    switch (provider) {
      case AvailableProviders.AWS:
        profile != null ? (analysisData = await performAWSAnalysis(false)) : (analysisData = await performAWSAnalysis(true));
        break;
      case AvailableProviders.GCP:
        break;
      case AvailableProviders.Azure:
        await performAzureAnalysis();
        break;
      default:
        throw new Error("Unsupported provider");
    }

    const downloadReport: boolean = argv["generate-report"] ? await getDownloadReportPreference() : true;

    if (argv["no-report"] || !downloadReport) {
      return;
    }

    if (downloadReport) {
      const reportData = {
        labels: ["EC2 Instances", "EBS Snapshots", "EBS Volumes", "EIP", "ENI", "Load Balancers", "NAT Gateways"],
        values: [10, 15, 8, 5, 7, 2, 3],
      };
      await generateReport(reportData);
    }
  } catch (error: any) {
    console.log(chalk.red("\n✖", error.message));
    process.exit(1);
  }
})();
