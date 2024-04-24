import { Router } from 'express'
import { getConversationsController } from '~/controllers/conversation.controllers'
import { getConversationsValidator } from '~/middlewares/conversation.middlewares'
import { paginationValidator } from '~/middlewares/search.middlewares'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const conversationsRouter = Router()

conversationsRouter.get(
  '/receivers/:receiver_id',
  accessTokenValidator,
  verifyUserValidator,
  getConversationsValidator,
  paginationValidator,
  wrapRequestHandler(getConversationsController)
)

export default conversationsRouter
