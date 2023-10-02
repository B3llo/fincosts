import { getProvider } from "./index";
import inquirer from "inquirer";
import { AvailableProviders } from "./enums/availableProviders.enum";

describe("Get Provider Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return a valid provider", async () => {
    inquirer.prompt = jest.fn().mockResolvedValue({ cloudProvider: "AWS" });

    const provider = await getProvider();

    expect(Object.values(AvailableProviders).map((provider) => provider.toLowerCase())).toContain(provider);

    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: "list",
        name: "cloudProvider",
        message: "\nWhich cloud provider do you want to analyze?",
        choices: Object.values(AvailableProviders),
      },
    ]);
  });
});
