import { Stack } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EcsGithubActionsRunner } from '../constructs/EcsGithubActionsRunner';

/**
 * Construct ECS cluster of Github actions runner.
 */
export class EcsGithubActionsRunnerStack extends Stack {
  private readonly clusterConstructor: EcsGithubActionsRunner;

  constructor(scope: Construct, clusterName: string, private readonly vpc: Vpc) {
    super(scope, `${clusterName}-stack`);

    this.clusterConstructor = new EcsGithubActionsRunner(this, clusterName, vpc);
  }

  /**
   * runnerTaskInfo
   */
  public get runnerTaskInfo() {
    return this.clusterConstructor.clusterInfo;
  }
}
