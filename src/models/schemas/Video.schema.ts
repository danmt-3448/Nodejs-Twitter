import { ObjectId } from 'mongodb'
import { EncodingStatus } from '~/constants/enums'

interface IVideoStatus {
  _id?: ObjectId
  name: string
  message?: string
  status: EncodingStatus
  created_at?: Date
  updated_at?: Date
}

export default class VideoStatus {
  _id?: ObjectId
  name: string
  message: string
  status: EncodingStatus
  created_at: Date
  updated_at: Date
  constructor({ _id, name, message, status, created_at, updated_at }: IVideoStatus) {
    const date = new Date()

    this._id = _id
    this.name = name
    this.message = message || ''
    this.status = status
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
