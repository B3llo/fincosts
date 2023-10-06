export interface MisusedResources {
  EC2?: number;
  RDS?: number;
  EBS?: number;
  ComputeEngine?: number;
  CloudSQL?: number;
  PersistentDisk?: number;
  VM?: number;
  AzureSQL?: number;
  BlobStorage?: number;
}

export interface ProviderConfig {
  defaultProfile?: string;
  defaultRegion?: string;
  misusedResources?: MisusedResources;
}

export interface FincostsConfig {
  aws?: ProviderConfig;
  gcp?: ProviderConfig;
  azure?: ProviderConfig;
}
