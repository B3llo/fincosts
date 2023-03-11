import ora from "ora";
import { fetchLowCPUInstances } from "./analysis/lowUsageEC2";
import { fetchUnattachedEIPs } from "./analysis/unnatachedEIP";

export async function analyzeEC2Instances() {
  const spinner = ora("Finding instances with low CPU usage...").start();

  try {
    const instances = await fetchLowCPUInstances();
    spinner.succeed(`Found ${instances.length} instances with low CPU usage.`);
  } catch (error) {
    spinner.fail("Failed to fetch instances.");
    console.error(error);
  }
}

export async function findUnattachedEIPs() {
  const spinner = ora("Checking for unattached Elastic IP addresses...").start();

  try {
    const eips = await fetchUnattachedEIPs();
    spinner.succeed(`Found ${eips.length} unattached Elastic IP addresses.`);
  } catch (error) {
    spinner.fail("Failed to fetch Elastic IP addresses.");
    console.error(error);
  }
}
