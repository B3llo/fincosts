import { EC2Client, DescribeVolumesCommand } from "@aws-sdk/client-ec2";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFincostsConfig } from "../credentials";
import ora from "ora";

interface UnattachedEBS {
  volumeId: string;
  availabilityZone: string;
}

export const fetchUnattachedEBSVolumes = async (): Promise<UnattachedEBS[]> => {
  const { defaultProfile, defaultRegion } = readFincostsConfig();
  const AWSConfigs = { region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) };
  const ec2 = new EC2Client(AWSConfigs);

  const spinner = ora("Found unattached EBS volumes").start();

  try {
    const params = {
      Filters: [
        {
          Name: "status",
          Values: ["available"],
        },
      ],
    };
    const data = await ec2.send(new DescribeVolumesCommand(params));
    let volumes = data.Volumes || [];

    volumes = volumes.filter((vol) => !vol.Attachments || vol.Attachments.length === 0);

    const unattachedEBSVolumes: UnattachedEBS[] = (volumes || []).map((vol) => ({
      volumeId: vol.VolumeId || "",
      availabilityZone: vol.AvailabilityZone || "",
    }));

    spinner.succeed(`Found ${unattachedEBSVolumes.length} unattached EBS volumes`);
    return unattachedEBSVolumes;
  } catch (error) {
    spinner.fail("Error fetching unattached EBS volumes");
    throw error;
  }
};

// export const deleteEBSVolume = async (volumeId: string) => {
//   const { defaultProfile, defaultRegion } = readFincostsConfig();
//   const AWSConfigs = { region: defaultRegion, credentials: fromIni({ profile: defaultProfile }) };
//   const ec2 = new EC2Client(AWSConfigs);

//   const spinner = ora(`Deleting EBS volume with ID ${volumeId}`).start();

//   try {
//     const params = {
//       VolumeId: volumeId,
//     };

//     await ec2.send(new DeleteVolumeCommand(params));

//     spinner.succeed(`Deleted EBS volume with ID ${volumeId}`);
//   } catch (error) {
//     spinner.fail(`Error deleting EBS volume with ID ${volumeId}`);
//     throw error;
//   }
// };
