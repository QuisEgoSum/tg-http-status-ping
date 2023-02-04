import {ScheduleMessageTask, ScheduleTask} from '@app/task/schemas/entities'
import {validate} from '@core/validation'


export class TaskValidator {
  schedule(task: ScheduleTask): ScheduleTask {
    validate('ScheduleTask', ScheduleTask, task)
    return task
  }

  scheduleMessage(task: ScheduleMessageTask): ScheduleMessageTask {
    validate('ScheduleMessageTask', ScheduleMessageTask, task)
    return task
  }
}

