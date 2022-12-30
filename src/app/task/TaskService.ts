import {ScheduleTask} from '@app/task/schemas/entities'
import {TaskValidator} from '@app/task/TaskValidator'
import {Service} from '@core/service/Service'
import {CounterService} from '@app/task/counter/CounterService'
import {TaskRepository} from '@app/task/TaskRepository'
import {TaskScheduler} from '@app/task/TaskScheduler'
import {logger as defaultLogger} from '@logger'
import {ApplicationError} from '@error'
import {Telegram} from '@server/telegram/Telegram'
import {config} from '@config'


export class TaskService extends Service {
  private readonly logger = defaultLogger.child({label: 'TaskService'})
  constructor(
    validator: TaskValidator,
    private readonly repository: TaskRepository,
    private readonly counterService: CounterService,
    private readonly scheduler: TaskScheduler,
    private readonly telegram: Telegram
  ) {
    super(validator)
  }

  async init() {
    const tasks = await this.repository.findActive()
    this.logger.info(`Init ${tasks.length} tasks`)
    for (const task of tasks) {
      this.scheduler.schedule(task)
    }
    await this.telegram.sendMessage(config.telegram.adminChatId, `Запущено задач при старте ${tasks.length}`)
  }

  async schedule(task: ScheduleTask) {
    const total = await this.repository.countActiveChatTasks(task.chatId)
    if (total >= 10) {
      throw new ApplicationError('Вы не можете иметь более 10 активных задач')
    }
    const number = await this.counterService.inc()
    const savedTask = await this.repository.create(
      number,
      task.url,
      task.cron,
      task.chatId,
      task.status
    )
    this.scheduler.schedule(savedTask)
    return savedTask
  }

  async getChatStatus(chatId: number): Promise<{message: string, keyboards: {text: string, callback_data: string}[][]}> {
    const tasks = await this.repository.findActiveChat(chatId)
    let message = tasks.length ? '' : 'У вас нет активных задач'
    const keyboards: {text: string, callback_data: string}[][] = []
    let row = 0
    let rowTasks = 0

    for (const task of tasks) {
      message += `*Задача №${task.number}.*\n`
      message += `URL: ${task.url}\n`
      message += `Последнее выполнение: ${task.executeAt ? new Date(task.executeAt).toUTCString() : '-'}\n`
      message += `Последний статус: ${task.lastStatus || '-'}\n\n`
      if (rowTasks === 3) {
        row += 1
        rowTasks = 0
      }
      rowTasks++
      if (!keyboards[row]) {
        keyboards[row] = []
      }
      keyboards[row].push({text: 'Отменить ' + task.number, callback_data: JSON.stringify(['stop', task.number])})
    }

    if (chatId == config.telegram.adminChatId) {
      const total = await this.repository.countActiveTasks()
      message += '\nВсего активных задач: ' + total
    }

    return {message, keyboards}
  }

  async stop(chatId: number, number: number) {
    const task = await this.repository.disable(chatId, number)
    if (!task) {
      throw new ApplicationError('Задача не найдена')
    }
    await this.scheduler.stop(number)
    if (!task.active) {
      throw new ApplicationError('Задача уже была удалена')
    }
  }
}
