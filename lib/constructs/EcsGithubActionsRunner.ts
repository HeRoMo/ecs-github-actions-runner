import { AutoScalingGroup, TerminationPolicy } from 'aws-cdk-lib/aws-autoscaling';
import {
  Peer, Port, SecurityGroup, Vpc,
} from 'aws-cdk-lib/aws-ec2';
import {
  AsgCapacityProvider,
  Cluster,
  ClusterProps,
  ContainerImage,
  CpuArchitecture,
  Ec2TaskDefinition,
  FargateTaskDefinition,
  LogDriver,
  OperatingSystemFamily,
} from 'aws-cdk-lib/aws-ecs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

import { CONFIG, Ec2NodeConfig } from '../Config';

const GITHUB_RUNNER_IMAGE = 'ghcr.io/heromo/ecs-github-actions-runner:latest';

/**
 * Information of Github actions runner cluster.
 */
export interface EcsGithubActionsRunnerInfo {
  clusterName: string;
  containerName: string;
  ec2TaskDefFamily: string;
  ec2CapacityProviders: string[];
  fargateTaskDefFamilies: string[];
  subnets: string[];
  securityGroup: string;
}

/**
 * Constructer of ECS cluster for Github actions runner
 */
export class EcsGithubActionsRunner extends Construct {
  /**
   * ECS Cluster
   */
  public readonly cluster: Cluster;

  /**
   * Security Group of Cluster node
   */
  private readonly securityGroup: SecurityGroup;

  /**
   * Task definition family name
   */
  private readonly ec2TaskDefinitionFamily: string;

  /**
   * Container name of Github actions runnter.
   */
  private readonly runnerContainerName: string;

  /**
   * Capacity Provider names of Github actions runner cluster.
   */
  private readonly ec2CapacityProviders: string[] = [];

  /**
   * Fargate Task definition families
   */
  private readonly fargateTaskDefFamilies: string[] = [];

  /**
   * Constructor.
   *
   * @param scope Scope
   * @param clusterName Cluster name
   * @param vpc VPC instance
   */
  constructor(
    scope: Construct,
    private readonly clusterName: string,
    private readonly vpc: Vpc,
  ) {
    super(scope, clusterName);

    const clusterProps: ClusterProps = {
      clusterName: this.clusterName,
      vpc: this.vpc,
      enableFargateCapacityProviders: CONFIG.fargate.enable,
    };

    this.ec2TaskDefinitionFamily = `${this.clusterName}-ec2`;
    this.runnerContainerName = 'github-actions-runner';

    this.cluster = new Cluster(this, this.clusterName, clusterProps);
    this.securityGroup = this.createSecurityGroup();
    Object.entries(CONFIG.ec2Nodes || {}).forEach(([key, node]) => {
      const provider = this.addAsgCapacity(key, node);
      this.ec2CapacityProviders.push(provider.capacityProviderName);
    });

    const logGroup = new LogGroup(this, `${this.clusterName}-lg`, {
      logGroupName: `/ecs/${this.clusterName}`,
      retention: RetentionDays.ONE_WEEK,
    });

    if (Object.entries(CONFIG.ec2Nodes || {}).length > 0) {
      this.createEc2TaskDefinition(logGroup);
    }
    if (CONFIG.fargate.enable) {
      this.fargateTaskDefFamilies = this.createFargateTaskDefinitions(logGroup);
    }
  }

  /**
   * get Cluster infomation object.
   */
  public get clusterInfo(): EcsGithubActionsRunnerInfo {
    return {
      clusterName: this.clusterName,
      containerName: this.runnerContainerName,
      ec2TaskDefFamily: this.ec2TaskDefinitionFamily,
      ec2CapacityProviders: this.ec2CapacityProviders,
      fargateTaskDefFamilies: this.fargateTaskDefFamilies,
      subnets: this.vpc.publicSubnets.map((subnet) => subnet.subnetId),
      securityGroup: this.securityGroup.securityGroupId,
    };
  }

