import {IGetHttpTask, IMessageTask, ITask} from '@app/task/TaskModel'
import axios, {AxiosError} from 'axios'
import {Telegram} from '@server/telegram/Telegram'
import {logger} from '@logger'
import {TaskRepository} from '@app/task/TaskRepository'
import {TaskType} from '@app/task/enums'


export class TaskExecutor {
  private readonly logger = logger.child({label: 'TaskExecutor'})
  private readonly state: Set<number> = new Set()
  constructor(
    private readonly telegram: Telegram,
    private readonly repository: TaskRepository
  ) {}

  private async sendTaskResult(task: ITask, message: string) {
    await this.telegram.sendMessage(
      task.chatId,
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{text: 'Отменить задачу', callback_data: JSON.stringify(['stop', task.number])}]
          ]
        }
      }
    )
  }

  private async executeGetUrl(task: IGetHttpTask) {
    for (let i = 0; i < 5; i++) {
      let status: number | string
      try {
        const response = await axios.get(task.url)
        status = response.status
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response) {
            status = error.response.status
          } else {
            status = error.status || error.code || 'UNKNOWN'
            if (i !== 4) {
              logger.child({task: task.number}).warn(`Failed request for task with code ${status}`)
              continue
            }
          }
        } else if (error instanceof Error) {
          await this.sendTaskResult(
            task,
            `${task.url} провалена с ошибкой ${(error.message)}\n\nЗадача ${task.number}`
          )
          this.logger.child({task: task.number}).error(error)
          return
        } else {
          await this.sendTaskResult(
            task,
            `${task.url} провалена с неизвестной ошибкой\n\nЗадача ${task.number}`
          )
          logger.child({task: task.number}).error(error)
          return
        }
      }
      const executeAt = Date.now()
      if (status !== task.status) {
        await this.sendTaskResult(
          task,
          `${task.url} статус код ответа: ${status}\n\nЗадача ${task.number}`
        )
        this.logger.info(`Failed execute task ${task.number}`)
      }
      await this.repository.setGetHttpExecuteInfo(task.number, executeAt, status)
      return
    }
  }


  private async executeMessage(task: IMessageTask) {
    await this.sendTaskResult(task, task.message)
    await this.repository.setMessageExecuteInfo(task.number, new Date().getTime())
  }

  async execute(task: ITask): Promise<void> {
    if (this.state.has(task.number)) {
      logger.child({task: task.number}).warn(`Skip execute task`)
      return
    }
    this.state.add(task.number)
    try {
      this.logger.info(`Execute task ${task.number}`)
      if (task.type == TaskType.HTTP_GET) {
        await this.executeGetUrl(task)
      } else if (task.type == TaskType.MESSAGE) {
        await this.executeMessage(task)
      }
    } finally {
      this.state.delete(task.number)
    }
  }
}