import 'module-alias/register'
import {initApp} from './init'
import {config} from '@config'
import mongoose from 'mongoose'
import type {NotificationService} from '@app/notification'
import {Telegram} from '@server/telegram/Telegram'
import {logger} from '@logger'


(async function main() {
  const {bot, notification} = await initApp()

  await listen(bot)

  await notification.service.startApplication()

  {
    ['SIGINT', 'SIGTERM']
      .forEach(event => process.once(event, () => shutdown(event, bot, notification.service)))
  }
})()
  .catch(error => {
    logger.fatal(error)
    setTimeout(() => process.exit(1), 1000)
  })


async function listen(telegram: Telegram) {
  let telegrafOptions = {}
  if (config.telegram.enableWebhook) {
    telegrafOptions = config.telegram.webhook
  }
  await telegram.bot.launch(telegrafOptions)
  if (config.telegram.enableWebhook) {
    logger.child({label: 'telegram'}).info(
      `Telegram webhook server listen http://localhost:${
        config.telegram.webhook.port} for domain ${
        config.telegram.webhook.domain} at path ${
        config.telegram.webhook.hookPath}`
    )
  } else {
    logger.child({label: 'telegram'}).info(`Telegram long polling client started`)
  }
}

async function shutdown(
  event: string,
  telegram: Telegram,
  notification: NotificationService
) {
  const sLogger = logger.child({label: 'shutdown'})
  sLogger.info({mgs: 'Shutdown start', event})
  telegram.bot.stop()
  await mongoose.disconnect()
  await notification.shutdownApplication(event)
  sLogger.info({msg: 'Shutdown end', event})
  process.exit(0)
}