import {CounterService} from '@app/task/counter/CounterService'
import {CounterModel} from '@app/task/counter/CounterModel'
import {CounterRepository} from '@app/task/counter/CounterRepository'


class Counter {
  constructor(
    public readonly service: CounterService
  ) {}
}



export async function initCounter() {
  const service = new CounterService(new CounterRepository(CounterModel))
  await service.upsert()
  return new Counter(service)
}