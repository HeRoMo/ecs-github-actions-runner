import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { ECS } from '@aws-sdk/client-ecs';
import { Octokit } from '@octokit/rest';

/**
 * Options of Github actions runner task.
 */
export interface TaskOptions {
  clusterName: string;
  containerName: string;
  taskDefFamily: string;
  capacityProviders: string[];
  secretId: string;
  repo: {
    owner: string;
    name: string;
  }
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
    taskDefFamily: process.env.TASK_DEF_FAMILY,
    capacityProviders: process.env.CAPACITY_PROVIDERS.split(','),
    secretId: process.env.SECRET_NAME,
    repo: {
      owner: process.env.REPO_OWNER,
      name: process.env.REPO_NAME,
    },
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
   * @returns response of runTaks API.
   */
  public async startTasks() {
    const taskDefArn = await this.taskDefinition;
    const runTasks = this.taskOpts.capacityProviders.map(
      (capacityProvider) => this.runtask(capacityProvider, taskDefArn),
    );
    const outputs = await Promise.all(runTasks);
    return outputs;
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
   * run a task of Github actions runner.
   * @param capacityProvider Capacity Provider name.
   * @param taskDefinition Task definition arn or name.
   * @returns response of runTask API
   */
  private async runtask(capacityProvider: string, taskDefinition: string) {
    const token = await this.githubToken;
    const octkit = new Octokit({ auth: token });
    const { data: { token: regiToken } } = await octkit.rest.actions
      .createRegistrationTokenForRepo({
        owner: this.taskOpts.repo.owner,
        repo: this.taskOpts.repo.name,
      });

    return this.ecs.runTask({
      taskDefinition,
      capacityProviderStrategy: [{
        capacityProvider,
      }],
      cluster: this.taskOpts.clusterName,
      count: 1,
      overrides: {
        containerOverrides: [{
          name: this.taskOpts.containerName,
          environment: [{ name: 'TOKEN', value: regiToken }],
        }],
      },
    });
  }

  /**
   * get task definition arn
   *
   * @returns Task definition arn
   */
  private get taskDefinition(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.ecs.listTaskDefinitions({
        familyPrefix: this.taskOpts.taskDefFamily,
        status: 'ACTIVE',
        sort: 'DESC',
        maxResults: 1,
      }).then(({ taskDefinitionArns }) => {
        if (taskDefinitionArns && taskDefinitionArns.length >= 1) {
          resolve(taskDefinitionArns[0]);
        }
        reject(new Error(`Taskdefinition[ ${this.taskOpts.taskDefFamily} ] was not found.`));
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
