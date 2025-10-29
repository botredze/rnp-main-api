export abstract class TaskExecutor {
  abstract execute(): Promise<void>;
}
