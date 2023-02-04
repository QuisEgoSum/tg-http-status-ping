

export const url = {
  type: 'string'
}

export const cron = {
  type: 'string',
  cronValidator: true,
  cron5: true
}

export const status = {
  type: 'integer',
  minimum: 200,
  maximum: 599
}

export const chatId = {
  type: 'integer'
}

export const message = {
  type: 'string',
  minLength: 1,
  maxLength: 400
}