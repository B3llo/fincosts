import { EC2Client, DescribeNetworkInterfacesCommand, DeleteNetworkInterfaceCommand } from "@aws-sdk/client-ec2";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFincostsConfig } from "../credentials";
import ora from "ora";

export const fetchUnattachedENIs = async (): Promise<string[]> => {
  const { defaultProfile, defaultRegion } = readFincostsConfig();

  const AWSConfigs = { region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) };

  const ec2 = new EC2Client(AWSConfigs);

  const params = {
    Filters: [
      {
        Name: "status",
        Values: ["available"],
      },
    ],
  };

  const spinner = ora("Fetching unattached ENIs").start();

  try {
    const data = await ec2.send(new DescribeNetworkInterfacesCommand(params));
    const networkInterfaces = data.NetworkInterfaces || [];

    const eniIds = networkInterfaces.map((eni) => eni.NetworkInterfaceId || "");

    spinner.succeed(`Found ${eniIds.length} unattached ENIs`);

    return eniIds;
  } catch (err) {
    spinner.fail(`Failed to fetch unattached ENIs: ${err}`);
    throw err;
  }
};

export const deleteENI = async (eniId: string) => {
  const { defaultProfile, defaultRegion } = readFincostsConfig();

  const AWSConfigs = { region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) };

  const ec2 = new EC2Client(AWSConfigs);

  const params = {
    NetworkInterfaceId: eniId,
  };

  const spinner = ora(`Deleting ENI ${eniId}`).start();

  try {
    await ec2.send(new DeleteNetworkInterfaceCommand(params));
    spinner.succeed(`Successfully deleted ENI ${eniId}`);
  } catch (err) {
    spinner.fail(`Failed to delete ENI ${eniId}: ${err}`);
    throw err;
  }
};
