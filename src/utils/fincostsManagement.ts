// import * as fs from "fs";
// import * as os from "os";
// import { FincostsConfig, ProviderConfig } from "../types/providerConfig";

// const FINCOSTS_FILE_PATH = `${os.homedir()}/.fincosts`;

// export const readProviderConfig = (provider: "aws" | "gcp" | "azure"): ProviderConfig => {
//   let fileContents: string;
//   try {
//     fileContents = fs.readFileSync(FINCOSTS_FILE_PATH, { encoding: "utf-8" });
//   } catch (err) {
//     console.warn(`Could not read .fincosts file: ${err}`);
//     return {
//       defaultRegion: "",
//       defaultProfile: "",
//       misusedResources: {},
//     };
//   }

//   let config: FincostsConfig;
//   try {
//     config = JSON.parse(fileContents)[provider] || {};
//   } catch (err) {
//     console.warn(`Could not parse .fincosts file: ${err}`);
//     return {
//       defaultRegion: "",
//       defaultProfile: "",
//       misusedResources: {},
//     };
//   }

//   return config;
// };

// export const writeProviderConfig = (provider: "aws" | "gcp" | "azure", config: ProviderConfig) => {
//   let globalConfig: FincostsConfig;
//   try {
//     globalConfig = JSON.parse(fs.readFileSync(FINCOSTS_FILE_PATH, { encoding: "utf-8" }));
//   } catch (err) {
//     globalConfig = {};
//   }

//   globalConfig[provider] = config;
//   fs.writeFileSync(FINCOSTS_FILE_PATH, JSON.stringify(globalConfig, null, 2));
// };
