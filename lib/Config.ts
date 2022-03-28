import { IMachineImage, InstanceType } from 'aws-cdk-lib/aws-ec2';
import * as config from 'config';

/**
 * Definitions of Configuration
 */
export interface ConfigDefinition {
  /**
   * Github Actions Runner ECS cluster name
   */
  clusterName: string;
  /**
   * Memory limit of Github Actions Runner container
   */
  memoryLimitMiB: number;
  /**
   * Cluster node configuration
   */
  nodes: { [key: string]: NodeConfig };
  /**
   * Repogitory configuration
   */
  repo: RepoConfig;
  /**
   * AWS Secret Manager name of GITHUB_TOKEN
   */
  secretName: string;
}

/**
 * Configuration of the cluster node.
 */
export interface NodeConfig {
  /**
   * Type of EC2 instance of cluster node.
   */
  instanceType: InstanceType;
  /**
   * Image of EC2 instance of cluster node.
   */
  machineImage: IMachineImage;
  /**
   * Maximum hourly spot price of EC2 instance of cluster node.
   */
  spotPrice?: string;
  /**
   * Minimum capacity of cluster.
   */
  minCapacity?: number;
  /**
   * Maximum capacity of cluster.
   */
  maxCapacity?: number;
  /**
   * SSH key to connect to cluster nodes.
   */
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
  /**
   * Github Actions Runner ECS cluster name
   */
  public readonly clusterName: string;
  /**
   * Memory limit of Github Actions Runner container
   */
  public readonly memoryLimitMiB: number;
  /**
   * Cluster node configuration
   */
  public readonly nodes: { [key: string]: NodeConfig };
  /**
   * Repogitory configuration
   */
  public readonly repo: RepoConfig;
  /**
   * AWS Secret Manager name of GITHUB_TOKEN
   */
  public readonly secretName: string;

  constructor() {
    this.clusterName = config.get<string>('clusterName');
    this.memoryLimitMiB = config.get<number>('memoryLimitMiB');
    this.nodes = config.get<{ [key: string]: NodeConfig }>('nodes');
    this.repo = config.get<RepoConfig>('repo');
    this.secretName = config.get<string>('secretName');
  }

  /**
   * URL of Github repogitory
   */
  public get repositoryUrl() {
    return `https://github.com/${this.repo.owner}/${this.repo.name}`;
  }
}

const CONFIG = new Config();

export { CONFIG };
