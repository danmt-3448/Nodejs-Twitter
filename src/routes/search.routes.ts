import { Router } from 'express'
import { searchController, searchHashtagController } from '~/controllers/search.controllers'
import { paginationValidator, searchHashtagValidator, searchValidator } from '~/middlewares/search.middlewares'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const searchRouter = Router()

/**
 * Description search all
 * Path: /
 * Method: get
 * Header: { Authorization: Bearer <access_token> }
 * Query { limit: number; page: number; content: string;  media_type: MediaTypeQuery }
 * Request: { user_id : req.decodeAuthorization}
 */
searchRouter.get(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  searchValidator,
  paginationValidator,
  wrapRequestHandler(searchController)
)

/**
 * Description search by hashtags
 * Path: /
 * Method: get
 * Header: { Authorization: Bearer <access_token> }
 * Query: { limit: number; page: number; content: string;  media_type: MediaTypeQuery }
 * Request: { user_id : req.decodeAuthorization}
 */
searchRouter.get(
  '/hashtag',
  accessTokenValidator,
  verifyUserValidator,
  searchHashtagValidator,
  paginationValidator,
  wrapRequestHandler(searchHashtagController)
)

export default searchRouter
