import { Router } from 'express'
import { likeTweetController, unLikeTweetController,  } from '~/controllers/like.controllers'
import { tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const likesRouter = Router()

/**
 * Description create like
 * Path: /
 * Method: post
 * Header: { Authorization: Bearer <access_token> }
 * Body: likeReqBody
 */
likesRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapRequestHandler(likeTweetController)
)

/**
 * Description delete like
 * Path: /tweet/:tweet_id
 * Method: delete
 * Header: { Authorization: Bearer <access_token> }
 */
likesRouter.delete(
  '/tweet/:tweet_id',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unLikeTweetController)
)

export default likesRouter
