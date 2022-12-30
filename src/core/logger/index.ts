import pino from 'pino'
import pinoPretty from 'pino-pretty'
import {EventEmitter} from 'events'
import {config} from '@config'


const pinoMetadataSymbol = Symbol.for('pino.metadata')


interface LoggerErrorEmitter {
  on(eventName: 'ERROR', handler: (level: 'FATAL' | 'ERROR', log: string) => void): this
}

class LoggerErrorEmitter extends EventEmitter implements LoggerErrorEmitter {
  public [pinoMetadataSymbol] = true
  public lastLevel?: number
  write(log: string) {
    if (this.lastLevel === 50) {
      this.emit('ERROR', 'ERROR', log)
    } else if (this.lastLevel === 60) {
      this.emit('ERROR', 'FATAL', log)
    }
  }
}

export const emitter: LoggerErrorEmitter = new LoggerErrorEmitter()

export const logger = pino(
  {
    customLevels: {
      fatalOnlyStdout: 61
    },
    level: config.logger.level,
    formatters: {
      bindings: () => ({})
    },
    timestamp: config.logger.isoTime
        ? pino.stdTimeFunctions.isoTime
        : pino.stdTimeFunctions.epochTime,
    nestedKey: 'payload'
  },
  pino.multistream([
    config.logger.pretty ? ({stream: pinoPretty({colorize: true})}) : ({stream: process.stdout}),
    {stream: emitter}
  ])
)


config.useLogger(logger)