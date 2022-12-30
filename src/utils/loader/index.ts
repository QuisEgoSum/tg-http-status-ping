import fs from 'fs/promises'
import path from 'path'
import {Model} from 'mongoose'
import {config} from '@config'


async function recursiveFindFilesByRegex(dirPath: string, regex: RegExp, result: string[] = []): Promise<void> {
  const files = await fs.readdir(dirPath)
  await Promise.all(files.map(async filename => {
    const filepath = path.resolve(dirPath, filename)
    const stat = await fs.stat(filepath)
    if (stat.isFile()) {
      if (filename.match(regex)) {
        result.push(filepath)
      }
    } else {
      await recursiveFindFilesByRegex(filepath, regex, result)
    }
  }))
}

export async function loadModels(): Promise<Model<any>[]> {
  const files: string[] = []
  await recursiveFindFilesByRegex(path.resolve(config.paths.root, './src/app'), /Model/, files)
  const models: {[key: string]: Model<any>}[] = await Promise.all(
      files.map(filepath => import(filepath.replace('.ts', '')))
  )
  return models.map(model => Object.values(model)).flat()
}