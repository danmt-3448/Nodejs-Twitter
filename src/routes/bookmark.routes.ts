import { Router } from 'express'
import { bookmarkTweetController, unBookmarkTweetController } from '~/controllers/bookmark.controllers'
import { tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const bookmarksRouter = Router()

/**
 * Description create bookmark
 * Path: /
 * Method: post
 * Header: { Authorization: Bearer <access_token> }
 * Body: BookmarkReqBody
 */
bookmarksRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarkTweetController)
)

/**
 * Description delete bookmark
 * Path: /tweet/:tweet_id
 * Method: delete
 * Header: { Authorization: Bearer <access_token> }
 */
bookmarksRouter.delete(
  '/tweet/:tweet_id',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unBookmarkTweetController)
)

export default bookmarksRouter
