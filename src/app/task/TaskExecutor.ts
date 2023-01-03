import {ITask} from '@app/task/TaskModel'
import axios, {AxiosError} from 'axios'
import {Telegram} from '@server/telegram/Telegram'
import {logger} from '@logger'
import {TaskRepository} from '@app/task/TaskRepository'


export class TaskExecutor {
  private readonly logger = logger.child({label: 'TaskExecutor'})
  constructor(
    private readonly telegram: Telegram,
    private readonly repository: TaskRepository
  ) {}

  private async sendFailedResult(task: ITask, message: string) {
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

  async execute(task: ITask): Promise<void> {
    this.logger.info(`Execute task ${task.number}`)
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
              logger.warn(`Failed request for task ${task.number} with code ${status}`)
              continue
            }
          }
        } else if (error instanceof Error) {
          await this.sendFailedResult(
            task,
            `${task.url} провалена с ошибкой ${(error.message)}\n\nЗадача ${task.number}`
          )
          this.logger.child({task: task.number}).error(error)
          return
        } else {
          await this.sendFailedResult(
            task,
            `${task.url} провалена с неизвестной ошибкой\n\nЗадача ${task.number}`
          )
          logger.child({task: task.number}).error(error)
          return
        }
      }
      const executeAt = Date.now()
      if (status !== task.status) {
        await this.sendFailedResult(
          task,
          `${task.url} статус код ответа: ${status}\n\nЗадача ${task.number}`
        )
        this.logger.info(`Failed execute task ${task.number}`)
      }
      await this.repository.setExecuteInfo(task.number, executeAt, status)
      return
    }
  }
}