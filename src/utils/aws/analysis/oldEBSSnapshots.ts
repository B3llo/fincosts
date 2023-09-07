import { EC2Client, DescribeSnapshotsCommand } from "@aws-sdk/client-ec2";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFincostsConfig } from "../credentials";
import ora from "ora";

const OLD_SNAPSHOT_DAYS = 365;

interface OldSnapshot {
  snapshotId: string;
  volumeId: string;
  startTime: Date;
}

export const fetchOldSnapshots = async (): Promise<OldSnapshot[]> => {
  const { defaultProfile, defaultRegion } = readFincostsConfig();
  const AWSConfigs = { region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) };
  const ec2 = new EC2Client(AWSConfigs);

  const spinner = ora(`Fetching snapshots older than ${OLD_SNAPSHOT_DAYS} days`).start();

  try {
    const date = new Date();
    date.setDate(date.getDate() - OLD_SNAPSHOT_DAYS);

    const params = {
      Filters: [
        {
          Name: "start-time",
          Values: [date.toISOString()],
        },
      ],
    };
    //

    const data = await ec2.send(new DescribeSnapshotsCommand(params));
    const snapshots = data.Snapshots || [];

    const oldSnapshots: OldSnapshot[] = snapshots.map((snapshot) => ({
      snapshotId: snapshot.SnapshotId || "",
      volumeId: snapshot.VolumeId || "",
      startTime: snapshot.StartTime || new Date(),
    }));

    spinner.succeed(`Found ${oldSnapshots.length} snapshots older than ${OLD_SNAPSHOT_DAYS} days`);
    return oldSnapshots;
  } catch (error) {
    spinner.fail(`Error fetching snapshots older than ${OLD_SNAPSHOT_DAYS} days`);
    throw error;
  }
};
