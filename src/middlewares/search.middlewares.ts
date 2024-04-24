import { checkSchema } from 'express-validator'
import { MediaTypeQuery, PeopleFollow } from '~/constants/enums'
import { PAGINATION, SEARCH_MESSAGES } from '~/constants/messages'
import { validate } from '~/utils/validation'

export const paginationValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: {
          errorMessage: PAGINATION.LIMIT_INVALiD
        },
        custom: {
          options: async (value) => {
            const limit = Number(value)
            if (limit > 100 || limit < 1) {
              throw new Error(PAGINATION.LIMIT_MAX_MIN)
            }
            return true
          }
        }
      },
      page: {
        isNumeric: {
          errorMessage: PAGINATION.PAGE_INVALiD
        },
        custom: {
          options: async (value) => {
            const page = Number(value)
            if (page < 1) {
              throw new Error(PAGINATION.PAGE_MIN)
            }
            return true
          }
        }
      }
    },
    ['query']
  )
)

export const searchValidator = validate(
  checkSchema(
    {
      content: {
        isString: {
          errorMessage: SEARCH_MESSAGES.CONTENT_INVALID
        }
      },
      media_type: {
        optional: true,
        isIn: {
          options: [Object.values(MediaTypeQuery)]
        },
        errorMessage: SEARCH_MESSAGES.MEDIA_TYPE_INVALID
      },
      people_follow: {
        optional: true,
        isIn: {
          options: [Object.values(PeopleFollow)],
          errorMessage: SEARCH_MESSAGES.PEOPLE_FOLLOW_INVALID
        }
      }
    },
    ['query']
  )
)

export const searchHashtagValidator = validate(
  checkSchema(
    {
      hashtag: {
        isString: {
          errorMessage: SEARCH_MESSAGES.CONTENT_INVALID
        }
      },
      media_type: {
        optional: true,
        isIn: {
          options: [Object.values(MediaTypeQuery)]
        },
        errorMessage: SEARCH_MESSAGES.MEDIA_TYPE_INVALID
      },
      people_follow: {
        optional: true,
        isIn: {
          options: [Object.values(PeopleFollow)],
          errorMessage: SEARCH_MESSAGES.PEOPLE_FOLLOW_INVALID
        }
      }
    },
    ['query']
  )
)
