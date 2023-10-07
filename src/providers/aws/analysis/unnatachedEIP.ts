import { EC2Client, DescribeAddressesCommand } from "@aws-sdk/client-ec2";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFincostsConfig } from "../credentials";
import ora from "ora";

interface UnattachedEIP {
  publicIp: string;
  allocationId: string;
}

export const fetchUnattachedEIPs = async (): Promise<UnattachedEIP[]> => {
  const { defaultProfile, defaultRegion } = readFincostsConfig();

  const AWSConfigs = { region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) };

  const ec2 = new EC2Client(AWSConfigs);

  const params = {
    Filters: [
      {
        Name: "domain",
        Values: ["vpc"],
      },
    ],
  };

  const spinner = ora("Fetching unattached EIPs").start();

  try {
    const data = await ec2.send(new DescribeAddressesCommand(params));
    let eips = data.Addresses || [];

    eips = eips.filter((eip) => eip.AssociationId === undefined);

    const unattachedEIPs: UnattachedEIP[] = (eips || []).map((addr) => ({
      publicIp: addr.PublicIp || "",
      allocationId: addr.AllocationId || "",
    }));

    spinner.succeed(`Found ${unattachedEIPs.length} unattached EIPs`);

    return unattachedEIPs;
  } catch (err) {
    spinner.fail(`Failed to fetch unattached EIPs: ${err}`);
    throw err;
  }
};
