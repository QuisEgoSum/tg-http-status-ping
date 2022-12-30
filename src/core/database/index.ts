import mongoose from 'mongoose'
import {config} from '@config'
import {logger as defaultLogger} from '@logger'


const logger = defaultLogger.child({label: 'db'}, {})


export async function createConnection() {
  await mongoose.connect(config.database.credentials.connectionString, config.database.options)

  logger.info(`Open connection to database ${mongoose.connection.name}. Host: ${mongoose.connection.host}`)
}