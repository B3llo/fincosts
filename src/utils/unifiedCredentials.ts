import { loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";
import { GoogleAuth } from "google-auth-library";
import { DefaultAzureCredential } from "@azure/identity";
import * as fs from "fs";
import * as os from "os";

interface MisusedResources {
  EC2?: number;
  RDS?: number;
  EBS?: number;
  ComputeEngine?: number;
  CloudSQL?: number;
  PersistentDisk?: number;
  VirtualMachines?: number;
  SQLDatabases?: number;
  DiskStorage?: number;
}

interface ProviderConfig {
  defaultProfile?: string;
  defaultRegion?: string;
  misusedResources?: MisusedResources;
}

interface FincostsConfig {
  aws?: ProviderConfig;
  gcp?: ProviderConfig;
  azure?: ProviderConfig;
  defaultProfile?: string;
  defaultRegion?: string;
}

const FINCOSTS_FILE_PATH = `${os.homedir()}/.fincosts`;

export const readFincostsConfig = (provider: "aws" | "gcp" | "azure"): ProviderConfig => {
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
    config = JSON.parse(fileContents)[provider] || {};
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

function writeFincostsConfig(provider: "aws" | "gcp" | "azure", config: ProviderConfig) {
  let globalConfig: FincostsConfig;
  try {
    globalConfig = JSON.parse(fs.readFileSync(FINCOSTS_FILE_PATH, { encoding: "utf-8" }));
  } catch (err) {
    globalConfig = {};
  }

  globalConfig[provider] = config;
  fs.writeFileSync(FINCOSTS_FILE_PATH, JSON.stringify(globalConfig, null, 2));
}

// AWS Functions
export async function listAvailableAWSProfiles() {
  return await loadSharedConfigFiles();
}

export const setAWSCredentials = (profileName: string): void => {
  const config = readFincostsConfig("aws");
  config.defaultProfile = profileName;
  writeFincostsConfig("aws", config);
};

export const setAWSRegion = (region: string): void => {
  const config = readFincostsConfig("aws");
  config.defaultRegion = region;
  writeFincostsConfig("aws", config);
};

// GCP Functions
export async function listAvailableGCPProfiles(): Promise<string[]> {
  const config = readFincostsConfig("gcp");
  return config && typeof config === "object" ? Object.keys(config) : [];
}

export const setGCPCredentials = (profileName: string): void => {
  const config = readFincostsConfig("gcp");
  config.defaultProfile = profileName;
  writeFincostsConfig("gcp", config);
};

export const setGCPRegion = (region: string): void => {
  const config = readFincostsConfig("gcp");
  config.defaultRegion = region;
  writeFincostsConfig("gcp", config);
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

// Azure Functions
export async function listAvailableAzureProfiles(): Promise<string[]> {
  const config = readFincostsConfig("azure");
  return config && typeof config === "object" ? Object.keys(config) : [];
}

export const setAzureCredentials = (profileName: string): void => {
  const config = readFincostsConfig("azure");
  config.defaultProfile = profileName;
  writeFincostsConfig("azure", config);
};

export const setAzureRegion = (region: string): void => {
  const config = readFincostsConfig("azure");
  config.defaultRegion = region;
  writeFincostsConfig("azure", config);
};

export async function getAzureCredentials() {
  return new DefaultAzureCredential();
}
