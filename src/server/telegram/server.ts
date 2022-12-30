import {Telegraf, Context} from 'telegraf'
import {config} from '@config'
import {logger as defaultLogger} from '@logger'
import {Telegram} from './Telegram'


export async function createTelegramBot(): Promise<Telegram> {
  const bot = new Telegraf(config.telegram.token)
  return new Telegram(bot)
}