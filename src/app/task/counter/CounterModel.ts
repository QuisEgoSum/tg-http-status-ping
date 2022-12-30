import {model, Schema, Types} from 'mongoose'


export interface ICounter {
  _id: Types.ObjectId
  number: number
}


const CounterSchema = new Schema<ICounter>(
  {
    number: Number
  },
  {
    versionKey: false,
    timestamps: false
  }
)


export const CounterModel = model<ICounter>('TaskCounter', CounterSchema, 'task_counter')