import { EC2Client, DescribeAddressesCommand } from "@aws-sdk/client-ec2";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFincostsConfig } from "../credentials";
import ora from "ora";

interface UnusedIPv4 {
  publicIp: string;
  allocationId: string;
}

export const fetchUnusedIPv4s = async (): Promise<UnusedIPv4[]> => {
  const { defaultProfile, defaultRegion } = readFincostsConfig();
  const AWSConfigs = { region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) };
  const ec2 = new EC2Client(AWSConfigs);

  const spinner = ora("Fetching unattached IPv4 addresses").start();

  try {
    const data = await ec2.send(new DescribeAddressesCommand({}));
    let addresses = data.Addresses || [];

    addresses = addresses.filter((addr) => addr.AssociationId === undefined);

    const unusedIPv4s: UnusedIPv4[] = (addresses || []).map((addr) => ({
      publicIp: addr.PublicIp || "",
      allocationId: addr.AllocationId || "",
    }));

    spinner.succeed(`Found ${unusedIPv4s.length} unattached IPv4 addresses`);

    return unusedIPv4s;
  } catch (err) {
    spinner.fail(`Failed to fetch unattached IPv4 addresses: ${err}`);
    throw err;
  }
};
