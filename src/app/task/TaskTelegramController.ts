import {Telegram} from '@server/telegram/Telegram'
import {Context} from 'telegraf'
import {TaskService} from '@app/task/TaskService'
import {TelegramController} from '@server/telegram/TelegramController'
import {ApplicationError} from '@error'


export class TaskTelegramController extends TelegramController {
  constructor(
    private readonly telegram: Telegram,
    private readonly service: TaskService
  ) {
    super()
    this.telegram.bot.command('schedule', (ctx) => this.schedule(ctx))
    this.telegram.bot.command('status', (ctx) => this.status(ctx))
    this.telegram.registerCallbackHandler<[number]>({
      event: 'stop',
      handler: this.stop.bind(this)
    })
  }

  async schedule(ctx: Context): Promise<void> {
    if (
      !('message' in ctx.update)
      || !('reply_to_message' in ctx.update.message)
      || !ctx.update.message.reply_to_message
    ) {
      await ctx.reply(
        'Нужно ответить на сообщение с параметрами: url status cron\n ```text\nhttps://google.com 200 * * * * *```',
        {parse_mode: 'Markdown'}
      )
      return
    }
    const [url, status, ...cron] = (ctx.update.message.reply_to_message as {text: string}).text.split(' ')
    const task = await this.service.schedule({
      url: url,
      status: parseInt(status),
      cron: cron.join(' '),
      chatId: ctx.update.message.chat.id
    })
    await ctx.reply(`Задача запланирована. Номер задачи ${task.number}`)
  }

  async status(ctx: Context): Promise<void> {
    const chatId = (ctx.update as Record<any, any>).message.chat.id
    const status = await this.service.getChatStatus(chatId)
    await this.telegram.sendMessage(
      (ctx.update as Record<any, any>).message.chat.id,
      status.message,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: status.keyboards
        }
      }
    )
  }

  async stop(ctx: Context, number: number): Promise<void> {
    try {
      const chatId = (ctx.update as Record<any, any>).callback_query.message.chat.id
      await this.service.stop(chatId, number)
      await ctx.answerCbQuery(`Задача ${number} удалена`)
    } catch (error) {
      if (error instanceof ApplicationError) {
        await ctx.answerCbQuery(error.message)
      } else {
        throw error
      }
    }
  }
}
