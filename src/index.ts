import inquirer from "inquirer";
import chalk from "chalk";

export async function getProvider(): Promise<string> {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "cloudProvider",
      message: "Which cloud provider do you want to analyze?",
      choices: ["AWS", "GCP", "Azure"],
    },
  ]);

  return answer.cloudProvider;
}

(async () => {
  let provider = await getProvider();
  console.log("\u{1F449} You selected", chalk.green(provider));

  console.log("\n🚀", chalk.green("Starting analysis..."));
})().catch((error) => {
  console.log(chalk.red("✖", error.message));
  process.exit(1);
});
