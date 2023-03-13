import { EC2Client, DescribeSnapshotsCommand } from "@aws-sdk/client-ec2";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFincostsConfig } from "../credentials";
import ora from "ora";

export const fetchOldSnapshots = async (days: number): Promise<string[]> => {
  const { defaultProfile, defaultRegion } = readFincostsConfig();

  const AWSConfigs = { region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) };

  const ec2 = new EC2Client(AWSConfigs);

  const params = {
    Filters: [
      {
        Name: "status",
        Values: ["completed"],
      },
    ],
  };

  const spinner = ora("Fetching old snapshots...").start();

  try {
    const data = await ec2.send(new DescribeSnapshotsCommand(params));
    const snapshots = data.Snapshots || [];

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const oldSnapshots = snapshots.filter((snapshot: any) => {
      const startTime = new Date(snapshot.StartTime);
      const diffTime = today.getTime() - startTime.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= days;
    });

    const snapshotIds = oldSnapshots.map((snapshot) => snapshot.SnapshotId || "");

    spinner.succeed(`Found ${snapshotIds.length} old snapshots`);

    return snapshotIds;
  } catch (error) {
    spinner.fail("Failed to fetch old snapshots");
    throw error;
  }
};

// export const deleteSnapshot = async (snapshotId: string) => {
//   const { defaultProfile, defaultRegion } = readFincostsConfig();

//   const AWSConfigs = { region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) };

//   const ec2 = new EC2Client(AWSConfigs);

//   const params = {
//     SnapshotId: snapshotId,
//   };

//   const spinner = ora(`Deleting snapshot ${snapshotId}...`).start();

//   try {
//     await ec2.send(new DeleteSnapshotCommand(params));
//     spinner.succeed(`Deleted snapshot ${snapshotId}`);
//   } catch (error) {
//     spinner.fail(`Failed to delete snapshot ${snapshotId}`);
//     throw error;
//   }
// };
