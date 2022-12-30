import {NotificationService} from '@app/notification/NotificationService'
import {NotificationTelegramAgent} from '@app/notification/NotificationTelegramAgent'
import {Telegram} from '@server/telegram/Telegram'


class Notification {
  constructor(
    public readonly service: NotificationService
  ) {}
}


export async function initNotification(bot: Telegram): Promise<Notification> {
  const telegram = new NotificationTelegramAgent(bot)
  const service = new NotificationService(telegram)
  return new Notification(service)
}


export type {
  Notification,
  NotificationService
}