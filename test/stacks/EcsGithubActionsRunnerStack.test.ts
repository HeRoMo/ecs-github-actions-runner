import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { EcsGithubActionsRunnerStack } from '../../lib/stacks/EcsGithubActionsRunnerStack';
import { VpcStack } from '../../lib/stacks/VpcStack';

test('Snapshot Test', () => {
  const app = new cdk.App();
  const vpcStack = new VpcStack(app, 'test-vpc');
  const runnerStack = new EcsGithubActionsRunnerStack(app, 'test-runner', vpcStack.vpc);

  expect(Template.fromStack(runnerStack)).toMatchSnapshot();
});
