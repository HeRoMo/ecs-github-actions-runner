import { IMachineImage, InstanceType } from 'aws-cdk-lib/aws-ec2';
import * as config from 'config';

export interface ConfigDefinition {
  clusterName: string;
  memoryLimitMiB: number;
  nodes: { [key: string]: NodeConfig };
  repositoryUrl: string;
  token: string;
}

export interface NodeConfig {
  instanceType: InstanceType;
  machineImage: IMachineImage;
  spotPrice?: string; // maximum hourly price
  minCapacity?: number;
  maxCapacity?: number;
  sshKey?: string;
}

const CONFIG: ConfigDefinition = {
  clusterName: config.get<string>('clusterName'),
  memoryLimitMiB: config.get<number>('memoryLimitMiB'),
  nodes: config.get<{ [key: string]: NodeConfig }>('nodes'),
  repositoryUrl: config.get<string>('repositoryUrl'),
  token: config.get<string>('token'),
};

export { CONFIG };
