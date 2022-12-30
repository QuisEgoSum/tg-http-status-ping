import {ITask} from '@app/task/TaskModel'
import cron, {ScheduledTask} from 'node-cron'
import {TaskExecutor} from '@app/task/TaskExecutor'
import {logger} from '@logger'


export class TaskScheduler {
  private readonly logger = logger.child({label: 'TaskScheduler'})
  private readonly tasks: Map<number, ScheduledTask> = new Map()
  constructor(
    private readonly executor: TaskExecutor
  ) {}

  public schedule(task: ITask) {
    if (this.tasks.has(task.number)) {
      return
    }
    this.logger.info(`Schedule task ${task.number}`)
    this.tasks.set(task.number, cron.schedule(task.cron, this.executor.execute.bind(this.executor, task)))
  }

  public stop(number: number) {
    if (this.tasks.has(number)) {
      (this.tasks.get(number) as ScheduledTask).stop()
      this.tasks.delete(number)
      this.logger.info(`Task ${number} stop`)
    }
  }
}