import { checkSchema } from 'express-validator'
import { userIdSchema } from '~/middlewares/commons.midlewares'
import { validate } from '~/utils/validation'

export const getConversationsValidator = validate(
  checkSchema(
    {
      receiver_id: userIdSchema
    },
    ['params']
  )
)
