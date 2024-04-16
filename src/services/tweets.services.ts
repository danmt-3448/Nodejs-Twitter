import 'dotenv/config'
import { ObjectId, WithId } from 'mongodb'
import { TweetType } from '~/constants/enums'
import { TweetReqBody } from '~/models/requests/Tweet.requests'
import Hashtag from '~/models/schemas/Hashtag.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.services'

class TweetsService {
  async checkAndCreateHashtags({ hashtags }: { hashtags: string[] }) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((item) => {
        return databaseService.hashtags.findOneAndUpdate(
          { name: item },
          { $setOnInsert: new Hashtag({ name: item }) },
          { upsert: true, returnDocument: 'after' }
        )
      })
    )
    return hashtagDocuments.map((item) => (item as WithId<Hashtag>)._id)
  }

  async createTweet({ body, user_id }: { body: TweetReqBody; user_id: string }) {
    const hashtags = await this.checkAndCreateHashtags({ hashtags: body.hashtags })
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        medias: body.medias,
        hashtags,
        mentions: body.mentions,
        parent_id: body.parent_id,
        type: body.type,
        _id: new ObjectId(),
        user_id: new ObjectId(user_id)
      })
    )
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })

    return tweet
  }

  async getTweet({ tweet_id }: { tweet_id: string }) {
    const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(tweet_id) })

    return tweet
  }

  async increaseTweetView({ tweet_id, user_id }: { tweet_id: string; user_id?: string }) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseService.tweets.findOneAndUpdate(
      {
        _id: new ObjectId(tweet_id)
      },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        },
        returnDocument: 'after'
      }
    )

    return result as unknown as WithId<{
      guest_views: number
      user_views: number
      updated_at: Date
    }>
  }

  async getTweetChildren({
    tweet_id,
    tweet_type,
    page = 1,
    limit = 5,
    user_id
  }: {
    tweet_id: string
    tweet_type: TweetType
    page: number
    limit: number
    user_id?: string
  }) {
    const result = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
          }
        },
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
            tweet_childrens: 0
          }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ])
      .toArray()
    const ids = result.map((tweet) => tweet?._id as ObjectId)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()
    const [, total] = await Promise.all([
      // increase guest view or user view of tweet children in DB
      databaseService.tweets.updateMany(
        {
          _id: {
            $in: ids
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      ),
      // get total tweet children of tweet parent
      databaseService.tweets.countDocuments({ parent_id: new ObjectId(tweet_id) })
    ])

    // mutate data to return to client
    result.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })

    return { result, total }
  }
}
const tweetsService = new TweetsService()
export default tweetsService
