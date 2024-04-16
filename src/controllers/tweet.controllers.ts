import { ParamsDictionary } from 'express-serve-static-core'
import { NextFunction, Request, Response } from 'express'
import { TweetParam, TweetQuery, TweetReqBody } from '~/models/requests/Tweet.requests'
import tweetsService from '~/services/tweets.services'
import { TokenPayload } from '~/models/requests/User.requests'
import { TWEETS_MESSAGES } from '~/constants/messages'
import { TweetType } from '~/constants/enums'

export const createTweetController = async (
  req: Request<ParamsDictionary, any, TweetReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { body }: { body: TweetReqBody } = req
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetsService.createTweet({ body, user_id })

  return res.send({
    message: TWEETS_MESSAGES.CREATE_TWEET_SUCCESSFULLY,
    result
  })
}

export const getTweetController = async (req: Request, res: Response, next: NextFunction) => {
  const { tweet_id } = req.params
  const result = await tweetsService.increaseTweetView({ tweet_id, user_id: req.decoded_authorization?.user_id })

  return res.send({
    message: TWEETS_MESSAGES.GET_TWEET_SUCCESSFULLY,
    result: {
      ...req.tweet,
      guest_views: result.guest_views,
      user_views: result.user_views,
      views: result.guest_views + result.user_views,
      updated_at: result.updated_at
    }
  })
}

export const getTweetChildrenController = async (req: Request<TweetParam, any, any, TweetQuery>, res: Response) => {
  const { tweet_id } = req.params
  const tweet_type = Number(req.query.tweet_type) as TweetType
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const user_id = req.decoded_authorization?.user_id
  const { result, total } = await tweetsService.getTweetChildren({
    tweet_id,
    tweet_type,
    page,
    limit,
    user_id
  })
  return res.send({
    message: TWEETS_MESSAGES.GET_TWEET_CHILDREN_SUCCESSFULLY,
    result: {
      data: result,
      total: total,
      page,
      limit,
      total_page: Math.ceil(total / Number(limit)),
      tweet_type
    }
  })
}
