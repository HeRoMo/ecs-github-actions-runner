import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { EcsGithubActionsRunnerInfo } from '../constructs/EcsGithubActionsRunner';
import { LambdaConstructor } from '../constructs/LambdaConstructor';

/**
 * Construnt Lambda functions to operate Github runner tasks.
 */
export class LambdaFuncStack extends Stack {
  constructor(scope: Construct, id: string, taskInfo: EcsGithubActionsRunnerInfo) {
    super(scope, `${id}-stack`);

    new LambdaConstructor(this, id, taskInfo);
  }
}
