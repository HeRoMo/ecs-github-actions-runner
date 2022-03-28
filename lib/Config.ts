import { IMachineImage, InstanceType } from 'aws-cdk-lib/aws-ec2';
import * as config from 'config';

/**
 * Definitions of Configuration
 */
export interface ConfigDefinition {
  clusterName: string;
  memoryLimitMiB: number;
  nodes: { [key: string]: NodeConfig };
  repo: RepoConfig;
  secretName: string;
}

/**
 * Configuration of the cluster node.
 */
export interface NodeConfig {
  instanceType: InstanceType;
  machineImage: IMachineImage;
  spotPrice?: string; // maximum hourly price
  minCapacity?: number;
  maxCapacity?: number;
  sshKey?: string;
}

/**
 * Configuration of Github repository
 */
export interface RepoConfig {
  /**
   * Repository owner name
   */
  owner: string;
  /**
   * Repository name
   */
  name: string;
}

/**
 * Config of the stacks.
 */
class Config implements ConfigDefinition {
  public readonly clusterName: string;
  public readonly memoryLimitMiB: number;
  public readonly nodes: { [key: string]: NodeConfig };
  public readonly repo: RepoConfig;
  public readonly secretName: string;

  constructor() {
    this.clusterName = config.get<string>('clusterName');
    this.memoryLimitMiB = config.get<number>('memoryLimitMiB');
    this.nodes = config.get<{ [key: string]: NodeConfig }>('nodes');
    this.repo = config.get<RepoConfig>('repo');
    this.secretName = config.get<string>('secretName');
  }

  public get repositoryUrl() {
    return `https://github.com/${this.repo.owner}/${this.repo.name}`;
  }
}

const CONFIG = new Config();

export { CONFIG };
