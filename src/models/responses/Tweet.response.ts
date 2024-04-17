import { TweetType } from '~/constants/enums'
import Tweet from '~/models/schemas/Tweet.schema'

export interface UserTweetFeedRes {
  _id: string
  name: string
  email: string
  created_at: Date
  updated_at: Date
  verify: TweetType
  bio: string
  location: string
  website: string
  username: string
  avatar: string
  cover_photo: string
}

export interface TweetFeedRes extends Tweet {
  user: UserTweetFeedRes
  bookmarks: number
  likes: number
  retweet_count: number
  comment_count: number
  quote_count: number
}
