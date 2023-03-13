import { CloudWatchClient, GetMetricStatisticsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeNatGatewaysCommand } from "@aws-sdk/client-ec2";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFincostsConfig } from "../credentials";

interface UnusedNATGateway {
  id: string;
  eip?: string;
}

export const fetchUnusedNatGateways = async (): Promise<UnusedNATGateway[]> => {
  const { defaultProfile, defaultRegion } = readFincostsConfig();

  const AWSConfigs = { region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) };

  const ec2 = new EC2Client(AWSConfigs);
  const cw = new CloudWatchClient(AWSConfigs);

  const natGatewaysParams = {};

  const natGatewaysData = await ec2.send(new DescribeNatGatewaysCommand(natGatewaysParams));

  const unusedNATGateways: UnusedNATGateway[] = [];

  for (const natGateway of natGatewaysData.NatGateways || []) {
    const natGatewayId = natGateway.NatGatewayId || "";
    const eipAllocationId = natGateway.NatGatewayAddresses?.[0]?.AllocationId;

    const metricsParams = {
      EndTime: new Date(),
      MetricName: "BytesOutToDestination",
      Namespace: "AWS/NATGateway",
      Period: 86400,
      StartTime: new Date(Date.now() - 86400 * 7 * 1000),
      Statistics: ["Average"],
      Dimensions: [{ Name: "NatGatewayId", Value: natGatewayId }],
    };

    const metricsData = await cw.send(new GetMetricStatisticsCommand(metricsParams));

    const averageBytesOutToDestination = metricsData.Datapoints?.[0]?.Average?.valueOf() || 0;

    if (averageBytesOutToDestination === 0) {
      unusedNATGateways.push({ id: natGatewayId, eip: eipAllocationId });
    }
  }

  return unusedNATGateways;
};
