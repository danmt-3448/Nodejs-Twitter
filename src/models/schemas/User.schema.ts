import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'

interface IUserType {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth: Date
  password: string
  created_at?: Date
  updated_at?: Date
  email_verify_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus
  twitter_circle?: ObjectId[] //danh sach id nhung nguoi dc user add vao circle
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}

class User {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth: Date
  password: string
  created_at: Date
  updated_at: Date
  email_verify_token: string
  forgot_password_token: string
  verify: UserVerifyStatus
  twitter_circle: ObjectId[] //danh sach id nhung nguoi dc user add vao circle
  bio: string
  location: string
  website: string
  username: string
  avatar: string
  cover_photo: string

  constructor(user: IUserType) {
    const date = new Date()
    this._id = user._id
    this.name = user.name
    this.email = user.email
    this.date_of_birth = user.date_of_birth
    this.password = user.password
    this.created_at = user.created_at || date
    this.updated_at = user.updated_at || date
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify = user.verify || UserVerifyStatus.Unverified
    this.bio = user.bio || ''
    this.location = user.location || ''
    this.website = user.website || ''
    this.username = user.username || ''
    this.avatar = user.avatar || ''
    this.cover_photo = user.cover_photo || ''
    this.twitter_circle = user.twitter_circle || []
  }
}

export default User
