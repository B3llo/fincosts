import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFincostsConfig } from "./credentials";

export const fetchAllInstances = async (): Promise<any[]> => {
  const { defaultProfile, defaultRegion } = readFincostsConfig();

  console.log("Fetching all instances", defaultProfile, defaultRegion);
  const ec2 = new EC2Client({ region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) });

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

  return instances;
};
