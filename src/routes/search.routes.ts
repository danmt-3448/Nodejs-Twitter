import { Router } from 'express'
import { searchController, searchHashtagController } from '~/controllers/search.controllers'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const searchRouter = Router()

/**
 * Description search all
 * Path: /
 * Method: get
 * Header: { Authorization: Bearer <access_token> }
 * Query { limit: number; page: number; content: string; user_id: string }
 */
searchRouter.get('/', accessTokenValidator, verifyUserValidator, wrapRequestHandler(searchController))

/**
 * Description search by hashtags
 * Path: /
 * Method: get
 * Header: { Authorization: Bearer <access_token> }
 * Query { limit: number; page: number; hashtag: string; user_id: string }
 */
searchRouter.get('/hashtag', accessTokenValidator, verifyUserValidator, wrapRequestHandler(searchHashtagController))

export default searchRouter
