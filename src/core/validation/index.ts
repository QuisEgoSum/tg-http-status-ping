import Ajv from 'ajv'
import ajvErrors from 'ajv-errors'
import ajvKeywords from 'ajv-keywords'
import cron from 'node-cron'
import {ErrorObject, ValidateFunction} from 'ajv'
import {ApplicationError} from '@error'

export const ajv = new Ajv(
  {
    removeAdditional: true,
    useDefaults: true,
    coerceTypes: true,
    allErrors: true,
    allowUnionTypes: true
  }
)


ajvErrors(ajv, {singleError: false, keepErrors: false})
ajvKeywords(ajv)


ajv.addKeyword({keyword: 'example'})
ajv.addKeyword({keyword: 'content'})
ajv.addKeyword({
    keyword: 'cronValidator',
    validate: (_: any, data: string) => cron.validate(data)
})
ajv.addKeyword({
    keyword: 'cron5',
    validate: (_: any, data: string) => data.split(' ').length === 5
})

const validators: Record<string, ValidateFunction> = {}


export class ValidationError extends ApplicationError {
    errors: string[]
    constructor(errors: ErrorObject[]) {
        super('Ошибка валидации')
        this.errors = errors.map(error =>  (error.message as string))
    }
}


export function validate(label: string, schema: Record<string, any>, data: unknown) {
    if (!(label in validators)) {
        validators[label] = ajv.compile(schema)
    }
    validators[label](data)
    if (validators[label].errors) {
        throw new ValidationError((validators[label].errors as ErrorObject[]))
    }
}

