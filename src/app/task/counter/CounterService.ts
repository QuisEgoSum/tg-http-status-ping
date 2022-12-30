import {Service} from '@core/service/Service'
import {CounterRepository} from '@app/task/counter/CounterRepository'


export class CounterService extends Service {
  constructor(
    private readonly repository: CounterRepository
  ) {
    super()
  }
  async upsert() {
    await this.repository.upsert()
  }

  async inc() {
    return await this.repository.inc()
  }
}

