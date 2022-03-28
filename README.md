# ECS cluster for Github Actions runner

This is a CDK project to construct ECS cluster of Github self-hosted runner.

## Stacks

This CDK project includes the following stacks.

- \<clusterName\>-vpc-stack
  - Create VPC and Subnets for ECS cluster
- \<clusterName\>-stack
  - Create ECS cluster and Autoscaling
- \<clusterName\>-funcs-stack
  - Create Lambda functions to start and to stop Github Actions Runner tasks.

## Configuration

Create your configuration file in *config/* directory.
your configuration file overwrite *config/default.ts*.

Minimum configuration is the following.

```typescript
import { ConfigDefinition } from '../lib/Config';

const config: Partial<ConfigDefinition> = {
  repo: {
    owner: 'owner',
    name: 'your-repo-name',
  },
  secretName: 'your-secret-name',
};

export default config;
```

See [config/minimum-sample.ts](config/minimum-sample.ts).

Full configuration sample is [config/maximum-sample.ts](config/maximum-sample.ts)

## Deploy

When you want to deploy this CDK project, run the following commands.
Set environment variable `NODE_CONFIG_ENV` to select your configuration file.

```bash
export NODE_CONFIG_ENV=<your-config-file-name(without extention)>
yarn cdk deploy --all
```

if you want to delete AWS resources of this CDK project, Run the following command.

```bash
export NODE_CONFIG_ENV=<your-config-file-name(without extention)>
yarn cdk destroy --all
```
---

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `yarn build`   compile typescript to js
* `yarn watch`   watch for changes and compile
* `yarn test`    perform the jest unit tests
* `yarn eslint`    check by eslint
* `yarn cdk deploy`      deploy this stack to your default AWS account/region
* `yarn cdk diff`        compare deployed stack with current state
* `yarn cdk synth`       emits the synthesized CloudFormation template

## LICENSE

[MIT](LICENSE)
