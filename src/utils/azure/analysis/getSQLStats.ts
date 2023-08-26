import { SqlManagementClient } from "@azure/arm-sql";
import { DefaultAzureCredential } from "@azure/identity";
import ora from "ora";

interface AzureSQLStats {
  serverName: string;
  databaseName: string;
  dtuUsage: number;
}

export const getAzureSQLStats = async (): Promise<AzureSQLStats[]> => {
  const spinner = ora("Fetching Azure SQL stats").start();

  try {
    const subscriptionId = "<your-subscription-id>";
    const resourceGroupName = "<your-resource-group-name>";
    const credential = new DefaultAzureCredential();
    const sqlManagementClient = new SqlManagementClient(credential, subscriptionId);

    let sqlStats: AzureSQLStats[] = [];

    const servers = await sqlManagementClient.servers.listByResourceGroup(resourceGroupName);

    for (const server of servers) {
      const databases = await sqlManagementClient.databases.listByServer(resourceGroupName, server.name!);

      for (const database of databases) {
        const dtuUsage = await sqlManagementClient.databases.get(resourceGroupName, server.name!, database.name!);

        sqlStats.push({
          serverName: server.name!,
          databaseName: database.name!,
          dtuUsage: dtuUsage.databaseUsage!.currentValue!,
        });
      }
    }

    spinner.succeed("Azure SQL stats fetched");
    return sqlStats;
  } catch (error) {
    spinner.fail("Failed to fetch Azure SQL stats");
    console.error(error);
    throw error;
  }
};
