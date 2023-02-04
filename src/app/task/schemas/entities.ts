import {url, cron, status, chatId, message} from '@app/task/schemas/properties'


export interface ScheduleTask {
  url: string
  cron: string
  chatId: number
  status: number
}

export const ScheduleTask = {
  type: 'object',
  properties: {
    url,
    cron,
    status,
    chatId
  },
  required: [
    'url',
    'cron',
    'status',
    'chatId'
  ],
  additionalProperties: false
}


export interface ScheduleMessageTask {
  message: string
  cron: string
  chatId: number
}

export const ScheduleMessageTask = {
  type: 'object',
  properties: {
    message,
    cron,
    chatId
  },
  required: [
    'message',
    'cron',
    'chatId'
  ],
  additionalProperties: false
}