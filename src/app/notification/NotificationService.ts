import {NotificationMessageUtils} from '@app/notification/NotificationMessageUtils'
import {emitter as loggerEmitter, logger} from '@logger'
import type {NotificationTelegramAgent} from '@app/notification/NotificationTelegramAgent'
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types'
import {TelegramMessageReplacerOptions} from '@server/telegram/Telegram'


export class NotificationService {

  static errorHandler(error: Error): void {
    logger.error(error)
  }

  constructor(
    private readonly telegram: NotificationTelegramAgent
  ) {
    loggerEmitter
      .on(
        'ERROR',
        (level, log) => this
          .errorHandler(level, log)
      )
  }

  public async startApplication() {
    try {
      await this.telegram.sendAdminMessage(NotificationMessageUtils.getStartMessage())
    } catch (error) {
      logger.error(error)
    }
  }

  async shutdownApplication(event: string) {
    try {
      await this.telegram.sendAdminMessage(NotificationMessageUtils.getShutdownMessage(event))
    } catch (error) {
      logger.error(error)
    }
  }

  private async errorHandler(level: 'FATAL' | 'ERROR', log: string): Promise<void> {
    try {
      await this.telegram.sendAdminMessage(
        NotificationMessageUtils.parseLog(level, log),
        {parse_mode: 'Markdown'},
        {joinSeparator: '\n'}
      )
    } catch (error) {
      logger.fatalOnlyStdout(error)
    }
  }
}