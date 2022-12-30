import {Telegram} from '@server/telegram/Telegram'
import {TaskTelegramController} from '@app/task/TaskTelegramController'
import {TaskService} from '@app/task/TaskService'
import {TaskValidator} from '@app/task/TaskValidator'
import {initCounter} from '@app/task/counter'
import {TaskRepository} from '@app/task/TaskRepository'
import {TaskModel} from '@app/task/TaskModel'
import {TaskScheduler} from '@app/task/TaskScheduler'
import {TaskExecutor} from '@app/task/TaskExecutor'



class Task {
  constructor(
    public readonly service: TaskService
  ) {}
}



export async function initTask(telegram: Telegram) {
  const counter = await initCounter()
  const repository = new TaskRepository(TaskModel)
  const service = new TaskService(
    new TaskValidator(),
    repository,
    counter.service,
    new TaskScheduler(new TaskExecutor(telegram, repository)),
    telegram
  )
  await service.init()
  new TaskTelegramController(telegram, service)
  return new Task(service)
}