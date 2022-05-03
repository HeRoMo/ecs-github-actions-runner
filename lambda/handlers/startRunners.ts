import { TaskOperator, getTaskOpts } from '../TaskOperator';

interface Event {
  launchType: 'ec2'|'fargate';
}

/**
 * Function to start Github action runner tasks.
 */
export async function handler(event: Event) {
  const region = process.env.AWS_REGION;
  const taskOpts = getTaskOpts();
  const taskStarter = new TaskOperator(region, taskOpts);
  const output = await taskStarter.startTasks(event.launchType);

  return {
    status: 200,
    message: 'start runner',
    output: JSON.stringify(output, null, 2),
  };
}
