

const useIndexIfExist = (array: string[], i: number, cb: (i: number) => unknown) => typeof array[i] === 'string' && cb(i)

export function stringToEnvName(string: string) {
  const stringPart = string.split('')
  for (let i = 0; i < stringPart.length; i++) {
    const s = stringPart[i]
    if (s === '-' || s === '.') {
      stringPart[i] = '_'
      useIndexIfExist(stringPart, i + 1, i => stringPart[i] = stringPart[i].toLocaleLowerCase())
    } else if (s === '_') {
      useIndexIfExist(stringPart, i + 1, i => stringPart[i] = stringPart[i].toLocaleLowerCase())
    } else if (s === s.toUpperCase()) {
      stringPart[i] = '_' + s
    }
  }
  return stringPart.join('')
    .toUpperCase()
}

interface EnvItem {
  name: string,
  dataPath: string[]
}

function fillEnvListBySchema(projectName: string, schema: Record<string, any>, path: string[], env: EnvItem[]) {
  for (const key of Object.keys(schema.properties)) {
    if (schema.properties[key].type === 'object') {
      fillEnvListBySchema(projectName, schema.properties[key], path.concat(key), env)
    } else if (schema.properties[key].type !== 'array') {
      const _path = path.concat(key)
      env.push(
        {
          name: [projectName].concat(_path).map(stringToEnvName).join('_'),
          dataPath: _path
        }
      )
    }
  }

  return env
}

export function createEnvListBySchema(projectName: string, schema: Record<string, any>) {
  return fillEnvListBySchema(projectName, schema, [], [])
}

export function assignEnvValues(config: Record<string, any>, listEnv: EnvItem[]): string[] {
  const usedEnv = []

  for (const env of listEnv) {
    if (env.name in process.env) {
      usedEnv.push(env.name)

      let value = config

      for (let i = 0; i < env.dataPath.length - 1; i++) {
        value = value[env.dataPath[i]]
      }

      value[env.dataPath[env.dataPath.length -1]] = process.env[env.name]
    }
  }

  return usedEnv
}