import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { LIKE_MESSAGES } from '~/constants/messages'
import { LikeReqBody } from '~/models/requests/Like.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import likesService from '~/services/like.services'

export const likeTweetController = async (
  req: Request<ParamsDictionary, any, LikeReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { body }: { body: LikeReqBody } = req
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await likesService.likeTweet({ tweet_id: body.tweet_id, user_id })

  return res.send({
    message: LIKE_MESSAGES.LIKE_SUCCESSFULLY,
    result
  })
}

export const unLikeTweetController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.params
  const result = await likesService.unLikeTweet({ tweet_id: tweet_id, user_id })

  return res.send({
    message: LIKE_MESSAGES.UNLIKE_SUCCESSFULLY,
    result
  })
}
