import { google } from "googleapis";
import { getGCPCredentials, readFincostsConfig } from "../credentials";

const monitoring = google.monitoring("v3");

export async function getCloudSQLStats(instanceId: string) {
  const auth = await getGCPCredentials();
  const projectId = readFincostsConfig().defaultProfile;
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);

  const request: any = {
    name: `projects/${projectId}`,
    auth: auth,
    filter: `metric.type="cloudsql.googleapis.com/database/cpu/utilization" AND resource.label.database_id = "${instanceId}"`,
    interval: {
      startTime: {
        seconds: oneWeekAgo.getTime() / 1000,
      },
      endTime: {
        seconds: now.getTime() / 1000,
      },
    },
    aggregation: {
      alignmentPeriod: {
        seconds: 24 * 60 * 60, // one day
      },
      perSeriesAligner: "ALIGN_MEAN",
    },
  };

  const response = monitoring.projects.timeSeries.list(request);
  const timeSeries: any = (await response).data.timeSeries;

  if (timeSeries && timeSeries.length > 0) {
    return timeSeries[0].points.map((point: { interval: { endTime: { seconds: any } }; value: { doubleValue: any } }) => ({
      timestamp: point.interval.endTime.seconds,
      cpuUtilization: point.value.doubleValue,
    }));
  } else {
    console.log(`Não foi possível encontrar dados de uso de CPU para o Cloud SQL ${instanceId}`);
  }
}
