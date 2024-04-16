import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKMARK_MESSAGES } from '~/constants/messages'
import { BookmarkReqBody } from '~/models/requests/Bookmark.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import bookmarksService from '~/services/bookmarks.services'

export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { body }: { body: BookmarkReqBody } = req
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await bookmarksService.bookmarkTweet({ tweet_id: body.tweet_id, user_id })

  return res.send({
    message: BOOKMARK_MESSAGES.BOOKMARK_SUCCESSFULLY,
    result
  })
}

export const unBookmarkTweetController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.params
  const result = await bookmarksService.unBookmarkTweet({ tweet_id: tweet_id, user_id })

  return res.send({
    message: BOOKMARK_MESSAGES.UNBOOKMARK_SUCCESSFULLY,
    result
  })
}
