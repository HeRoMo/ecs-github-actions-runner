import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { ECS, RunTaskCommandInput } from '@aws-sdk/client-ecs';
import { Octokit } from '@octokit/rest';

/**
 * Options of Github actions runner task.
 */
export interface TaskOptions {
  clusterName: string;
  containerName: string;
  ec2TaskDefFamily: string;
  ec2CapacityProviders: string[];
  fargateTaskDefFamilies: string[];
  secretId: string;
  repo: {
    owner: string;
    name: string;
  }
  subnets: string[],
  securityGroup: string;
}

/**
 * Get TaskOptions from environment variables.
 *
 * @returns Task Options
 */
export function getTaskOpts(): TaskOptions {
  return {
    clusterName: process.env.CLUSTER_NAME,
    containerName: process.env.CLUSTER_NAME,
    ec2TaskDefFamily: process.env.EC2_TASK_DEF_FAMILY,
    ec2CapacityProviders: process.env.EC2_CAPACITY_PROVIDERS?.split(',') || [],
    fargateTaskDefFamilies: process.env.FARGATE_TASK_DEF_FAMILIES?.split(',') || [],
    secretId: process.env.SECRET_NAME,
    repo: {
      owner: process.env.REPO_OWNER,
      name: process.env.REPO_NAME,
    },
    subnets: process.env.SUBNETS?.split(',') || [],
    securityGroup: process.env.SECURITY_GROUP,
  };
}

/**
 * Github Runner Task Operator
 */
export class TaskOperator {
  private readonly ecs: ECS;
  private readonly secretMgr: SecretsManager;
  private githubTokenValue: string;

  /**
   * Constructor
   *
   * @param region Region name to deploy lambda functions.
   * @param taskOpts
   */
  constructor(region: string, private readonly taskOpts: TaskOptions) {
    this.ecs = new ECS({ region });
    this.secretMgr = new SecretsManager({ region });
  }

  /**
   * Start Github runner tasks in the ECS cluster
   *
   * @param launchType  'ec2' or 'fargate'
   * @returns response of runTaks API.
   */
  public async startTasks(launchType: 'ec2'|'fargate') {
    if (launchType === 'ec2') {
      return this.startEc2Tasks();
    }
    if (launchType === 'fargate') {
      return this.startFargateTasks();
    }
    throw new Error('Invalid launchType');
  }

  /**
   * Stop Github runner tasks in the ECS cluster
   *
   * @returns response of stopTask API.
   */
  public async stopTasks() {
    const { taskArns } = await this.ecs.listTasks({
      cluster: this.taskOpts.clusterName,
    });

    if (taskArns) {
      const tasks = taskArns.map((arn) => this.ecs.stopTask({
        cluster: this.taskOpts.clusterName,
        task: arn,
      }));

      const outputs = await Promise.all(tasks);
      return outputs;
    }
    throw new Error('Failed to stop tasks');
  }

  /**
   * Start Github runner EC2 tasks in the ECS cluster
   *
   * @returns response of runTaks API.
   */
  private async startEc2Tasks() {
    const taskDefArn = await this.ec2TaskDefinition;
    const runTasks = this.taskOpts.ec2CapacityProviders.map(
      (capacityProvider) => {
        const inputGenerator = this.ec2RunTaskInput(capacityProvider, taskDefArn);
        return this.runTask(inputGenerator);
      },
    );
    const outputs = await Promise.all(runTasks);
    return outputs;
  }

  /**
   * Start Github runner fargate tasks in the ECS cluster
   *
   * @returns response of runTaks API.
   */
  private async startFargateTasks() {
    const taskDefArns = await this.fargateTaskDefinitions;
    const capacityProvider = 'FARGATE';
    const runTasks = taskDefArns.map(
      (taskDef) => {
        const inputGenerator = this.fargateRuntTaskInput(capacityProvider, taskDef);
        return this.runTask(inputGenerator);
      },
    );
    const outputs = await Promise.all(runTasks);
    return outputs;
  }

