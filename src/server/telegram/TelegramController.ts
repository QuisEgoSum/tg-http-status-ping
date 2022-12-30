import {Context} from 'telegraf'
import {Error} from 'mongoose'
import {ApplicationError} from '@error'
import {logger as defaultLogger} from '@logger'
import {Logger} from 'pino'
import {ValidationError} from '@core/validation'


export class TelegramController {
  constructor(
    public readonly logger: Logger = defaultLogger.child({label: 'TelegramController'})
  ) {
    const properties = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    for (const methodName of properties) {
      if (this._is_private_method(methodName)) {
        continue
      }
      const thisTypeHack = (this as Record<string, any>)
      if (typeof thisTypeHack[methodName] !== 'function') {
        continue
      }
      thisTypeHack[methodName] = this._error_wrapper(thisTypeHack[methodName].bind(this))
    }
  }

  _is_private_method(name: string): boolean {
    return name === 'constructor' || name.startsWith('_')
  }

  private _error_wrapper(executor: Function): Function {
    return async (ctx: Context, ...args: unknown[]) => {
      try {
        await executor(ctx, ...args)
      } catch (error) {
        await this._error_handler(ctx, error as Error)
      }
    }
  }

  private async _error_handler(ctx: Context, error: Error): Promise<void> {
    if (error instanceof ValidationError) {
      await ctx.reply(
        `${error.message}:\n- ${error.errors.join('\n- ')}`
      )
    } else if (error instanceof ApplicationError) {
      await ctx.reply(error.message)
    } else {
      this.logger.error(error)
      await ctx.reply('Произошла ошибка. Администратор бота уведомлен об этом')
    }
  }
}