  /**
   * Create EC2Task Definition
   */
  private createEc2TaskDefinition(logGroup: LogGroup) {
    const taskDefinition = new Ec2TaskDefinition(this, `${this.clusterName}-td-ec2`, {
      family: this.ec2TaskDefinitionFamily,
    });

    const container = taskDefinition.addContainer('github-actions-runner', {
      containerName: this.runnerContainerName,
      memoryLimitMiB: CONFIG.memoryLimitMiB,
      image: ContainerImage.fromRegistry(GITHUB_RUNNER_IMAGE),
      logging: LogDriver.awsLogs({
        logGroup,
        streamPrefix: 'github-actions-runner',
      }),
      environment: {
        REPOSITORY_URL: CONFIG.repositoryUrl,
        TOKEN: 'set_self-hosted_runner_token',
      },
    });

    taskDefinition.addVolume({
      name: 'docker_sock',
      host: { sourcePath: '/var/run/docker.sock' },
    });
    container.addMountPoints({
      containerPath: '/var/run/docker.sock',
      sourceVolume: 'docker_sock',
      readOnly: true,
    });
  }

  /**
   * Create Fargate Task Definition
   */
  private createFargateTaskDefinitions(logGroup: LogGroup) {
    const taskDefs = [CpuArchitecture.X86_64, CpuArchitecture.ARM64].map((cpuArchitecture) => {
      // eslint-disable-next-line no-underscore-dangle
      const suffix = cpuArchitecture._cpuArchitecture.toLowerCase();
      const taskDefinition = new FargateTaskDefinition(this, `${this.clusterName}-td-fg-${suffix}`, {
        family: `${this.clusterName}-fg-${suffix}`,
        cpu: CONFIG.fargate.cpu,
        memoryLimitMiB: CONFIG.fargate.memoryLimitMiB,
        runtimePlatform: {
          cpuArchitecture,
          operatingSystemFamily: OperatingSystemFamily.LINUX,
        },
      });

      taskDefinition.addContainer('github-actions-runner', {
        containerName: this.runnerContainerName,
        memoryLimitMiB: CONFIG.memoryLimitMiB,
        image: ContainerImage.fromRegistry(GITHUB_RUNNER_IMAGE),
        logging: LogDriver.awsLogs({
          logGroup,
          streamPrefix: 'github-actions-runner',
        }),
        environment: {
          REPOSITORY_URL: CONFIG.repositoryUrl,
          TOKEN: 'set_self-hosted_runner_token',
        },
      });
      return taskDefinition;
    });
    return taskDefs.map((def) => def.family);
  }

  /**
   * Create a security group for cluster node
   *
   * @returns Security Group
   */
  private createSecurityGroup() {
    const securityGroup = new SecurityGroup(this, `${this.clusterName}-sg`, {
      securityGroupName: `${this.clusterName}-sg`,
      vpc: this.vpc,
      description: `SG for ${this.clusterName}`,
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'Allow SSH Access');
    return securityGroup;
  }

  /**
   * Add autoscaling group capacity
   *
   * @param nodeName cluster node name
   * @param config cluster node configuration
   * @returns Autoscaling group capacity provider
   */
  private addAsgCapacity(nodeName: string, config: Ec2NodeConfig) {
    const autoScalingGroup = new AutoScalingGroup(this, `ASG-${nodeName}`, {
      vpc: this.vpc,
      autoScalingGroupName: `${this.clusterName}-${nodeName}`,
      instanceType: config.instanceType,
      machineImage: config.machineImage,
      spotPrice: config.spotPrice,
      minCapacity: config.minCapacity,
      maxCapacity: config.maxCapacity,
      keyName: config.sshKey,
      securityGroup: this.securityGroup,
      terminationPolicies: [
        TerminationPolicy.OLDEST_INSTANCE,
        TerminationPolicy.DEFAULT,
      ],
    });
    const capacityProvider = new AsgCapacityProvider(this, `AsgCapacityProvider-${nodeName}`, {
      capacityProviderName: `${nodeName}-${this.clusterName}-asg-cp`,
      spotInstanceDraining: true,
      autoScalingGroup,
      enableManagedScaling: true,
    });
    this.cluster.addAsgCapacityProvider(capacityProvider);
    return capacityProvider;
  }
}
