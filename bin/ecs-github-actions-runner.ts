#!/usr/bin/env node
import 'source-map-support/register';
import { App, Tags } from 'aws-cdk-lib';

import { CONFIG } from '../lib/Config';
import { EcsGithubActionsRunnerStack } from '../lib/stacks/EcsGithubActionsRunnerStack';
import { VpcStack } from '../lib/stacks/VpcStack';
import { LambdaFuncStack } from '../lib/stacks/LambdaFuncStack';

const { clusterName } = CONFIG;

const app = new App();
const { vpc } = new VpcStack(app, `${clusterName}-vpc`);
const { runnerTaskInfo } = new EcsGithubActionsRunnerStack(app, clusterName, vpc);
new LambdaFuncStack(app, `${clusterName}-funcs`, runnerTaskInfo);

Tags.of(app).add('Service/Name', clusterName);
