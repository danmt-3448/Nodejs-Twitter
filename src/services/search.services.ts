import 'dotenv/config'
import { ObjectId } from 'mongodb'
import { TweetType } from '~/constants/enums'
import { SearchReqQuery } from '~/models/requests/Search.requests'
import databaseService from '~/services/database.services'

class SearchService {
  async search({ limit, page, content, user_id }: { limit: number; page: number; content: string; user_id: string }) {
    const user_id_obj = new ObjectId(user_id)

    const [result, total] = await Promise.all([
      //search
      databaseService.tweets
        .aggregate([
          {
            $match: {
              $text: {
                $search: content
              }
            }
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
            $match: {
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
                      'user.twitter_circle': {
                        $in: [user_id_obj]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $skip: (page - 1) * limit
          },
          {
            $limit: limit
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
        ])
        .toArray(),
      //count total search
      databaseService.tweets
        .aggregate([
          {
            $match: {
              $text: {
                $search: content
              }
            }
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
            $match: {
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
                      'user.twitter_circle': {
                        $in: [user_id_obj]
                      }
                    }
                  ]
                }
              ]
            }
          },
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

    return { result, total: total[0].total }
  }

  async searchHashtags({
    limit,
    page,
    hashtag,
    user_id
  }: {
    limit: number
    page: number
    hashtag: string
    user_id: string
  }) {
    const user_id_obj = new ObjectId(user_id)
    // const result = await databaseService.hashtags
    //   .aggregate([
    //     {
    //       $match: {
    //         $text: {
    //           $search: hashtag
    //         }
    //       }
    //     },
    //     {
    //       $lookup: {
    //         from: 'tweets',
    //         localField: '_id',
    //         foreignField: 'hashtags',
    //         as: 'tweets'
    //       }
    //     },
    //     {
    //       $unwind: {
    //         path: '$tweets'
    //       }
    //     },
    //     {
    //       $replaceRoot: {
    //         newRoot: '$tweets'
    //       }
    //     },
    //     {
    //       $match: {
    //         $or: [
    //           {
    //             audience: 0
    //           },
    //           {
    //             $and: [
    //               {
    //                 audience: 1
    //               },
    //               {
    //                 'user.twitter_circle': {
    //                   $in: [user_id_obj]
    //                 }
    //               }
    //             ]
    //           }
    //         ]
    //       }
    //     },
    //     {
    //       $skip: (page - 1) * limit
    //     },
    //     {
    //       $limit: limit
    //     },
    //     {
    //       $lookup: {
    //         from: 'hashtags',
    //         localField: 'hashtags',
    //         foreignField: '_id',
    //         as: 'hashtags'
    //       }
    //     },
    //     {
    //       $lookup: {
    //         from: 'users',
    //         localField: 'mentions',
    //         foreignField: '_id',
    //         as: 'mentions'
    //       }
    //     },
    //     {
    //       $addFields: {
    //         mentions: {
    //           $map: {
    //             input: '$mentions',
    //             as: 'mention',
    //             in: {
    //               _id: '$$mention._id',
    //               name: '$$mention.name',
    //               username: '$$mention.username',
    //               email: '$$mention.email'
    //             }
    //           }
    //         }
    //       }
    //     },
    //     {
    //       $lookup: {
    //         from: 'bookmarks',
    //         localField: '_id',
    //         foreignField: 'tweet_id',
    //         as: 'bookmarks'
    //       }
    //     },
    //     {
    //       $lookup: {
    //         from: 'likes',
    //         localField: '_id',
    //         foreignField: 'tweet_id',
    //         as: 'likes'
    //       }
    //     },
    //     {
    //       $lookup: {
    //         from: 'tweets',
    //         localField: '_id',
    //         foreignField: 'parent_id',
    //         as: 'tweet_childrens'
    //       }
    //     },
    //     {
    //       $addFields: {
    //         bookmarks: {
    //           $size: '$bookmarks'
    //         },
    //         likes: {
    //           $size: '$likes'
    //         },
    //         retweet_count: {
    //           $size: {
    //             $filter: {
    //               input: '$tweet_childrens',
    //               as: 'item',
    //               cond: {
    //                 $eq: ['$$item.type', TweetType.Retweet]
    //               }
    //             }
    //           }
    //         },
    //         comment_count: {
    //           $size: {
    //             $filter: {
    //               input: '$tweet_childrens',
    //               as: 'item',
    //               cond: {
    //                 $eq: ['$$item.type', TweetType.Comment]
    //               }
    //             }
    //           }
    //         },
    //         quote_count: {
    //           $size: {
    //             $filter: {
    //               input: '$tweet_childrens',
    //               as: 'item',
    //               cond: {
    //                 $eq: ['$$item.type', TweetType.QuoteTweet]
    //               }
    //             }
    //           }
    //         }
    //       }
    //     },
    //     {
    //       $project: {
    //         tweet_childrens: 0,
    //         user: {
    //           password: 0,
    //           email_verify_token: 0,
    //           forgot_password_token: 0,
    //           twitter_circle: 0,
    //           date_of_birth: 0
    //         }
    //       }
    //     }
    //   ])
    //   .toArray()

    const [result, total] = await Promise.all([
      //search
      databaseService.hashtags
        .aggregate([
          {
            $match: {
              $text: {
                $search: hashtag
              }
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
          {
            $match: {
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
                      'user.twitter_circle': {
                        $in: [user_id_obj]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $skip: (page - 1) * limit
          },
          {
            $limit: limit
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
        ])
        .toArray(),
      //count total search
      databaseService.hashtags
        .aggregate([
          {
            $match: {
              $text: {
                $search: hashtag
              }
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
          {
            $match: {
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
                      'user.twitter_circle': {
                        $in: [user_id_obj]
                      }
                    }
                  ]
                }
              ]
            }
          },
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

    return { result, total: total[0].total }
  }
}
const searchService = new SearchService()
export default searchService
