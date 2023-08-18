import { DefaultAzureCredential } from "@azure/identity";
import * as fs from "fs";
import * as os from "os";

interface FincostsConfig {
  defaultProfile?: string;
  defaultRegion?: string;
  misusedResources?: {
    VM?: number;
    AzureSQL?: number;
    BlobStorage?: number;
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
    config = JSON.parse(fileContents).azure || {};
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

  globalConfig.azure = config;
  fs.writeFileSync(FINCOSTS_FILE_PATH, JSON.stringify(globalConfig, null, 2));
}

export async function listAvailableProfiles(): Promise<string[]> {
  const config = readFincostsConfig();

  if (config && typeof config === "object" && Object.keys(config).length > 0) {
    return Object.keys(config);
  }

  return [];
}

export async function getDefaultRegion(profileName: string) {
  return "eastus";
}

export const setAzureCredentials = (profileName: string): void => {
  const config = readFincostsConfig();
  config.defaultProfile = profileName;
  writeFincostsConfig(config);
};

export const setAzureRegion = (region: string): void => {
  const config = readFincostsConfig();
  config.defaultRegion = region;
  writeFincostsConfig(config);
};

export async function getAzureCredentials() {
  const credential = new DefaultAzureCredential();
  return credential;
}
