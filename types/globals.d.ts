declare namespace NodeJS {
  interface ProcessEnv {
    readonly AWS_REGION: string;
    readonly CLUSTER_NAME: string;
    readonly CONTAINER_NAME: string;
    readonly TASK_DEF_FAMILY: string;
    readonly CAPACITY_PROVIDERS: string;
    readonly CDK_DEFAULT_ACCOUNT: string;
    readonly REPO_OWNER: string;
    readonly REPO_NAME: string;
    readonly SECRET_NAME: string;
  }
}
