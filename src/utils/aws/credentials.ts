import { loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";
import * as fs from "fs";
import * as os from "os";

interface FincostsConfig {
  defaultProfile?: string;
  defaultRegion?: string;
  misusedResources?: {
    EC2?: number;
    RDS?: number;
    EBS?: number;
  };
}

const FINCOSTS_FILE_PATH = `${os.homedir()}/.fincosts`;

export const readFincostsConfig = (): FincostsConfig => {
  let fileContents: string;
  try {
    fileContents = fs.readFileSync(FINCOSTS_FILE_PATH, { encoding: "utf-8" });
  } catch (err) {
    console.warn(`Could not read .fincosts file: ${err}`);
    return {
      defaultRegion: "",
      defaultProfile: "",
      misusedResources: {},
    };
  }

  let config: FincostsConfig;
  try {
    config = JSON.parse(fileContents).aws || {};
  } catch (err) {
    console.warn(`Could not parse .fincosts file: ${err}`);
    return {
      defaultRegion: "",
      defaultProfile: "",
      misusedResources: {},
    };
  }

  return config;
};

function writeFincostsConfig(config: FincostsConfig) {
  let globalConfig: any;
  try {
    globalConfig = JSON.parse(fs.readFileSync(FINCOSTS_FILE_PATH, { encoding: "utf-8" }));
  } catch (err) {
    globalConfig = {};
  }

  globalConfig.aws = config;
  fs.writeFileSync(FINCOSTS_FILE_PATH, JSON.stringify(globalConfig, null, 2));
}

export async function listAvailableProfiles() {
  return await loadSharedConfigFiles();
}

export async function getDefaultRegion(profileName: string) {
  const credentials = await loadSharedConfigFiles();
  const defaultRegion = readFincostsConfig().defaultRegion || credentials.configFile[profileName]?.region || "us-east-1";

  writeFincostsConfig({ ...readFincostsConfig(), defaultRegion });

  return defaultRegion;
}

export const setAWSCredentials = (profileName: string): void => {
  writeFincostsConfig({ ...readFincostsConfig(), defaultProfile: profileName });
};

export const setAWSRegion = (region: string): void => {
  writeFincostsConfig({ ...readFincostsConfig(), defaultRegion: region });
};
