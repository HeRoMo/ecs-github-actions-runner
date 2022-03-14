#!/usr/bin/env node
import 'source-map-support/register';
import { App, Tags } from 'aws-cdk-lib';

import { CONFIG } from '../lib/Config';
import { EcsGithubActionsRunnerStack } from '../lib/stacks/EcsGithubActionsRunnerStack';
import { VpcStack } from '../lib/stacks/VpcStack';

const { clusterName } = CONFIG;

const app = new App();
const { vpc } = new VpcStack(app, `${clusterName}-vpc`);
new EcsGithubActionsRunnerStack(app, clusterName, vpc);

Tags.of(app).add('Service/Name', clusterName);
