import { Query } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { MediaTypeQuery, PeopleFollow } from '~/constants/enums'
import { Pagination } from '~/models/requests/Tweet.requests'

export interface IMediaTypeVideo {
  $in: number[]
}
export interface IMatchMediaType {
  $text: {
    $search: string
  }
  'medias.type'?: string | number | IMediaTypeVideo
  user_id?: { $in: ObjectId[] }
}

export interface IMatchMediaTypeHashtag {
  'medias.type'?: string | number | IMediaTypeVideo
  user_id?: { $in: ObjectId[] }
}

export interface IMatchAudience {
  $or: [
    {
      audience: number
    },
    {
      $and: [
        {
          audience: number
        },
        {
          $or: [
            { 'user.twitter_circle': { $in: [ObjectId] } }, // Check if current user's ID is in follower circle
            { 'user._id': ObjectId } // Current user's post
          ]
        }
      ]
    }
  ]
}

export interface SearchReqQuery extends Pagination, Query {
  content: string
  media_type?: MediaTypeQuery
  people_follow?: PeopleFollow
}

export interface SearchHashtagsReqQuery extends Pagination, Query {
  hashtag: string
  media_type?: MediaTypeQuery
  people_follow?: PeopleFollow
}
