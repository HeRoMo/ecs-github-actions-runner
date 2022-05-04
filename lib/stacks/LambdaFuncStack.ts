import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { CONFIG } from '../Config';
import { EcsGithubActionsRunnerInfo } from '../constructs/EcsGithubActionsRunner';
import { LambdaConstructor } from '../constructs/LambdaConstructor';

const props: StackProps = {
  env: { region: CONFIG.region },
  description: `Lambda functions to operate Tasks of ${CONFIG.clusterName}`,
};

/**
 * Construnt Lambda functions to operate Github runner tasks.
 */
export class LambdaFuncStack extends Stack {
  constructor(scope: Construct, id: string, taskInfo: EcsGithubActionsRunnerInfo) {
    super(scope, `${id}-stack`, props);

    new LambdaConstructor(this, id, taskInfo);
  }
}
