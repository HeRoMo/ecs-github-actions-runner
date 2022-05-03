import { IMachineImage, InstanceType } from 'aws-cdk-lib/aws-ec2';
import * as config from 'config';

/**
 * Definitions of Configuration
 */
export interface ConfigDefinition {
  /**
   * region to deploy
   */
  region?: string;
  /**
   * Github Actions Runner ECS cluster name
   */
  clusterName: string;
  /**
   * Memory limit of Github Actions Runner container
   */
  memoryLimitMiB: number;
  /**
   * EC2 Cluster node configuration
   */
  ec2Nodes?: { [key: string]: Ec2NodeConfig };
  /**
   * Fargate configuration
   */
  fargate?: FargateConfig;
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
 * Configuration of the EC2 cluster node.
 */
export interface Ec2NodeConfig {
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
 * Fargate spec configuration
 *
 * @link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs.FargateTaskDefinition.html#cpu
 */
export interface FargateConfig {
  /**
   * enable Fargate capacity provider;
   */
  enable: boolean;
  /**
   * The number of cpu units used by the task.
   */
  cpu: 256|512|1024|2048|4096;
  /**
   * The amount (in MiB) of memory used by the task.
   */
  memoryLimitMiB: 512|1024|2048|3072|4096|5120|6144|7168|8192|16384|30720;
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
   * region to deploy
   */
  public readonly region: string;
  /**
   * Github Actions Runner ECS cluster name
   */
  public readonly clusterName: string;
  /**
   * Memory limit of Github Actions Runner container
   */
  public readonly memoryLimitMiB: number;
  /**
   * EC2 Cluster node configuration
   */
  public readonly ec2Nodes: { [key: string]: Ec2NodeConfig };
  /**
   * Fargate configuration
   */
  public readonly fargate: FargateConfig;
  /**
   * Repogitory configuration
   */
  public readonly repo: RepoConfig;
  /**
   * AWS Secret Manager name of GITHUB_TOKEN
   */
  public readonly secretName: string;

  constructor() {
    this.region = config.get<string>('region');
    this.clusterName = config.get<string>('clusterName');
    this.memoryLimitMiB = config.get<number>('memoryLimitMiB');
    this.ec2Nodes = config.get<{ [key: string]: Ec2NodeConfig }>('ec2Nodes');
    this.fargate = config.get<FargateConfig>('fargate');
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