  /**
   * run a task of Github actions runner.
   *
   * @param inputGenerator function to generate RunTaskCommandInput
   * @returns response of runTask API
   */
  private async runTask(inputGenerator: (token: string) => RunTaskCommandInput) {
    const token = await this.githubToken;
    const octkit = new Octokit({ auth: token });
    const { data: { token: regiToken } } = await octkit.rest.actions
      .createRegistrationTokenForRepo({
        owner: this.taskOpts.repo.owner,
        repo: this.taskOpts.repo.name,
      });

    const input = inputGenerator(regiToken);
    return this.ecs.runTask(input);
  }

  /**
   * make function to generate RunTaskCommandInput for EC2
   *
   * @param capacityProvider Capacity Provider name.
   * @param taskDefinition Task definition arn or name.
   * @returns RunTaskCommandInput
   */
  private ec2RunTaskInput(
    capacityProvider: string,
    taskDefinition: string,
  ): ((token: string) => RunTaskCommandInput) {
    return (token: string) => ({
      taskDefinition,
      capacityProviderStrategy: [{
        capacityProvider,
      }],
      cluster: this.taskOpts.clusterName,
      count: 1,
      overrides: {
        containerOverrides: [{
          name: this.taskOpts.containerName,
          environment: [{ name: 'TOKEN', value: token }],
        }],
      },
    });
  }

  /**
   * make function to generate RunTaskCommandInput for Fargate task
   *
   * @param capacityProvider Capacity Provider name.
   * @param taskDefinition Task definition arn or name.
   * @returns RunTaskCommandInput
   */
  private fargateRuntTaskInput(
    capacityProvider: string,
    taskDefinition: string,
  ): ((token: string) => RunTaskCommandInput) {
    return (token: string) => ({
      taskDefinition,
      capacityProviderStrategy: [{
        capacityProvider,
        weight: 0,
        base: 1,
      }],
      cluster: this.taskOpts.clusterName,
      count: 1,
      overrides: {
        containerOverrides: [{
          name: this.taskOpts.containerName,
          environment: [{ name: 'TOKEN', value: token }],
        }],
      },
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: this.taskOpts.subnets,
          securityGroups: [this.taskOpts.securityGroup],
          assignPublicIp: 'ENABLED',
        },
      },
      platformVersion: '1.4.0',
    });
  }

  /**
   * get EC2 task definition arn
   *
   * @returns Task definition arn
   */
  private get ec2TaskDefinition(): Promise<string> {
    return this.getTaskDefinition(this.taskOpts.ec2TaskDefFamily);
  }

  /**
   * get fargate task definition arns
   */
  private get fargateTaskDefinitions(): Promise<string[]> {
    const promises = this.taskOpts.fargateTaskDefFamilies.map((family) => (
      this.getTaskDefinition(family)
    ));
    return Promise.all(promises);
  }

  private getTaskDefinition(familyPrefix: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.ecs.listTaskDefinitions({
        familyPrefix,
        status: 'ACTIVE',
        sort: 'DESC',
        maxResults: 1,
      }).then(({ taskDefinitionArns }) => {
        if (taskDefinitionArns && taskDefinitionArns.length >= 1) {
          resolve(taskDefinitionArns[0]);
        }
        reject(new Error(`Taskdefinition[ ${familyPrefix} ] was not found.`));
      });
    });
  }

  /**
   * get Github access token from AWS Secret Manager
   *
   * @returns Github access token
   */
  private get githubToken(): Promise<string> {
    if (this.githubTokenValue) {
      return Promise.resolve(this.githubTokenValue);
    }
    return new Promise((resolve, reject) => {
      this.secretMgr.getSecretValue({
        SecretId: this.taskOpts.secretId,
      }).then(({ SecretString }) => {
        if (SecretString) {
          const { GITHUB_TOKEN } = JSON.parse(SecretString);
          if (GITHUB_TOKEN) {
            this.githubTokenValue = GITHUB_TOKEN;
            resolve(this.githubTokenValue);
          }
          reject(new Error('GITHUB_TOKEN was not found'));
        }
        reject(new Error('Failed to get value from Secret Manager.'));
      });
    });
  }
}
