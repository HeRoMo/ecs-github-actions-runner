import { Stack, StackProps } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { CONFIG } from '../Config';
import { EcsGithubActionsRunner } from '../constructs/EcsGithubActionsRunner';

const props: StackProps = {
  env: { region: CONFIG.region },
  description: `${CONFIG.clusterName}, ECS cluster for Github self-hosted runner`,
};

/**
 * Construct ECS cluster of Github actions runner.
 */
export class EcsGithubActionsRunnerStack extends Stack {
  private readonly clusterConstructor: EcsGithubActionsRunner;

  constructor(scope: Construct, clusterName: string, private readonly vpc: Vpc) {
    super(scope, `${clusterName}-stack`, props);

    this.clusterConstructor = new EcsGithubActionsRunner(this, clusterName, vpc);
  }

  /**
   * runnerTaskInfo
   */
  public get runnerTaskInfo() {
    return this.clusterConstructor.clusterInfo;
  }
}
