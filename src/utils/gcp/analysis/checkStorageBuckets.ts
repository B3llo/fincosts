import { Storage } from "@google-cloud/storage";
import { getGCPCredentials, readFincostsConfig } from "../credentials";

const storage = new Storage({
  projectId: readFincostsConfig().defaultProfile,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export async function analyzeBucketUsage() {
  const [buckets] = await storage.getBuckets();

  const bucketPromises = buckets.map(async (bucket) => {
    const [files] = await bucket.getFiles();
    const totalSize = files.reduce((sum, file) => sum + file.metadata.size, 0);
    const oldestFile: any = files.reduce(
      (oldest: { metadata: { timeCreated: number } }, file: { metadata: { timeCreated: number } }) => (file.metadata.timeCreated < oldest.metadata.timeCreated ? file : oldest),
      files[0]
    );
    const newestFile: any = files.reduce(
      (newest: { metadata: { updated: number } }, file: { metadata: { updated: number } }) => (file.metadata.updated > newest.metadata.updated ? file : newest),
      files[0]
    );

    return {
      bucketName: bucket.name,
      totalFiles: files.length,
      totalSize,
      oldestFile: oldestFile?.name,
      newestFile: newestFile?.name,
    };
  });

  const bucketStats = await Promise.all(bucketPromises);

  return bucketStats;
}

analyzeBucketUsage()
  .then((bucketStats) => {
    console.log("Dados de armazenamento dos buckets:", bucketStats);
  })
  .catch(console.error);
