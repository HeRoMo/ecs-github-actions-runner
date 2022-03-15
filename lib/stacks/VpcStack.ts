import { Stack, StackProps } from 'aws-cdk-lib';
import {
  SubnetConfiguration, SubnetType, Vpc, VpcProps,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

/**
 * Construct VPC stack
 */
export class VpcStack extends Stack {
  public readonly vpc: Vpc;
  constructor(scope: Construct, vpcName: string, props?: StackProps | undefined) {
    super(scope, `${vpcName}-stack`, props)

    const subnetConfiguration: SubnetConfiguration[] = [
      { name: 'Public', cidrMask: 24, subnetType: SubnetType.PUBLIC },
    ];

    const vpcProps: VpcProps = {
      vpcName,
      cidr: '10.0.0.0/16',
      vpnGateway: false,
      natGateways: 0,
      subnetConfiguration,
    };
    this.vpc = new Vpc(this, vpcName, vpcProps);
  }
}
