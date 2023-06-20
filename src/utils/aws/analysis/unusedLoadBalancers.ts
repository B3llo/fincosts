import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTagsCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFincostsConfig } from "../credentials";
import ora from "ora";

interface UnusedLoadBalancer {
  arn: string;
  name: string;
}

export const fetchUnusedLoadBalancers = async (): Promise<UnusedLoadBalancer[]> => {
  const { defaultProfile, defaultRegion } = readFincostsConfig();
  const AWSConfigs = { region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) };
  const elbv2 = new ElasticLoadBalancingV2Client(AWSConfigs);

  const spinner = ora("Fetching load balancers").start();

  try {
    const lbData = await elbv2.send(new DescribeLoadBalancersCommand({}));
    const loadBalancers = lbData.LoadBalancers || [];

    const lbArns = loadBalancers.map((lb: any) => lb.LoadBalancerArn || "");

    const unusedLoadBalancers: UnusedLoadBalancer[] = [];

    for (const lbArn of lbArns) {
      const tagsData = await elbv2.send(new DescribeTagsCommand({ ResourceArns: [lbArn] }));
      const tags = tagsData.TagDescriptions?.[0].Tags || [];

      const isUnused = !tags.some((tag: any) => tag.Key === "Name");

      if (isUnused) {
        const lbData = await elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [lbArn] }));
        const lbName = lbData.LoadBalancers?.[0]?.LoadBalancerName || "";
        unusedLoadBalancers.push({ arn: lbArn, name: lbName });
      }
    }

    spinner.succeed(`Found ${unusedLoadBalancers.length} unused load balancers`);
    return unusedLoadBalancers;
  } catch (error) {
    spinner.fail("Error fetching load balancers");
    throw error;
  }
};
