import { loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";
import * as fs from "fs";
import * as os from "os";

interface FincostsConfig {
  defaultRegion?: string;
  defaultProfile?: string;
}

const FINCOSTS_FILE_PATH = `${os.homedir()}/.fincosts`;

export const readFincostsConfig = (): FincostsConfig => {
  const homeDir = os.homedir();
  const configFilePath = `${homeDir}/.fincosts`;

  let fileContents: string;
  try {
    fileContents = fs.readFileSync(configFilePath, { encoding: "utf-8" });
  } catch (err) {
    console.warn(`Could not read .fincosts file: ${err}`);
    return {
      defaultRegion: "",
      defaultProfile: "",
    };
  }

  let config: FincostsConfig;
  try {
    config = JSON.parse(fileContents);
  } catch (err) {
    console.warn(`Could not parse .fincosts file: ${err}`);
    return {
      defaultRegion: "",
      defaultProfile: "",
    };
  }

  return config;
};

function writeFincostsConfig(config: FincostsConfig) {
  fs.writeFileSync(FINCOSTS_FILE_PATH, JSON.stringify(config, null, 2));
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
