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

## Preparing

Create a secret of AWS Secret Manager, which has the secret key named `GITHUB_TOKEN` which is setted value Github Personal Access Token.

If you want to connet EC2 node of ECS cluster by SSH, create key pair.

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

## Start and stop Github actions runner tasks

This cdk application include lambda functions to operate Github actions runner tasks.
To start task, run the following command.

```bash
# for start EC2 runners
aws lambda invoke --function-name <clusterName>-start-runners-ec2 /dev/null

# for start Fargate runners
aws lambda invoke --function-name <clusterName>-start-runners-fargate /dev/null
```

To stop task, run the following command.

```bash
aws lambda invoke --function-name <clusterName>-stop-runners /dev/null
```

## Github runner Docker image

You can pull Github runner image from `ghcr.io/heromo/ecs-github-actions-runner:latest` .

This image is configurable by the following environment variables.

<!-- textlint-disable ja-spacing/ja-no-space-around-parentheses -->
- `REPOSITORY_URL`: [Required] Repository to add the runner to.
- `TOKEN`: [Required] Registration token.
- `EPHEMERAL`: [Optional] runner runs ephemeral mode, If `yes` setted.
- `LABELS`: [Optional] Extra labels in addition to the default labels.
<!-- textlint-enable ja-spacing/ja-no-space-around-parentheses -->

`REPOSITORY_URL` is setted in ECS task definition.
If you use lamba function to start runners, `TOKEN` is setted automatically.

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
