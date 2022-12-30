import {ScheduleTask} from '@app/task/schemas/entities'
import {validate} from '@core/validation'


export class TaskValidator {
  schedule(task: ScheduleTask): ScheduleTask {
    validate('ScheduleTask', ScheduleTask, task)
    return task
  }
}

