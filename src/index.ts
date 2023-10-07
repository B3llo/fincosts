import { AvailableProviders } from "./enums/availableProviders.enum";
import inquirer from "inquirer";
import chalk from "chalk";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { performAnalysis as performAWSAnalysis } from "./providers/aws";
// import { performAnalysis as performGCPAnalysis } from "./providers/gcp";
// import { performAnalysis as performAzureAnalysis } from "./providers/azure";

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
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const content = `
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body>
        <h1>Analysis Report</h1>
        <div id="chart-div" style="width:400px; height:400px;"></div>
      </body>
      <script>
        // Initialize Chart.js here
        const ctx = document.getElementById('chart-div').getContext('2d');
        const myChart = new Chart(ctx, {
          type: 'bar', // or 'line', 'pie', etc.
          data: {
            labels: ${JSON.stringify(data?.labels)},
            datasets: [{
              label: '# of Instances',
              data: ${JSON.stringify(data?.values)},
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      </script>
    </html>
  `;

  await page.setContent(content);
  await page.pdf({ path: "AnalysisReport.pdf", format: "A4" });

  await browser.close();
  console.log("Report has been generated as AnalysisReport.pdf");
}

(async () => {
  ensureFincostsFileExists();
  const provider = await getProvider();

  if (!Object.values(AvailableProviders).includes(provider)) {
    console.log("\n😞 Sorry, we currently do not support this provider");
    return;
  }

  console.log("👉  You selected", chalk.green(provider));
  console.log("\n🧪", chalk.bold("Starting analysis..."));

  try {
    switch (provider) {
      case AvailableProviders.AWS:
        await performAWSAnalysis();
        break;
      // case AvailableProviders.GCP:
      //   await performGCPAnalysis();
      //   break;
      // case AvailableProviders.Azure:
      //   await performAzureAnalysis();
      //   break;
    }

    const downloadReport = await getDownloadReportPreference();

    if (downloadReport) {
      const analysisData = {
        labels: ["AWS", "GCP", "Azure"],
        values: [5, 3, 7], // Will be updated with actual values in the future
      };
      await generateReport(analysisData);
    }
  } catch (error: any) {
    console.log(chalk.red("\n✖", error.message));
    process.exit(1);
  }
})();
