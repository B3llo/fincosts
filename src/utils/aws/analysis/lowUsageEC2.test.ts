import { fetchLowCPUInstances } from "./lowUsageEC2";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { CloudWatch } from "@aws-sdk/client-cloudwatch";
import ora from "ora";

jest.mock("@aws-sdk/client-ec2");
jest.mock("@aws-sdk/client-cloudwatch");
jest.mock("ora");

describe("Fetch Low CPU Instances Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return low CPU instances", async () => {
    // Mock do EC2Client.send e CloudWatch.getMetricData
    EC2Client.prototype.send = jest.fn().mockResolvedValue({
      Reservations: [{ Instances: [{ InstanceId: "i-1234567890", InstanceType: "t2.micro" }] }],
      NextToken: undefined,
    });

    CloudWatch.prototype.getMetricData = jest.fn().mockResolvedValue({
      MetricDataResults: [{ Values: [10] }], // 10 is below the LOW_CPU_THRESHOLD, so it should be considered as low CPU instance
    });

    ora.prototype.start = jest.fn().mockReturnThis();
    ora.prototype.succeed = jest.fn();

    const lowCPUInstances = await fetchLowCPUInstances();

    expect(lowCPUInstances).toEqual([{ instanceId: "ami-03a6eaae9938c858c", instanceType: "t2.micro", cpuUsage: 10 }]);
  });

  test("should handle errors", async () => {
    EC2Client.prototype.send = jest.fn().mockRejectedValue(new Error("An error occurred"));

    ora.prototype.start = jest.fn().mockReturnThis();
    ora.prototype.fail = jest.fn();

    await expect(fetchLowCPUInstances()).rejects.toThrow("An error occurred");

    expect(ora.prototype.fail).toHaveBeenCalledWith("Failed to fetch low CPU instances");
  });
});
