import cal_command_handler from './functions/cal_command_handler';
import cal_handler from './functions/cal_handler';
import render_widget from './functions/render_widget';

export const functionFactory = {
  cal_command_handler,
  // Add your functions here
  cal_handler,
  render_widget,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
