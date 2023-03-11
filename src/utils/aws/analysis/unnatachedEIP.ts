import { EC2Client, DescribeAddressesCommand } from "@aws-sdk/client-ec2";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFincostsConfig } from "../credentials";

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
      {
        Name: "association-id",
        Values: [],
      },
    ],
  };

  const data = await ec2.send(new DescribeAddressesCommand(params));

  const unattachedEIPs: UnattachedEIP[] = (data.Addresses || []).map((addr) => ({
    publicIp: addr.PublicIp || "",
    allocationId: addr.AllocationId || "",
  }));

  return unattachedEIPs;
};
