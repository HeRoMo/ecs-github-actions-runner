import { TaskOperator, getTaskOpts } from '../TaskOperator';

/**
 * Function to stop Github action runner tasks.
 */
export async function handler() {
  const region = process.env.AWS_REGION;
  const taskOpts = getTaskOpts();
  const taskStarter = new TaskOperator(region, taskOpts);
  const output = await taskStarter.stopTasks();

  return {
    status: 200,
    message: 'stop runner',
    output: JSON.stringify(output, null, 2),
  };
}
