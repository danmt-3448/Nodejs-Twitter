import { ObjectId } from 'mongodb'

// FE connect to BE
interface IRefreshToken {
  _id?: ObjectId
  token: string
  created_at?: Date
  user_id: ObjectId
}

// BE connect to DB 
class RefreshToken {
  _id?: ObjectId
  token: string
  created_at: Date
  user_id: ObjectId
  constructor({ token, _id, created_at, user_id }: IRefreshToken) {
    this.token = token
    this._id = _id
    this.created_at = created_at || new Date()
    this.user_id = user_id
  }
}

export default RefreshToken
