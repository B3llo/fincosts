import ora from "ora";
import { fetchLowCPUInstances } from "./analysis";

export async function analyzeEC2Instances() {
  const spinner = ora("Finding instances with low CPU usage...").start();

  try {
    const instances = await fetchLowCPUInstances();
    spinner.succeed(`Found ${instances.length} instances.`);
  } catch (error) {
    spinner.fail("Failed to fetch instances.");
    console.error(error);
  }
}
