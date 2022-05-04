import { TaskOperator, getTaskOpts } from '../TaskOperator';

/**
 * Function to start Github action runner tasks.
 */
async function startTask(launchType: 'ec2'|'fargate') {
  const region = process.env.AWS_REGION;
  const taskOpts = getTaskOpts();
  const taskStarter = new TaskOperator(region, taskOpts);
  const output = await taskStarter.startTasks(launchType);

  return {
    status: 200,
    message: 'start runner',
    output: JSON.stringify(output, null, 2),
  };
}

export async function ec2Handler() {
  return startTask('ec2');
}

export async function fargateHandler() {
  return startTask('fargate');
}
