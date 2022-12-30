import {Error} from 'mongoose'


export class ApplicationError extends Error {
  message: string

  constructor(message: string) {
    super(message)
    this.message = message
  }
}
