import { Router } from 'express'
import { createTweetController, getTweetController, getTweetChildrenController } from '~/controllers/tweet.controllers'
import { audienceValidator, createTweetValidator, getTweetChildrenValidator, tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, isLoggedInValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const tweetsRouter = Router()

/**
 * Description create tweet
 * Path: /
 * Method: post
 * Body: TweetReqBody
 * Header: { Authorization: Bearer <access_token> }
 */
tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

/**
 * Description get tweet detail
 * Path: /:tweet_id
 * Method: get
 * Header: { Authorization: Bearer <access_token> }
 */
tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isLoggedInValidator(accessTokenValidator),
  isLoggedInValidator(verifyUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

/**
 * Description get children tweet
 * Path: /:tweet_id/children
 * Method: get
 * Header: { Authorization: Bearer <access_token> }
 * Query: { limit: number, page: number, tweet_type: TweetType }
 */
tweetsRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  isLoggedInValidator(accessTokenValidator),
  isLoggedInValidator(verifyUserValidator),
  audienceValidator,
  getTweetChildrenValidator,
  wrapRequestHandler(getTweetChildrenController)
)

export default tweetsRouter
