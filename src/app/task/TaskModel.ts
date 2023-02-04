import {model, Schema, Types} from 'mongoose'
import {TaskType} from '@app/task/enums'



export interface BaseTask {
  _id: Types.ObjectId
  type: TaskType
  number: number
  active: boolean
  cron: string
  chatId: number
  executeAt: number
  createdAt: number
  updatedAt: number
}


export interface IGetHttpTask extends BaseTask {
  type: TaskType.HTTP_GET
  url: string
  status: number
  lastStatus: number
}

export interface IMessageTask extends BaseTask {
  type: TaskType.MESSAGE
  message: string
}

export type ITask = IGetHttpTask | IMessageTask


const TaskSchema = new Schema(
  {
    number: Number,
    type: String,
    message: String,
    url: String,
    cron: String,
    status: Number,
    active: Boolean,
    chatId: Number,
    executeAt: Number,
    lastStatus: Schema.Types.Mixed,
    createdAt: Number,
    updatedAt: Number
  },
  {
    versionKey: false
  }
)
  .index({number: 1}, {unique: true})
  .index({cron: 1})


export const TaskModel = model<ITask>('Task', TaskSchema, 'tasks')
