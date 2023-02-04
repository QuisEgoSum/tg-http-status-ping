import {ScheduleMessageTask, ScheduleTask} from '@app/task/schemas/entities'
import {TaskValidator} from '@app/task/TaskValidator'
import {Service} from '@core/service/Service'
import {CounterService} from '@app/task/counter/CounterService'
import {TaskRepository} from '@app/task/TaskRepository'
import {TaskScheduler} from '@app/task/TaskScheduler'
import {logger as defaultLogger} from '@logger'
import {ApplicationError} from '@error'
import {Telegram} from '@server/telegram/Telegram'
import {config} from '@config'
import {IGetHttpTask, IMessageTask} from '@app/task/TaskModel'
import {TaskType} from '@app/task/enums'


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

  async _notifyAdmin(message: string) {
    try {
      const total = await this.repository.countActiveTasks()
      message += '\nВсего активных задач: ' + total
      await this.telegram.sendMessage(
        config.telegram.adminChatId,
        message
      )
    } catch (error) {
      this.logger.error(error)
    }
  }

  private async checkMaxActiveTasks(chatId: number) {
    const total = await this.repository.countActiveChatTasks(chatId)
    if (total >= 10) {
      throw new ApplicationError('Вы не можете иметь более 10 активных задач')
    }
  }

  async schedule(task: ScheduleTask): Promise<IGetHttpTask> {
    await this.checkMaxActiveTasks(task.chatId)
    const number = await this.counterService.inc()
    const savedTask = await this.repository.createGetHttpTask(
      number,
      task.url,
      task.cron,
      task.chatId,
      task.status
    )
    this.scheduler.schedule(savedTask)
    this._notifyAdmin(`Запланирована задача №${savedTask.number}`).then(() => undefined)
    return savedTask
  }

  private getHttpTaskStringFormatter(task: IGetHttpTask): string {
    let message = ''
    message += `URL: ${task.url}\n`
    message += `Последнее выполнение: ${task.executeAt ? new Date(task.executeAt).toUTCString() : '-'}\n`
    message += `Последний статус: ${task.lastStatus || '-'}\n\n`
    return message
  }

  private messageTaskStringFormatter(task: IMessageTask): string {
    let message = ''
    message += `Сообщение: \n\`${task.message}\``
    message += `Последнее выполнение: ${task.executeAt ? new Date(task.executeAt).toUTCString() : '-'}\n\n`
    return message
  }

  async getChatStatus(chatId: number): Promise<{message: string, keyboards: {text: string, callback_data: string}[][]}> {
    const tasks = await this.repository.findActiveChat(chatId)
    let message = tasks.length ? '' : 'У вас нет активных задач'
    const keyboards: {text: string, callback_data: string}[][] = []
    let row = 0
    let rowTasks = 0

    for (const task of tasks) {
      message += `*Задача №${task.number}.*\n`
      if (task.type == TaskType.HTTP_GET) {
        message += this.getHttpTaskStringFormatter(task)
      } else if (task.type == TaskType.MESSAGE) {
        message += this.messageTaskStringFormatter(task)
      }
      if (rowTasks === 3) {
        row += 1
        rowTasks = 0
      }
      rowTasks++
      if (!keyboards[row]) {
        keyboards[row] = []
      }
      keyboards[row].push({text: 'Отменить №' + task.number, callback_data: JSON.stringify(['stop', task.number])})
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
    this._notifyAdmin(`Остановлена задача №${number}`).then(() => undefined)
  }

  async scheduleMessage(task: ScheduleMessageTask): Promise<IMessageTask> {
    await this.checkMaxActiveTasks(task.chatId)
    const number = await this.counterService.inc()
    const savedTask = await this.repository.createMessageTask(
      number,
      task.message,
      task.cron,
      task.chatId
    )
    this.scheduler.schedule(savedTask)
    this._notifyAdmin(`Запланирована задача №${savedTask.number}`).then(() => undefined)
    return savedTask
  }
}
