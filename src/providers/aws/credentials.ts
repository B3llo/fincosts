import { loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";
import * as fs from "fs";
import inquirer from "inquirer";
import * as os from "os";

interface AWSFincostsConfig {
  defaultProfile?: string;
  defaultRegion?: string;
  misusedResources?: {
    EC2?: number;
    RDS?: number;
    EBS?: number;
  };
}

const FINCOSTS_FILE_PATH = `${os.homedir()}/.fincosts`;

const readGlobalFincostsConfig = (): any => {
  try {
    const content = fs.readFileSync(FINCOSTS_FILE_PATH, { encoding: "utf-8" });
    return JSON.parse(content);
  } catch (err) {
    return {};
  }
};

const writeGlobalFincostsConfig = (config: any) => {
  fs.writeFileSync(FINCOSTS_FILE_PATH, JSON.stringify(config, null, 2));
};

export const readFincostsConfig = (): AWSFincostsConfig => {
  const globalConfig = readGlobalFincostsConfig();
  return (
    globalConfig.aws || {
      defaultRegion: "",
      defaultProfile: "",
      misusedResources: {},
    }
  );
};

export async function listAvailableProfiles(): Promise<string> {
  const sharedConfigFiles = await loadSharedConfigFiles();

  const profileNames = Object.keys(sharedConfigFiles.credentialsFile);

  if (!profileNames.length) {
    return "";
  }

  if (profileNames.length === 1) {
    return profileNames[0];
  }

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "selectedProfile",
      message: "Choose a profile:",
      choices: profileNames,
    },
  ]);

  return answer.selectedProfile;
}

export async function getDefaultRegion(profileName: string) {
  const credentials = await loadSharedConfigFiles();
  const defaultRegion = readFincostsConfig().defaultRegion || credentials.configFile[profileName]?.region || "us-east-1";

  const updatedConfig = {
    ...readFincostsConfig(),
    defaultRegion,
  };
  writeGlobalFincostsConfig({ ...readGlobalFincostsConfig(), aws: updatedConfig });

  return defaultRegion;
}

export const setAWSCredentials = (profileName: string): void => {
  const updatedConfig = {
    ...readFincostsConfig(),
    defaultProfile: profileName,
  };
  writeGlobalFincostsConfig({ ...readGlobalFincostsConfig(), aws: updatedConfig });
};

export const setAWSRegion = (region: string): void => {
  const updatedConfig = {
    ...readFincostsConfig(),
    defaultRegion: region,
  };
  writeGlobalFincostsConfig({ ...readGlobalFincostsConfig(), aws: updatedConfig });
};
