import 'dotenv/config'
import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { BOOKMARK_MESSAGES } from '~/constants/messages'
import { validate } from '~/utils/validation'

export const createBookmarkValidator = validate(
  checkSchema({
    tweet_id: {
      custom: {
        options: (value) => {
          if (!ObjectId.isValid(value)) {
            throw new Error(BOOKMARK_MESSAGES.TWEET_ID_INVALID)
          }
          return true
        }
      }
    }
  })
)

export const unBookmarkValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(BOOKMARK_MESSAGES.TWEET_ID_INVALID)
            }
            return true
          }
        }
      }
    },
    ['params']
  )
)
