import {url, cron, status, chatId} from '@app/task/schemas/properties'


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