import { InstanceClass, InstanceSize, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { AmiHardwareType, EcsOptimizedImage } from 'aws-cdk-lib/aws-ecs';
import { ConfigDefinition } from '../lib/Config';

const config: Partial<ConfigDefinition> = {
  region: 'us-east-1',
  clusterName: 'test-cluster',
  ec2Nodes: {
    amd64: {
      instanceType: InstanceType.of(InstanceClass.C6I, InstanceSize.LARGE),
      machineImage: EcsOptimizedImage.amazonLinux2(),
      spotPrice: '0.107',
      minCapacity: 0,
      maxCapacity: 1,
      sshKey: 'your-key-name',
    },
    arm64: {
      instanceType: InstanceType.of(InstanceClass.C6G, InstanceSize.LARGE),
      machineImage: EcsOptimizedImage.amazonLinux2(AmiHardwareType.ARM),
      spotPrice: '0.0856',
      minCapacity: 0,
      maxCapacity: 1,
      sshKey: 'your-key-name',
    },
  },
  fargate: {
    enable: true,
    cpu: 512,
    memoryLimitMiB: 1024,
  },
  repo: {
    owner: 'your',
    name: 'reponame',
  },
  secretName: 'test-secret-name',
};

export default config;
