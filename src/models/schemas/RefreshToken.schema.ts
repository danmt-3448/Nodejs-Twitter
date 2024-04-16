import { ObjectId } from 'mongodb'

// FE connect to BE
interface IRefreshToken {
  _id?: ObjectId
  token: string
  created_at?: Date
  user_id: ObjectId
  iat: number
  exp: number
}

// BE connect to DB
class RefreshToken {
  _id?: ObjectId
  token: string
  created_at: Date
  user_id: ObjectId
  iat: Date
  exp: Date
  constructor({ token, _id, created_at, user_id, iat, exp }: IRefreshToken) {
    this.token = token
    this._id = _id
    this.created_at = created_at || new Date()
    this.user_id = user_id
    this.iat = new Date(iat * 1000) // convert epoch time to Date
    this.exp = new Date(exp * 1000) // convert epoch time to Date

    //epoch time (https://www.epochconverter.com/)
  }
}

export default RefreshToken
