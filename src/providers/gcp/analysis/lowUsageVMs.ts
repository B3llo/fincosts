import { google } from "googleapis";
import { getGCPCredentials, readFincostsConfig } from "../credentials";

const LOW_CPU_THRESHOLD = 40;

async function getCompute() {
  const authClient: any = await getGCPCredentials();
  google.options({ auth: authClient });

  return google.compute("v1");
}

async function getMonitoring() {
  const authClient: any = await getGCPCredentials();
  google.options({ auth: authClient });

  return google.monitoring("v3");
}

export async function fetchLowCPUInstancesGCP() {
  const compute = await getCompute();
  const monitoring = await getMonitoring();

  const config = readFincostsConfig();
  const projectId = config.defaultProfile;

  const result = await compute.instances.aggregatedList({
    project: projectId,
  });

  const vms = result.data.items;

  const lowCPUInstances = [];
  for (const zone in vms) {
    const instances = vms[zone].instances;
    if (instances) {
      for (const instance of instances) {
        const instanceId = instance.id;
        const request = {
          name: `projects/${projectId}`,
          filter: `metric.type="compute.googleapis.com/instance/cpu/utilization" AND
                  resource.type="gce_instance" AND
                  resource.labels.instance_id="${instanceId}" AND
                  resource.labels.zone.endsWith(zone)`,
          interval: {
            startTime: {
              seconds: Date.now() / 1000 - 28 * 24 * 60 * 60,
            },
            endTime: {
              seconds: Date.now() / 1000,
            },
          },
          aggregation: {
            alignmentPeriod: {
              seconds: 86400,
            },
            perSeriesAligner: "ALIGN_MEAN",
          },
        };
        const timeSeries: any = await monitoring.projects.timeSeries.list(request);
        if (timeSeries.data.timeSeries && timeSeries.data.timeSeries.length > 0) {
          const cpuUtilization: any = timeSeries.data.timeSeries[0].points[0].value.doubleValue;
          if (cpuUtilization < LOW_CPU_THRESHOLD) {
            lowCPUInstances.push({
              instanceId: instance.id,
              instanceName: instance.name,
              cpuUsage: cpuUtilization,
            });
          }
        }
      }
    }
  }
  console.log(`Found ${lowCPUInstances.length} low CPU instances`);
  return lowCPUInstances;
}

fetchLowCPUInstancesGCP()
  .then((lowCPUInstances) => {
    console.log("Low CPU Instances:", lowCPUInstances);
  })
  .catch(console.error);
