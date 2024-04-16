import 'dotenv/config'
import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { TWEETS_MESSAGES } from '~/constants/messages'
import { validate } from '~/utils/validation'

export const createLikeValidator = validate(
  checkSchema({
    tweet_id: {
      custom: {
        options: (value) => {
          if (!ObjectId.isValid(value)) {
            throw new Error(TWEETS_MESSAGES.INVALID_TWEET_ID)
          }
          return true
        }
      }
    }
  })
)

export const unLikeValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(TWEETS_MESSAGES.INVALID_TWEET_ID)
            }
            return true
          }
        }
      }
    },
    ['params']
  )
)
