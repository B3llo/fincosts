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

async function generateReport(data: any): Promise<void> {
  console.log(data.costEffects.map((effect: any) => effect.type)); // Should log an array of labels (strings)
  console.log(data.costEffects.map((effect: any) => effect.costEffect)); // Should log an array of numbers

  const filteredChartData = data.values.map((item: any) => ({ label: item.type, count: item.data.length })).filter((item: any) => item.count > 0);

  const resourceDetails = data.values
    .map((item: any) => {
      const regex = /[a-zA-Z0-9]+-[a-zA-Z0-9]+|\d+\.\d+\.\d+\.\d+/;
      const ids = item.data
        .map((i: any) => i.instanceId || i.publicIp || i.allocationId || i)
        .filter((id: any) => regex.test(id))
        .join("<br>");

      return ids.length > 0 ? `<strong>${item.type}:</strong><br>${ids}` : "";
    })
    .filter((detail: string) => detail.length > 0)
    .join("<br>");

  const labels = filteredChartData.map((item: any) => item.label);
  const counts = filteredChartData.map((item: any) => item.count);
  const polarLabels = data.costEffects.map((effect: any) => effect.type);
  const polarcostEffects = data.costEffects.map((effect: any) => effect.costEffect);

  const content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Detailed Analysis Report</title>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Roboto', sans-serif;
              background: #f7f7f7;
              color: #333;
              line-height: 1.6;
            }
            .container {
              max-width: 1200px; 
              margin: 20px auto;
              padding: 20px;
              background: #fff;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
            }
            h1 {
              text-align: center;
              color: #333;
              margin-bottom: 20px;
            }
            .chart-container {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-around;
              gap: 20px;
            }
            .chart-box {
              flex: 1;
              min-width: 300px;
              padding: 20px;
              background: #f4f4f4;
              border-radius: 8px;
              box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
            }
            h2 {
              margin-bottom: 10px;
              text-align: center;
              color: #0275d8;
            }
            canvas {
              display: block;
              max-width: 100%;
            }
            .savings-highlight {
              text-align: center;
              color: #28a745;
              font-weight: bold;
              padding: 10px;
              margin-top: 10px;
              background-color: #e8f5e9;
              border-radius: 8px;
              box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
            }
            @media screen and (max-width: 768px) {
              .chart-container {
                flex-direction: column;
                align-items: center;
              }
              .chart-box {
                width: 90%;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
          <h1>Detailed Analysis Report</h1>

          <div class="chart-container">
            <div class="chart-box">
              <h2>Unused Resources</h2>
              <canvas id="pie-chart"></canvas>
            </div>
           
            <div class="chart-box">
              <h2>Resources Count</h2>
              <canvas id="bar-chart"></canvas>
            </div>

            <div class="chart-box">
              <h2>Costs Mapping</h2>
              <canvas id="polar-chart"></canvas>
            </div>

            <div class="chart-box">
              <h2>Resource Details</h2>
              <div>${resourceDetails}</div>
            </div>
          </div>
          
          <div class="savings-highlight">
            &#x1F4B0; Potential Savings: <strong> (~) $${data.potencialSavings}/monthly</strong>
          </div>
        </div>

          <script>
            const pieChartCtx = document.getElementById('pie-chart').getContext('2d');
            const barChartCtx = document.getElementById('bar-chart').getContext('2d');
            const polarChartCtx = document.getElementById('polar-chart').getContext('2d');

            const colors = [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
              'rgba(100, 200, 100, 0.6)',
              'rgba(200, 100, 200, 0.6)',
            ];

            new Chart(pieChartCtx, {
              type: 'pie',
              data: {
                labels: ${JSON.stringify(labels)},
                datasets: [{
                  data: ${JSON.stringify(counts)},
                  backgroundColor: colors,
                  borderColor: colors.map((color) => color.replace('0.6', '1')),
                  borderWidth: 1
                }]
              }
            });

            new Chart(barChartCtx, {
              type: 'bar',
              data: {
                labels: ${JSON.stringify(labels)},
                datasets: [{
                  data: ${JSON.stringify(counts)},
                  label: '',
                  backgroundColor: colors,
                  borderColor: colors.map((color) => color.replace('0.6', '1')),
                  borderWidth: 1
                }]
              },
              options: {
                indexAxis: 'y',
              }
            });

            new Chart(polarChartCtx, {
              type: 'polarArea',
              data: {
                labels: ${JSON.stringify(polarLabels)},
                datasets: [{
                  data: ${JSON.stringify(polarcostEffects)},
                  backgroundColor: colors,
                  borderColor: colors.map(color => color.replace('0.6', '1')),
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
  await page.setViewport({ width: 1250, height: 1900 });

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
        break;
      default:
        throw new Error("Unsupported provider");
    }

    const downloadReport: boolean = argv["generate-report"] ? await getDownloadReportPreference() : true;

    if (argv["no-report"] || !downloadReport) {
      return;
    }

    if (downloadReport) {
      console.log(analysisData);
      await generateReport(analysisData);
    }
  } catch (error: any) {
    console.log(chalk.red("\n✖", error.message));
    process.exit(1);
  }
})();
