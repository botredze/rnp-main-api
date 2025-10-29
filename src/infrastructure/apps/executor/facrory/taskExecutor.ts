export abstract class TaskExecutor {
  abstract execute(...args: Array<any>): Promise<void>;
}
