import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { CloudWatch } from "@aws-sdk/client-cloudwatch";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFincostsConfig } from "../credentials";
import ora from "ora";

const LOW_CPU_THRESHOLD = 40;

interface LowCPUInstance {
  instanceId: string;
  instanceType: string;
  cpuUsage: number;
}

interface CloudWatchInstance {
  hasLowCPU: boolean;
  avgCPUUtilization: any;
}

const hasLowCPUUsage = async (instance: any, cloudWatch: CloudWatch): Promise<CloudWatchInstance> => {
  const instanceId = instance.InstanceId;

  const metrics = [
    {
      Id: "m1",
      MetricStat: {
        Metric: {
          MetricName: "CPUUtilization",
          Namespace: "AWS/EC2",
          Dimensions: [{ Name: "InstanceId", Value: instanceId }],
        },
        Period: 86400,
        Stat: "Average",
      },
    },
    {
      Id: "m2",
      MetricStat: {
        Metric: {
          MetricName: "NetworkIn",
          Namespace: "AWS/EC2",
          Dimensions: [{ Name: "InstanceId", Value: instanceId }],
        },
        Period: 86400,
        Stat: "Average",
      },
    },
    {
      Id: "m3",
      MetricStat: {
        Metric: {
          MetricName: "CPUUtilization",
          Namespace: "AWS/EC2",
          Dimensions: [{ Name: "InstanceId", Value: instanceId }],
        },
        Period: 300,
        Stat: "Average",
      },
    },
  ];

  const now = new Date();
  const startTime = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000); // 28 days ago
  const endTime = now;

  const data = await cloudWatch.getMetricData({
    MetricDataQueries: metrics,
    StartTime: startTime,
    EndTime: endTime,
  });

  const cpuUtilization = data.MetricDataResults?.[0].Values?.[0];
  return { hasLowCPU: cpuUtilization !== undefined && cpuUtilization < LOW_CPU_THRESHOLD, avgCPUUtilization: cpuUtilization };
};

export const fetchLowCPUInstances = async (): Promise<LowCPUInstance[]> => {
  const spinner = ora("Fetching low CPU instances").start();

  try {
    const { defaultProfile, defaultRegion } = readFincostsConfig();

    const AWSConfigs = { region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) };

    const ec2 = new EC2Client(AWSConfigs);
    const cloudWatch = new CloudWatch(AWSConfigs);

    let instances: any[] | PromiseLike<any[]> = [];
    let nextToken: string | undefined;

    do {
      const params = {
        MaxResults: 1000,
        NextToken: nextToken,
      };

      const data = await ec2.send(new DescribeInstancesCommand(params));
      const reservations = data.Reservations || [];
      const reservationInstances = reservations.flatMap((r) => r.Instances) || [];
      instances = [...instances, ...reservationInstances];

      nextToken = data.NextToken;
    } while (nextToken);

    const lowCPUInstances: LowCPUInstance[] = [];
    for (const instance of instances) {
      const { hasLowCPU, avgCPUUtilization } = await hasLowCPUUsage(instance, cloudWatch);

      if (hasLowCPU) {
        lowCPUInstances.push({
          instanceId: instance.InstanceId,
          instanceType: instance.InstanceType,
          cpuUsage: avgCPUUtilization,
        });
      }
    }

    spinner.succeed(`Found ${lowCPUInstances.length} low CPU instances`);
    return lowCPUInstances;
  } catch (error) {
    spinner.fail("Failed to fetch low CPU instances");
    throw error;
  }
};
