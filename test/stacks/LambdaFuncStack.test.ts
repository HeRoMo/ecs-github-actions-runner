import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { EcsGithubActionsRunnerInfo } from '../../lib/constructs/EcsGithubActionsRunner';
import { LambdaFuncStack } from '../../lib/stacks/LambdaFuncStack';

test('Snapshot Test', () => {
  const app = new cdk.App();
  const info: EcsGithubActionsRunnerInfo = {
    clusterName: 'test-cluster',
    containerName: 'github-actions-runner',
    taskDefFamily: 'test-cluster',
    capacityProviders: [
      'amd64-cap-provider',
      'arm64-cap-provider',
    ],
  };
  const funcStack = new LambdaFuncStack(app, 'test-runner', info);

  const template = Template.fromStack(funcStack);
  expect(template).toMatchSnapshot();
});
