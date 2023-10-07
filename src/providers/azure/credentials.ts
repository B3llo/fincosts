import { DefaultAzureCredential } from "@azure/identity";
import * as fs from "fs";
import * as os from "os";

interface AzureFincostsConfig {
  defaultProfile?: string;
  defaultRegion?: string;
  misusedResources?: {
    VM?: number;
    AzureSQL?: number;
    BlobStorage?: number;
  };
}

const FINCOSTS_FILE_PATH = `${os.homedir()}/.fincosts`;

function readGlobalFincostsConfig(): any {
  try {
    const content = fs.readFileSync(FINCOSTS_FILE_PATH, { encoding: "utf-8" });
    return JSON.parse(content);
  } catch (err) {
    console.warn(`Could not read .fincosts file: ${err}`);
    return {};
  }
}

function writeGlobalFincostsConfig(config: any) {
  fs.writeFileSync(FINCOSTS_FILE_PATH, JSON.stringify(config, null, 2));
}

export const readFincostsConfig = (): AzureFincostsConfig => {
  return (
    readGlobalFincostsConfig().azure || {
      defaultRegion: "eastus",
      defaultProfile: "",
      misusedResources: {},
    }
  );
};

export const setAzureCredentials = (profileName: string): void => {
  const updatedConfig = { ...readFincostsConfig(), defaultProfile: profileName };
  writeGlobalFincostsConfig({ ...readGlobalFincostsConfig(), azure: updatedConfig });
};

export const setAzureRegion = (region: string): void => {
  const updatedConfig = { ...readFincostsConfig(), defaultRegion: region };
  writeGlobalFincostsConfig({ ...readGlobalFincostsConfig(), azure: updatedConfig });
};

let azureCredential: any = null;

export async function getAzureCredentials() {
  if (!azureCredential) {
    azureCredential = new DefaultAzureCredential();
  }
  return azureCredential;
}
