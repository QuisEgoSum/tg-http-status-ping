import {Context, Telegraf} from 'telegraf'
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types'
import {EventEmitter} from 'events'
import {logger} from '@logger'


export interface SentMessage {
  chatId: number,
  messageId: number,
  message: string
}

export interface SentMessages {
  chatId: number
  messages: {
    id: number
    message: string
  }[]
}

export interface TelegramMessageReplacerOptions {
  joinSeparator?: string,
  splitSeparators?: string[]
}


interface RegisterCallbackParams<T extends Array<unknown>> {
  event: string,
  handler: (ctx: Context, ...params: T) => unknown | Promise<unknown>
}


export class Telegram extends EventEmitter {
  private static readonly TELEGRAM_MAX_MESSAGE_LENGTH = 4096
  private readonly logger = logger.child({label: 'telegram'})

  constructor(
    public readonly bot: Telegraf
  ) {
    super()
    this.bot.on('callback_query', this.callbackHandler.bind(this))
  }

  private callbackHandlerWrapper<T extends Array<unknown>>(params: RegisterCallbackParams<T>) {
    return async (ctx: Context, rest: T) => {
      try {
        await params.handler(ctx, ...rest)
      } catch(error) {
        logger.error(error)
        await ctx.answerCbQuery('Error')
      }
    }
  }

  registerCallbackHandler<T extends Array<unknown>>(params: RegisterCallbackParams<T>) {
    this.on(params.event, this.callbackHandlerWrapper(params))
  }

  private callbackHandler(ctx: Context) {
    if (!ctx.callbackQuery || !ctx.callbackQuery.data) {
      return
    }
    const [event, ...data] = JSON.parse(ctx.callbackQuery.data)
    this.emit(event, ctx, data)
  }

  public logging() {
    this.bot.on('message', (ctx: Context) => this.logger.info({evt: 'message', msg: ctx.message}))
  }

  public static messageReplacer(message: string | string[], joinSeparator = '', splitSeparators = ['\n', ' ']): string[] {
    if (typeof message === 'string') {
      message = [message]
    }
    const totalSize = message.reduce((acc, cur) => acc + cur.length, 0) + (message.length - 1) * joinSeparator.length
    if (totalSize <= Telegram.TELEGRAM_MAX_MESSAGE_LENGTH) {
      return [message.join(joinSeparator)]
    } else {
      if (message.find(string => string.length > Telegram.TELEGRAM_MAX_MESSAGE_LENGTH) === undefined) {
        const messages = []
        let currentMessage = ''
        for (const string of currentMessage) {
          if (string.length + currentMessage.length <= Telegram.TELEGRAM_MAX_MESSAGE_LENGTH - joinSeparator.length) {
            if (currentMessage) {
              currentMessage = string
            } else {
              currentMessage += joinSeparator + string
            }
          } else {
            messages.push(currentMessage)
            currentMessage = string
          }
        }
        messages.push(currentMessage)
        return messages
      } else {
        return Telegram.messageReplacer(
          message.map(
            string => {
              if (string.length > Telegram.TELEGRAM_MAX_MESSAGE_LENGTH) {
                return string.split(splitSeparators[0] || '')
              } else {
                return string
              }
            }
          ).flat(),
          joinSeparator,
          splitSeparators.slice(1)
        )
      }
    }
  }

  private async _sendMessage(chatId: number, message: string, options: ExtraReplyMessage): Promise<SentMessage> {
    const result = await this.bot.telegram.sendMessage(chatId, message, options)
    return {
      chatId: chatId,
      messageId: result.message_id,
      message: message
    }
  }

  private async _sendMessages(chatId: number, messages: string[], options: ExtraReplyMessage): Promise<SentMessages> {
    const results = await Promise.all(messages.map(message => this._sendMessage(chatId, message, options)))
    return {
      chatId: chatId,
      messages: results.map((result) => ({
        id: result.messageId,
        message: result.message
      }))
    }
  }

  async sendMessage(
    chatId: number,
    message: string | string[],
    options: ExtraReplyMessage = {parse_mode: 'Markdown'},
    messageReplacerOptions: TelegramMessageReplacerOptions = {}
  ): Promise<SentMessages> {
    const messages = Telegram.messageReplacer(
      message,
      messageReplacerOptions.joinSeparator,
      messageReplacerOptions.splitSeparators
    )
    return await this._sendMessages(chatId, messages, options)
  }
}