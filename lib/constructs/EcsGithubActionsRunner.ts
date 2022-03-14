import { AutoScalingGroup, TerminationPolicy } from 'aws-cdk-lib/aws-autoscaling';
import {
  Peer, Port, SecurityGroup, Vpc,
} from 'aws-cdk-lib/aws-ec2';
import {
  AsgCapacityProvider,
  Cluster,
  ClusterProps,
  ContainerImage,
  Ec2TaskDefinition,
  LogDriver,
} from 'aws-cdk-lib/aws-ecs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

import { CONFIG, NodeConfig } from '../Config';

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
  public readonly securityGroup: SecurityGroup;

  constructor(
    scope: Construct,
    private readonly clusterName: string,
    private readonly vpc: Vpc,
  ) {
    super(scope, clusterName);

    const clusterProps: ClusterProps = {
      clusterName: this.clusterName,
      vpc: this.vpc,
    };

    this.cluster = new Cluster(this, this.clusterName, clusterProps);
    this.securityGroup = this.createSecurityGroup();
    Object.entries(CONFIG.nodes).forEach(([key, node]) => this.addAsgCapacity(key, node));

    this.createTaskDefinition();
  }

  /**
   * Create Task Definition
   */
  private createTaskDefinition() {
    const logGroup = new LogGroup(this, `${this.clusterName}-lg`, {
      logGroupName: `/ecs/${this.clusterName}`,
      retention: RetentionDays.ONE_WEEK,
    });

    const taskDefinition = new Ec2TaskDefinition(this, `${this.clusterName}-td`, {
      family: `${this.clusterName}`,
    });

    const container = taskDefinition.addContainer('github-actions-runner', {
      containerName: 'github-actions-runner',
      memoryLimitMiB: CONFIG.memoryLimitMiB,
      hostname: this.clusterName,
      image: ContainerImage.fromRegistry('ghcr.io/heromo/ecs-github-actions-runner:latest'),
      logging: LogDriver.awsLogs({
        logGroup,
        streamPrefix: 'github-actions-runner',
      }),
      environment: {
        REPOSITORY_URL: CONFIG.repositoryUrl,
        TOKEN: CONFIG.token,
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
   * Create a security group for cluster node
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
   * @param node node configuration
   */
  private addAsgCapacity(nodeName: string, node: NodeConfig) {
    const autoScalingGroup = new AutoScalingGroup(this, `ASG-${nodeName}`, {
      vpc: this.vpc,
      autoScalingGroupName: `${this.clusterName}-${nodeName}`,
      instanceType: node.instanceType,
      machineImage: node.machineImage,
      spotPrice: node.spotPrice,
      minCapacity: node.minCapacity,
      maxCapacity: node.maxCapacity,
      keyName: node.sshKey,
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
  }
}
