import {CounterModel} from '@app/task/counter/CounterModel'


export class CounterRepository {

  constructor(
    private readonly Model: typeof CounterModel
  ) {}

  async upsert() {
    await this.Model.updateOne({}, {$setOnInsert: {number: 0}}, {upsert: true})
  }

  async inc(): Promise<number> {
    return await this.Model.findOneAndUpdate({}, {$inc: {number: 1}}, {upsert: true, new: true})
      .then(doc => doc.number)
  }
}
