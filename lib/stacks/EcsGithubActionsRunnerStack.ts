import { Stack } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster } from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import { EcsGithubActionsRunner } from '../constructs/EcsGithubActionsRunner';

/**
 * Construct ECS cluster stack
 */
export class EcsGithubActionsRunnerStack extends Stack {
  public readonly cluster: Cluster;

  constructor(scope: Construct, clusterName: string, private readonly vpc: Vpc) {
    super(scope, `${clusterName}-stack`);

    this.cluster = new EcsGithubActionsRunner(this, clusterName, vpc).cluster;
  }
}
