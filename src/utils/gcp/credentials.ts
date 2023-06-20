import { GoogleAuth } from "google-auth-library";
import * as fs from "fs";
import * as os from "os";

interface FincostsConfig {
  defaultProfile?: string;
  defaultRegion?: string;
  misusedResources?: {
    ComputeEngine?: number;
    CloudSQL?: number;
    PersistentDisk?: number;
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
    config = JSON.parse(fileContents).gcp || {};
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

  globalConfig.gcp = config;
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
  return "us-east1";
}

export const setGCPCredentials = (profileName: string): void => {
  const config = readFincostsConfig();
  config.defaultProfile = profileName;
  writeFincostsConfig(config);
};

export const setGCPRegion = (region: string): void => {
  const config = readFincostsConfig();
  config.defaultRegion = region;
  writeFincostsConfig(config);
};

export const setGCPApplicationCredentials = (credentialsPath: string): void => {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
};

export async function getGCPCredentials() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  return await auth.getClient();
}
