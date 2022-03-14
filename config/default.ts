import { InstanceClass, InstanceSize, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { EcsOptimizedImage } from 'aws-cdk-lib/aws-ecs';
import { ConfigDefinition } from '../lib/Config';

const config: ConfigDefinition = {
  clusterName: 'github-actions-runner',
  memoryLimitMiB: 3500,
  nodes: {
    amd64: {
      instanceType: InstanceType.of(InstanceClass.C5, InstanceSize.LARGE),
      machineImage: EcsOptimizedImage.amazonLinux2(),
      spotPrice: '0.107',
      minCapacity: 0,
      maxCapacity: 1,
    },
  },
  repositoryUrl: 'your/repo',
  token: 'your token',
};

export default config;
