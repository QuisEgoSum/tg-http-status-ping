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
    this.telegram.bot.command('schedule_message', (ctx) => this.scheduleMessage(ctx))
    this.telegram.registerCallbackHandler<[number]>({
      event: 'stop',
      handler: this.stop.bind(this)
    })
    this.telegram.registerCallbackHandler<[number]>({
      event: 'restart',
      handler: this.restart.bind(this)
    })
  }

  private async _getReplyMessageText(ctx: Context, replyMessage: string): Promise<string | null> {
    if (
      !('message' in ctx.update)
      || !('reply_to_message' in ctx.update.message)
      || !ctx.update.message.reply_to_message
    ) {
      await ctx.reply(
        replyMessage,
        {parse_mode: 'Markdown'}
      )
      return null
    }
    return (ctx.update.message.reply_to_message as {text: string}).text
  }

  async schedule(ctx: Context): Promise<void> {
    const replyMessage = await this._getReplyMessageText(
      ctx,
      'Нужно ответить на сообщение с параметрами: url status cron\n ```text\nhttps://google.com 200 * * * * *```',
    )
    if (replyMessage == null) {
      return
    }
    const [url, status, ...cron] = replyMessage.split(' ')
    const task = await this.service.schedule({
      url: url,
      status: parseInt(status),
      cron: cron.join(' '),
      chatId: (ctx.update as {message: {chat: {id: number}}}).message.chat.id
    })
    await ctx.reply(`Задача запланирована №${task.number}`)
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

  async restart(ctx: Context, number: number): Promise<void> {
    try {
      const chatId = (ctx.update as Record<any, any>).callback_query.message.chat.id
      const inlineKeyboard = await this.service.restart(
        chatId,
        number,
        // @ts-ignore
        ctx.update.callback_query.message.reply_markup.inline_keyboard
      )
      await this.telegram.bot.telegram.editMessageReplyMarkup(
        chatId,
        // @ts-ignore
        ctx.update.callback_query.message.message_id,
        undefined,
        {inline_keyboard: inlineKeyboard}
      )
      await ctx.reply(`Задача ${number} восстановлена`)
    } catch (error) {
      if (error instanceof ApplicationError) {
        await ctx.reply(error.message)
      } else {
        throw error
      }
    }
    await ctx.answerCbQuery()
  }

  async stop(ctx: Context, number: number): Promise<void> {
    try {
      const chatId = (ctx.update as Record<any, any>).callback_query.message.chat.id
      const inlineKeyboard = await this.service.stop(
        chatId,
        number,
        // @ts-ignore
        ctx.update.callback_query.message.reply_markup.inline_keyboard
      )
      await this.telegram.bot.telegram.editMessageReplyMarkup(
        chatId,
        // @ts-ignore
        ctx.update.callback_query.message.message_id,
        undefined,
        {inline_keyboard: inlineKeyboard}
      )
      await ctx.reply(`Задача ${number} удалена`)
    } catch (error) {
      if (error instanceof ApplicationError) {
        await ctx.reply(error.message)
      } else {
        throw error
      }
    }
    await ctx.answerCbQuery()
  }

  async scheduleMessage(ctx: Context) {
    const replyMessage = await this._getReplyMessageText(
      ctx,
      'Нужно ответить на сообщение которое необходимо отправлять',
    )
    if (replyMessage == null) {
      return
    }
    const [, ...cron] = (ctx.update as {message: {text: string}}).message.text.split(' ')
    const task = await this.service.scheduleMessage({
      cron: cron.join(' '),
      message: replyMessage,
      chatId: (ctx.update as {message: {chat: {id: number}}}).message.chat.id
    })
    await ctx.reply(`Задача запланирована №${task.number}`)
  }
}
