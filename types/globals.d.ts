declare namespace NodeJS {
  interface ProcessEnv {
    readonly AWS_REGION: string;
    readonly CLUSTER_NAME: string;
    readonly CONTAINER_NAME: string;
    readonly EC2_TASK_DEF_FAMILY: string;
    readonly FARGATE_TASK_DEF_FAMILIES: string;
    readonly EC2_CAPACITY_PROVIDERS: string;
    readonly CDK_DEFAULT_ACCOUNT: string;
    readonly REPO_OWNER: string;
    readonly REPO_NAME: string;
    readonly SECRET_NAME: string;
    readonly SUBNETS: string;
    readonly SECURITY_GROUP: string;
  }
}
