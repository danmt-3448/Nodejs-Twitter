import { ObjectId } from 'mongodb'

interface IFollower {
  _id?: ObjectId
  user_id: ObjectId
  created_at?: Date
  followed_user_id: ObjectId // người dc theo dõi
}

class Follower {
  _id?: ObjectId
  user_id: ObjectId
  created_at?: Date
  followed_user_id: ObjectId
  constructor({ _id, user_id, created_at, followed_user_id }: IFollower) {
    this._id = _id
    this.user_id = user_id
    this.created_at = created_at || new Date()
    this.followed_user_id = followed_user_id
  }
}

export default Follower
