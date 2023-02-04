import {IGetHttpTask, IMessageTask, ITask, TaskModel} from '@app/task/TaskModel'
import {TaskType} from '@app/task/enums'


export class TaskRepository {
  constructor(
    private readonly Model: typeof TaskModel
  ) {}


  async createGetHttpTask(
    number: number,
    url: string,
    cron: string,
    chatId: number,
    status: number,
    active: boolean = true
  ): Promise<IGetHttpTask> {
    return await new this.Model({
      number,
      url,
      cron,
      chatId,
      status,
      active,
      type: TaskType.HTTP_GET
    })
      .save()
      .then(doc => doc.toJSON() as IGetHttpTask)
  }

  async findActive(): Promise<ITask[]> {
    return await this.Model.find({active: true}).lean().exec()
  }

  async setGetHttpExecuteInfo(number: number, executeAt: number, lastStatus: number | string) {
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

  async countActiveTasks() {
    return await this.Model.countDocuments({active: true}).exec()
  }

  async createMessageTask(
    number: number,
    message: string,
    cron: string,
    chatId: number
  ): Promise<IMessageTask> {
    return await new this.Model({
      number,
      message,
      cron,
      chatId,
      active: true,
      type: TaskType.MESSAGE
    })
      .save()
      .then(doc => doc.toJSON() as IMessageTask)
  }

  async setMessageExecuteInfo(number: number, executeAt: number) {
    return this.Model.updateOne({number}, {executeAt})
  }

  async enable(chatId: number, number: number) {
    return await this.Model.findOneAndUpdate(
      {chatId, number},
      {active: true},
      {new: false}
    ).lean().exec()
  }
}

