import { ComputeManagementClient } from "@azure/arm-compute";
import { MetricsQueryClient } from "@azure/monitor-query";
import { DefaultAzureCredential } from "@azure/identity";
import ora from "ora";

const LOW_CPU_THRESHOLD = 40;

interface LowCPUInstance {
  instanceId: string;
  instanceType: string;
  cpuUsage: number;
}

const hasLowCPUUsage = async (resourceId: string, metricsQueryClient: MetricsQueryClient): Promise<number | undefined> => {
  const now = new Date();
  const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30days ago

  const metricResponse = await metricsQueryClient.queryResource(resourceId, ["Percentage CPU"], {
    aggregations: ["Average"],
    timespan: {
      startTime: startTime,
      endTime: now,
    },
  });

  const cpuData = metricResponse.metrics?.[0].timeseries?.[0].data;
  const cpuUtilization = cpuData?.[cpuData.length - 1]?.average;
  return cpuUtilization;
};

export const fetchLowCPUInstancesAzure = async (): Promise<LowCPUInstance[]> => {
  const spinner = ora("Fetching low CPU instances").start();

  try {
    const credential = new DefaultAzureCredential();
    const computeClient = new ComputeManagementClient(credential, "<your-subscription-id>");
    const metricsQueryClient = new MetricsQueryClient(credential);

    const vmList = await computeClient.virtualMachines.listAll();
    const lowCPUInstances: LowCPUInstance[] = [];

    for await (const vm of vmList) {
      const resourceId = vm.id!;
      const instanceType: any = vm.hardwareProfile!.vmSize;

      const cpuUtilization = await hasLowCPUUsage(resourceId, metricsQueryClient);

      if (cpuUtilization !== undefined && cpuUtilization < LOW_CPU_THRESHOLD) {
        lowCPUInstances.push({
          instanceId: resourceId,
          instanceType,
          cpuUsage: cpuUtilization,
        });
      }
    }

    spinner.succeed(`Found ${lowCPUInstances.length} low CPU instances`);
    return lowCPUInstances;
  } catch (error) {
    spinner.fail("Failed to fetch low CPU instances");
    console.error(error);
    throw error;
  }
};
