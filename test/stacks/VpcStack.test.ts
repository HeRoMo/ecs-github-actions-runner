import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../../lib/stacks/VpcStack';

test('Snapshot Test', () => {
  const app = new cdk.App();
  const vpcStack = new VpcStack(app, 'test-vpc');

  expect(Template.fromStack(vpcStack)).toMatchSnapshot();
});
