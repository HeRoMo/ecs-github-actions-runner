import { InstanceClass, InstanceSize, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { AmiHardwareType, EcsOptimizedImage } from 'aws-cdk-lib/aws-ecs';
import { ConfigDefinition } from '../lib/Config';

const config: ConfigDefinition = {
  region: process.env.CDK_DEFAULT_REGION,
  clusterName: 'github-actions-runner',
  memoryLimitMiB: 3500,
  ec2Nodes: {
    amd64: {
      instanceType: InstanceType.of(InstanceClass.C5, InstanceSize.LARGE),
      machineImage: EcsOptimizedImage.amazonLinux2(),
      spotPrice: '0.107',
      minCapacity: 0,
      maxCapacity: 1,
    },
    arm64: {
      instanceType: InstanceType.of(InstanceClass.C6G, InstanceSize.LARGE),
      machineImage: EcsOptimizedImage.amazonLinux2(AmiHardwareType.ARM),
      spotPrice: '0.0856',
      minCapacity: 0,
      maxCapacity: 1,
    },
  },
  fargate: {
    enable: false,
    cpu: 1024,
    memoryLimitMiB: 2048,
  },
  repo: {
    owner: 'your',
    name: 'repo',
  },
  secretName: 'your-secret-name',
};

export default config;
