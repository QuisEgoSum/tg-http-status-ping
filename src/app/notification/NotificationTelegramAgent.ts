import type {ExtraReplyMessage} from 'telegraf/typings/telegram-types'
import {Telegram, TelegramMessageReplacerOptions} from '@server/telegram/Telegram'
import {config} from "@config";


export class NotificationTelegramAgent {
  constructor(
    private readonly telegram: Telegram
  ) {}

  public async sendMessage(
    id: number,
    messages: string[],
    options: ExtraReplyMessage = {parse_mode: 'Markdown'},
    messageReplacerOptions?: TelegramMessageReplacerOptions
  ) {
    return await this.telegram.sendMessage(id, messages, options, messageReplacerOptions)
  }

  public async sendAdminMessage(
    messages: string[],
    options: ExtraReplyMessage = {parse_mode: 'Markdown'},
    messageReplacerOptions?: TelegramMessageReplacerOptions
  ) {
    return await this.telegram.sendMessage(config.telegram.adminChatId, messages, options, messageReplacerOptions)
  }
}