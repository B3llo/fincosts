import { EC2Client, DescribeVolumesCommand } from "@aws-sdk/client-ec2";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFincostsConfig } from "../credentials";

interface UnattachedEBS {
  volumeId: string;
  availabilityZone: string;
}

export const fetchUnattachedEBSVolumes = async (): Promise<UnattachedEBS[]> => {
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

  const data = await ec2.send(new DescribeVolumesCommand(params));
  let volumes = data.Volumes || [];

  volumes = volumes.filter((vol) => !vol.Attachments || vol.Attachments.length === 0);

  const unattachedEBSVolumes: UnattachedEBS[] = (volumes || []).map((vol) => ({
    volumeId: vol.VolumeId || "",
    availabilityZone: vol.AvailabilityZone || "",
  }));

  return unattachedEBSVolumes;
};
