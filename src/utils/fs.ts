import { PathLike } from "fs";
import fs from "fs/promises";

export const fileExists = async (path: PathLike) => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};
