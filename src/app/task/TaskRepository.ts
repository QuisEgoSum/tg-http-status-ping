import {ITask, TaskModel} from '@app/task/TaskModel'


export class TaskRepository {
  constructor(
    private readonly Model: typeof TaskModel
  ) {}


  async create(
    number: number,
    url: string,
    cron: string,
    chatId: number,
    status: number,
    active: boolean = true
  ): Promise<ITask> {
    return await new this.Model({
      number,
      url,
      cron,
      chatId,
      status,
      active
    })
      .save()
      .then(doc => doc.toJSON() as ITask)
  }

  async findActive(): Promise<ITask[]> {
    return await this.Model.find({active: true}).lean().exec()
  }

  async setExecuteInfo(number: number, executeAt: number, lastStatus: number | string) {
    await this.Model.updateOne({number: number}, {executeAt, lastStatus})
  }

  async countActiveChatTasks(chatId: number): Promise<number> {
    return await this.Model.countDocuments({chatId: chatId, active: true}).exec()
  }

  async findActiveChat(chatId: number) {
    return await this.Model.find({active: true, chatId: chatId}).lean().exec()
  }

  async disable(chatId: number, number: number) {
    return await this.Model.findOneAndUpdate(
      {chatId, number},
      {active: false},
      {new: false}
    ).lean().exec()
  }
}

