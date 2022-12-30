const toMd = require('json2md')
const mdFormatter = require('markdown-table-prettify')
const fs = require('fs')
const path = require('path')
const configEnv = require('../../src/core/config/env')
const pkgJson = require('../../package.json')
const schema = require('../../src/core/config/schema.json')


function createTableEnvRow(name, schema) {
  const row = new Array(4)

  row[0] = name || ''
  row[1] = schema.description || ''
  row[2] = (Array.isArray(schema.type) ? schema.type.join(', ') : schema.type) || ''
  row[3] = ''

  if (schema.enum) {
    row[3] += `enum: <br />-${schema.enum.join(';<br />-')}.`
  }
  if ('minimum' in schema || 'maximum' in schema) {
    if (row[3]) {
      row[3] += '<br />'
    }
    row[3] += `Range: ${schema.minimum || ''}...${schema.maximum || ''}`
  }
  if ('minLength' in schema || 'maxLength' in schema) {
    if (row[3]) {
      row[3] += '<br />'
    }
    row[3] += `Length: ${schema.minLength || ''}...${schema.maxLength || ''}`
  }

  return row
}

(async function() {
  const mdObject = [
    {
      h1: 'Env list'
    },
    {
      table: {
        headers: ['name', 'description', 'type', 'valid'],
        rows: [[configEnv.stringToEnvName(pkgJson.name) + '_CONFIG', 'Path to the yml file', 'string', '']]
          .concat(configEnv.createEnvListBySchema(pkgJson.name, schema).map(
            (env) => createTableEnvRow(
              env.name,
              env.dataPath.reduce((acc, key) => acc.properties[key], schema)
            )
        ))
      }
    }
  ]

  const outPath = path.resolve(__dirname, '../../src/core/config/README.md')
  const mdString = mdFormatter.CliPrettify.prettify(toMd(mdObject, '', null))

  fs.writeFileSync(outPath, mdString, {encoding: 'utf-8'})
})()