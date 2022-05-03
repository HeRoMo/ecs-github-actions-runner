import {
  Effect,
  IRole,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { CONFIG } from '../Config';

import { EcsGithubActionsRunnerInfo } from './EcsGithubActionsRunner';

/**
 * Lambda Function constructor to operate Github actions runner tasks.
 */
export class LambdaConstructor extends Construct {
  private readonly startRunnerFunc: NodejsFunction;
  private readonly stopRunnerFunc: NodejsFunction;

  /**
   * Constructor
   *
   * @param scope Scope
   * @param id Construct name
   * @param taskInfo Information of Github actions runner cluster
   */
  constructor(
    scope: Construct,
    private readonly id: string,
    private readonly taskInfo: EcsGithubActionsRunnerInfo,
  ) {
    super(scope, id);

    const role = this.createFunctionRole();

    this.startRunnerFunc = this.createFunction(
      `${this.id}-start-runners`,
      'lambda/handlers/startRunners.ts',
      'handler',
      role,
    );
    this.stopRunnerFunc = this.createFunction(
      `${this.id}-stop-runners`,
      'lambda/handlers/stopRunners.ts',
      'handler',
      role,
    );
  }

  /**
   * Create the role of functions.
   *
   * @returns Role.
   */
  private createFunctionRole(
    region: string = CONFIG.region || '*',
    account: string = process.env.CDK_DEFAULT_ACCOUNT || '*',
  ) {
    const path = `/${this.id}/`;
    const roleName = 'ProvisionRunnersRole';
    const role = new Role(this, `${this.id}-role`, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      path,
      roleName,
      description: 'Role of Lambda function to start or stop Gihhub runners',
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        runTask: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'ecs:ListTaskDefinitions',
                'ecs:ListTasks',
              ],
              resources: [
                '*',
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'ecs:runTask',
                'ecs:stopTask',
              ],
              resources: [
                `arn:aws:ecs:${region}:${account}:task/${this.taskInfo.clusterName}/*`,
                `arn:aws:ecs:${region}:${account}:task-definition/${this.taskInfo.ec2TaskDefFamily}:*`,
                ...this.taskInfo.fargateTaskDefFamilies.map((family) => (
                  `arn:aws:ecs:${region}:${account}:task-definition/${family}:*`
                )),
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
              ],
              resources: [
                `arn:aws:secretsmanager:${region}:${account}:secret:*`,
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'iam:PassRole',
              ],
              resources: [
                `arn:aws:iam::${account}:role/*`,
              ],
            }),
          ],
        }),
      },
    });
    return role;
  }

  /**
   * Create a Lambda function
   *
   * @param functionName function name
   * @param entry Entry file path
   * @param handler Handler function name
   * @param role Role of functions
   * @returns Created function.
   */
  private createFunction(functionName: string, entry: string, handler: string, role: IRole) {
    return new NodejsFunction(this, functionName, {
      functionName,
      entry,
      handler,
      role,
      runtime: Runtime.NODEJS_14_X,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
      },
      logRetention: RetentionDays.ONE_WEEK,
      environment: {
        CLUSTER_NAME: this.taskInfo.clusterName,
        CONTAINER_NAME: this.taskInfo.containerName,
        EC2_TASK_DEF_FAMILY: `${this.taskInfo.ec2TaskDefFamily}`,
        EC2_CAPACITY_PROVIDERS: this.taskInfo.ec2CapacityProviders.join(','),
        FARGATE_TASK_DEF_FAMILIES: this.taskInfo.fargateTaskDefFamilies.join(','),
        REPO_OWNER: CONFIG.repo.owner,
        REPO_NAME: CONFIG.repo.name,
        SECRET_NAME: CONFIG.secretName,
      },
    });
  }
}
