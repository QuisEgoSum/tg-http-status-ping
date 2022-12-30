import {ConfigEntity} from './ConfigEntity'
import YAML from 'yaml'
import fs from 'fs'
import path from 'path'
import {object} from '@libs/alg'
import {validation} from './validation'
import {assignEnvValues, createEnvListBySchema, stringToEnvName} from './env'


function readConfig(
  configPath = process.argv.find(arg => arg.startsWith('--config='))?.replace('--config=', '')
): ConfigEntity {
  const pkgJsonPath = path.resolve(__dirname, '../../../package.json')
  const defaultConfigPath = path.resolve(__dirname, '../../../config/default.yaml')

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, {encoding: 'utf-8'}))

  if (!configPath) {
    configPath = process.env[stringToEnvName(pkgJson.name) + '_CONFIG']
  }

  const configSchema = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'schema.json'), {encoding: 'utf-8'}))
  const defaultConfig = YAML.parse(fs.readFileSync(defaultConfigPath, {encoding: 'utf-8'}))

  const sourceConfig = object.assignDefaultPropertiesDeep(
    configPath
      ? YAML.parse(fs.readFileSync(configPath, {encoding: 'utf-8'}))
      : {},
    defaultConfig
  )

  const usedEnv = assignEnvValues(sourceConfig, createEnvListBySchema(pkgJson.name, configSchema))

  validation(sourceConfig)

  sourceConfig.configInfo = {
    usedOverrideFilePath: configPath,
    usedEnv: usedEnv
  }

  sourceConfig.pkgJson = pkgJson

  return sourceConfig
}


export const config = new ConfigEntity(readConfig())

export function reloadConfigByPath(path: string) {
  Object.assign(config, new ConfigEntity(readConfig(path)))
}