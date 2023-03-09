import fs from "fs/promises";
import path from "path";
import os from "os";
import { fileExists } from "./fs.js";
import { KnownError } from "./error.js";

const awsCredentialsPath = path.join(os.homedir(), ".aws/credentials");

const parseAssert = (name: string, condition: any, message: string) => {
  if (!condition) {
    throw new KnownError(`Invalid config property ${name}: ${message}`);
  }
};

const configParsers = {
  AWS_ACCESS_KEY_ID(key: string) {
    parseAssert("AWS_ACCESS_KEY_ID", key, "Cannot be empty");
    return key;
  },
  AWS_SECRET_ACCESS_KEY(key: string) {
    parseAssert("AWS_SECRET_ACCESS_KEY", key, "Cannot be empty");
    return key;
  },
  AWS_ACCESS_KEYS(key: string) {
    parseAssert("AWS_ACCESS_KEYS", key.startsWith("AKIA"), "Must start with AKIA");
    return key;
  },
} as const;

type ValidKeys = keyof typeof configParsers;
type ConfigType = {
  [key: string]: ReturnType<typeof configParsers[keyof typeof configParsers]> | any;
};

export const getCredentials = async (): Promise<ConfigType> => {
  const configExists = await fileExists(awsCredentialsPath);
  if (!configExists) {
    return {};
  }

  const configString = await fs.readFile(awsCredentialsPath, "utf8");
  const config: ConfigType = {};

  let currentProfile: string | null = null;

  for (const line of configString.split("\n")) {
    if (line.startsWith("[") && line.endsWith("]")) {
      currentProfile = line.substring(1, line.length - 1);
      config[currentProfile] = {};
    } else if (currentProfile !== null && line.includes("=")) {
      const [key, value] = line.split("=");

      // if (!hasOwn(configParsers, key)) {
      //   console.log("Line: " + key + " " + value, "\n\n", line);
      //   throw new KnownError(`Invalid config property: ${key}`);
      // }

      // const parsed = configParsers[key as ValidKeys](value.trim());
      // config[currentProfile][key] = parsed as any;
      config[currentProfile][key] = value;
    }
  }

  return config;
};

const { hasOwnProperty } = Object.prototype;
const hasOwn = (object: unknown, key: PropertyKey) => hasOwnProperty.call(object, key);
