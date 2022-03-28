// eslint-disable-next-line import/no-unresolved
import { Callback, Context } from 'aws-lambda';

import { TaskOperator, getTaskOpts } from '../TaskOperator';

/**
 * Function to stop Github action runner tasks.
 *
 * @param event
 * @param context
 * @param callback
 */
export async function handler(
  event: any,
  context: Context,
  callback: Callback,
): Promise<void> {
  const region = process.env.AWS_REGION;
  const taskOpts = getTaskOpts();
  const taskStarter = new TaskOperator(region, taskOpts);
  const output = await taskStarter.stopTasks();

  callback(null, {
    status: 200,
    message: 'start runner',
    output: JSON.stringify(output, null, 2),
  });
}
