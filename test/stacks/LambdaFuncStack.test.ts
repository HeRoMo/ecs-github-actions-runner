import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { EcsGithubActionsRunnerInfo } from '../../lib/constructs/EcsGithubActionsRunner';
import { LambdaFuncStack } from '../../lib/stacks/LambdaFuncStack';

test('Snapshot Test', () => {
  const app = new cdk.App();
  const info: EcsGithubActionsRunnerInfo = {
    clusterName: 'test-cluster',
    containerName: 'github-actions-runner',
    ec2TaskDefFamily: 'test-cluster-ec2',
    ec2CapacityProviders: [
      'amd64-cap-provider',
      'arm64-cap-provider',
    ],
    fargateTaskDefFamilies: [
      'test-cluster-fg-arm64',
      'test-cluster-fg-x86_64',
    ],
  };
  const funcStack = new LambdaFuncStack(app, 'test-runner', info);

  const template = Template.fromStack(funcStack);
  expect(template).toMatchSnapshot();
});
