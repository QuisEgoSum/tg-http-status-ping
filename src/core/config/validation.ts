import Ajv from 'ajv'
// @ts-ignore
import schema from './schema'


export function validation(config: Record<string, any>) {
  const ajv = new Ajv(
    {
      coerceTypes: true,
      allErrors: true,
      allowUnionTypes: true,
      useDefaults: true
    }
  )

  const validate = ajv.compile(schema)

  validate(config)

  if (validate.errors) {
    console.error('\x1b[31mFATAL\x1b[0m: Validation config failed:')
    validate.errors.forEach(
      error => {
        if (error.keyword === 'additionalProperties') {
          console.error(`\x1b[31mFATAL\x1b[0m: Keyword: ${error.keyword}, path: ${error.instancePath}, message: ${error.message}, additional: ${error.params.additionalProperty}`)
        } else {
          console.error(`\x1b[31mFATAL\x1b[0m: Keyword: ${error.keyword}, path: ${error.instancePath}, message: ${error.message}`)
        }
      }
    )
    process.exit(1)
  }
}