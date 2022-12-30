import {createConnection} from '@core/database'
import {createTelegramBot} from '@server/telegram'
import {initNotification} from '@app/notification'
import {initTask} from '@app/task'
import {loadModels} from '@utils/loader'
import {logger} from '@logger'


export async function initApp() {
  await createConnection()

  const models = await loadModels()

  models.forEach(
    model => model.once('index', error => error && logger.child({label: 'db'}).error(error))
  )

  const telegram = await createTelegramBot()

  await initTask(telegram)
  const notification = await initNotification(telegram)

  telegram.logging()

  return {
    bot: telegram,
    notification: notification
  }
}