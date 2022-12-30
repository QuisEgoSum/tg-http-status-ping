import {model, Schema, Types} from 'mongoose'


export interface ITask {
  _id: Types.ObjectId
  number: number
  url: string
  cron: string
  status: number
  active: boolean
  chatId: number
  executeAt: number
  lastStatus: string | number
  createdAt: number
  updatedAt: number
}


const TaskSchema = new Schema(
  {
    number: Number,
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
