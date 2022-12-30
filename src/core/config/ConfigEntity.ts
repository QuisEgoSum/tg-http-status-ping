import type {Logger} from 'pino'
import path from "path";


interface PkgJson {
  readonly name: string,
  readonly version: string
}


interface Paths {
  readonly root: string
}


interface Telegram {
  readonly token: string
  readonly enableWebhook: boolean
  readonly webhook: {
    readonly port: number
    readonly hookPath: string
    readonly domain: string
  }
  readonly adminChatId: number
}

interface LoggerConfig {
  readonly pretty: boolean,
  readonly isoTime: boolean,
  readonly time: boolean,
  readonly level: 'info' | 'debug'
}

interface DatabaseConfig {
  readonly credentials: {
    readonly connectionString: string
  },
  options: {
    useNewUrlParser: boolean,
    useUnifiedTopology: boolean,
    ignoreUndefined: boolean,
    keepAlive: boolean
  }
}


export class ConfigEntity {
  public configInfo: {
    usedOverrideFilePath?: string,
    usedEnv: string[]
  }
  public readonly production: boolean
  public readonly pkgJson: PkgJson
  public readonly logger: LoggerConfig
  public readonly database: DatabaseConfig
  public readonly telegram: Telegram
  public readonly paths: Paths

  constructor(defaultConfig: ConfigEntity) {
    this.configInfo = defaultConfig.configInfo
    this.production = defaultConfig.production
    this.pkgJson = defaultConfig.pkgJson
    this.logger = defaultConfig.logger
    this.database = defaultConfig.database
    this.telegram = defaultConfig.telegram
    this.paths = {
      root: path.resolve(__dirname, '../../../')
    }
  }

  useLogger(logger: Logger) {
    logger = logger.child({label: 'config'})
    if (this.configInfo.usedOverrideFilePath) {
      logger.info(`Use override config file ${this.configInfo.usedOverrideFilePath}`)
    }
    this.configInfo.usedEnv.forEach(env => logger.info(`Used env ${env}`))

    if (this.production) {
      if (this.logger.pretty) {
        logger.warn(`You have set "logger.pretty" to "true", the recommended value in "production" mode is "false" to improve performance`)
      }
      if (this.logger.isoTime) {
        logger.warn(`You have set "logger.isoTime" to "true", the recommended value in "production" mode is "false" to improve performance`)
      }
    }
  }
}