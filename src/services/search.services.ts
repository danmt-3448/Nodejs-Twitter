import 'dotenv/config'
import { ObjectId } from 'mongodb'
import { MediaType, MediaTypeQuery, PeopleFollow, TweetType } from '~/constants/enums'
import { IMatchAudience, IMatchMediaType, IMatchMediaTypeHashtag } from '~/models/requests/Search.requests'
import Follower from '~/models/schemas/Follow.schema'
import databaseService from '~/services/database.services'

class SearchService {
  private $commonsSearchAggregate

  constructor() {
    this.$commonsSearchAggregate = [
      {
        $lookup: {
          from: 'hashtags',
          localField: 'hashtags',
          foreignField: '_id',
          as: 'hashtags'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'mentions',
          foreignField: '_id',
          as: 'mentions'
        }
      },
      {
        $addFields: {
          mentions: {
            $map: {
              input: '$mentions',
              as: 'mention',
              in: {
                _id: '$$mention._id',
                name: '$$mention.name',
                username: '$$mention.username',
                email: '$$mention.email'
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'bookmarks',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'bookmarks'
        }
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'likes'
        }
      },
      {
        $lookup: {
          from: 'tweets',
          localField: '_id',
          foreignField: 'parent_id',
          as: 'tweet_childrens'
        }
      },
      {
        $addFields: {
          bookmarks: {
            $size: '$bookmarks'
          },
          likes: {
            $size: '$likes'
          },
          retweet_count: {
            $size: {
              $filter: {
                input: '$tweet_childrens',
                as: 'item',
                cond: {
                  $eq: ['$$item.type', TweetType.Retweet]
                }
              }
            }
          },
          comment_count: {
            $size: {
              $filter: {
                input: '$tweet_childrens',
                as: 'item',
                cond: {
                  $eq: ['$$item.type', TweetType.Comment]
                }
              }
            }
          },
          quote_count: {
            $size: {
              $filter: {
                input: '$tweet_childrens',
                as: 'item',
                cond: {
                  $eq: ['$$item.type', TweetType.QuoteTweet]
                }
              }
            }
          }
        }
      },
      {
        $project: {
          tweet_childrens: 0,
          user: {
            password: 0,
            email_verify_token: 0,
            forgot_password_token: 0,
            twitter_circle: 0,
            date_of_birth: 0
          }
        }
      }
    ]
  }

  async search({
    limit,
    page,
    content,
    user_id,
    media_type,
    people_follow
  }: {
    limit: number
    page: number
    content: string
    user_id: string
    media_type?: MediaTypeQuery
    people_follow?: string
  }) {
    const user_id_obj = new ObjectId(user_id)
    const $match: IMatchMediaType = { $text: { $search: content } }

    //check is media_type
    if (media_type) {
      if (media_type === MediaTypeQuery.Image) {
        $match['medias.type'] = MediaType.Image
      } else if (media_type === MediaTypeQuery.Video) {
        $match['medias.type'] = {
          $in: [MediaType.Video, MediaType.HLS]
        }
      }
    }
    const $matchAudience: IMatchAudience = {
      $or: [
        {
          audience: 0
        },
        {
          $and: [
            {
              audience: 1
            },
            {
              $or: [
                { 'user.twitter_circle': { $in: [user_id_obj] } }, // Check if current user's ID is in follower circle
                { 'user._id': user_id_obj } // Current user's post
              ]
            }
          ]
        }
      ]
    }

    //check is people_follow
    if (people_follow && people_follow === PeopleFollow.Following) {
      const followed_user_ids = await databaseService.followers
        .find<Follower>(
          {
            user_id: user_id_obj
          },
          {
            projection: {
              followed_user_id: 1,
              _id: 0
            }
          }
        )
        .toArray()

      const ids = followed_user_ids.map((follower) => follower?.followed_user_id as ObjectId)
      // mong muon lun return ve tweet cua ban than
      ids.push(user_id_obj)

      $match['user_id'] = { $in: ids }
    }

    const $defaultAggregate = [
      {
        $match
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user'
        }
      },
      {
        $match: $matchAudience
      }
    ]

    const [result, total] = await Promise.all([
      //search
      databaseService.tweets
        .aggregate([
          ...$defaultAggregate,
          {
            $skip: (page - 1) * limit
          },
          {
            $limit: limit
          },
          ...this.$commonsSearchAggregate
        ])
        .toArray(),
      //count total search
      databaseService.tweets
        .aggregate([
          ...$defaultAggregate,
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])

    const tweet_ids = result.map((item) => item._id as ObjectId)
    const date = new Date()
    // update view to DB
    databaseService.tweets.updateMany(
      {
        _id: {
          $in: tweet_ids
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: date
        }
      }
    )

    return { result, total: total[0]?.total || 0 }
  }

  async searchHashtags({
    limit,
    page,
    hashtag,
    user_id,
    media_type,
    people_follow
  }: {
    limit: number
    page: number
    hashtag: string
    user_id: string
    media_type?: MediaTypeQuery
    people_follow?: string
  }) {
    const user_id_obj = new ObjectId(user_id)
    const $matchMediaTypeHashtag: IMatchMediaTypeHashtag = {}
    if (media_type) {
      if (media_type === MediaTypeQuery.Image) {
        $matchMediaTypeHashtag['medias.type'] = MediaType.Image
      } else if (media_type === MediaTypeQuery.Video) {
        $matchMediaTypeHashtag['medias.type'] = {
          $in: [MediaType.Video, MediaType.HLS]
        }
      }
    }
    const $matchAudience: IMatchAudience = {
      $or: [
        {
          audience: 0
        },
        {
          $and: [
            {
              audience: 1
            },
            {
              $or: [
                { 'user.twitter_circle': { $in: [user_id_obj] } }, // Check if current user's ID is in follower circle
                { 'user._id': user_id_obj } // Current user's post
              ]
            }
          ]
        }
      ]
    }

    //check is people_follow
    if (people_follow && people_follow === PeopleFollow.Following) {
      const followed_user_ids = await databaseService.followers
        .find<Follower>(
          {
            user_id: user_id_obj
          },
          {
            projection: {
              followed_user_id: 1,
              _id: 0
            }
          }
        )
        .toArray()

      const ids = followed_user_ids.map((follower) => follower?.followed_user_id as ObjectId)
      // mong muon lun return ve tweet cua ban than
      ids.push(user_id_obj)

      $matchMediaTypeHashtag['user_id'] = { $in: ids }
    }

    const $defaultAggregate = [
      {
        $match: {
          $text: { $search: hashtag }
        }
      },
      {
        $lookup: {
          from: 'tweets',
          localField: '_id',
          foreignField: 'hashtags',
          as: 'tweets'
        }
      },
      {
        $unwind: {
          path: '$tweets'
        }
      },
      {
        $replaceRoot: {
          newRoot: '$tweets'
        }
      },
      { $match: $matchMediaTypeHashtag },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user'
        }
      },
      {
        $match: $matchAudience
      }
    ]

    const [result, total] = await Promise.all([
      //search
      databaseService.hashtags
        .aggregate([
          ...$defaultAggregate,
          {
            $skip: (page - 1) * limit
          },
          {
            $limit: limit
          },
          ...this.$commonsSearchAggregate
        ])
        .toArray(),
      //count total search
      databaseService.hashtags
        .aggregate([
          ...$defaultAggregate,
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])
    const tweet_ids = result.map((item) => item._id as ObjectId)
    const date = new Date()
    // update view to DB
    databaseService.tweets.updateMany(
      {
        _id: {
          $in: tweet_ids
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: date
        }
      }
    )

    return { result, total: total[0]?.total || 0 }
  }
}
const searchService = new SearchService()
export default searchService
