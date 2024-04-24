import 'dotenv/config'
import { NextFunction, Request, Response } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { envConfig } from '~/constants/config'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { REGEX_USERNAME } from '~/constants/regex'
import { userIdSchema, verifyAccessToken } from '~/middlewares/commons.midlewares'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import usersService from '~/services/user.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const passwordSchema: ParamSchema = {
  notEmpty: { errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED },
  isString: { errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING },
  isLength: { options: { min: 6, max: 50 }, errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50 },
  isStrongPassword: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG,
    options: { minLength: 6, minLowercase: 1, minNumbers: 1, minSymbols: 1, minUppercase: 1 }
  },
  trim: true
}
const confirmPasswordSchema: ParamSchema = {
  notEmpty: { errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED },
  isString: { errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING },
  isLength: {
    options: { min: 6, max: 50 },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG,
    options: { minLength: 6, minLowercase: 1, minNumbers: 1, minSymbols: 1, minUppercase: 1 }
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      }
      return true
    }
  },
  trim: true
}
const confirmNewPasswordSchema: ParamSchema = {
  notEmpty: { errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED },
  isString: { errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING },
  isLength: {
    options: { min: 6, max: 50 },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG,
    options: { minLength: 6, minLowercase: 1, minNumbers: 1, minSymbols: 1, minUppercase: 1 }
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      }
      return true
    }
  },
  trim: true
}
const emailSchema: ParamSchema = {
  isEmail: { errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID },
  notEmpty: { errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED },
  trim: true
}
const forgotPasswordToken: ParamSchema = {
  notEmpty: { errorMessage: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED },
  custom: {
    options: async (value, { req }) => {
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPrivateKey: envConfig.jwtSecretForgotPasswordToken
        })
        const user = await databaseService.users.findOne({
          _id: new ObjectId(decoded_forgot_password_token.user_id)
        })
        if (!user) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        } else if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.INVALID_FORGOT_PASSWORD_TOKEN,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        req.user = user
        req.decoded_forgot_password_token = decoded_forgot_password_token
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: capitalize((error as JsonWebTokenError).message),
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        throw error
      }
      return true
    }
  },
  trim: true
}
const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: { strict: true, strictSeparator: true },
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
  }
}
const nameSchema: ParamSchema = {
  isString: { errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING },
  isLength: { options: { min: 1, max: 100 }, errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100 },
  trim: true
}
const imageSchema: ParamSchema = {
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH
  },
  trim: true
}
const bioSchema: ParamSchema = {
  isString: {
    errorMessage: USERS_MESSAGES.BIO_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 200
    },
    errorMessage: USERS_MESSAGES.BIO_LENGTH
  },
  trim: true
}
const locationSchema: ParamSchema = {
  isString: {
    errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 200
    },
    errorMessage: USERS_MESSAGES.LOCATION_LENGTH
  },
  trim: true
}
const websiteSchema: ParamSchema = {
  isString: {
    errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 200
    },
    errorMessage: USERS_MESSAGES.WEBSITE_LENGTH
  },
  trim: true
}
const usernameSchema: ParamSchema = {
  isString: {
    errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_STRING
  },
  custom: {
    options: async (value: string) => {
      if (!REGEX_USERNAME.test(value)) {
        throw Error(USERS_MESSAGES.USERNAME_INVALID)
      }
      const user = await databaseService.users.findOne({ username: value })
      if (user) {
        throw Error(USERS_MESSAGES.USERNAME_EXISTED)
      }
      return
    }
  },
  trim: true
}

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (!user) throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            req.user = user
            return true
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        notEmpty: { errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED }
      },
      email: {
        ...emailSchema,
        custom: {
          options: async (value) => {
            const isExistEmail = await usersService.checkExistEmail(value)
            if (isExistEmail) throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS)

            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      day_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || '').split(' ')[1]

            return verifyAccessToken({ access_token, req: req as Request })
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPrivateKey: envConfig.jwtSecretRefreshToken }),
                databaseService.refreshTokens.findOne({ token: value })
              ])

              if (!refresh_token || refresh_token === null) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              ;(req as TokenPayload).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyEmailTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPrivateKey: envConfig.jwtSecretEmailVerifyToken
              })
              ;(req as TokenPayload).decoded_email_verify_token = decoded_email_verify_token
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        },
        trim: true
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value, { req }) => {
            const user = await usersService.checkExistEmail(value)
            if (!user) {
              throw new Error(USERS_MESSAGES.USER_NOT_FOUND)
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema({ forgot_password_token: forgotPasswordToken }, ['body'])
)

export const resetPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordToken,
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)

export const verifyUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    next(
      new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    )
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true
      },
      date_of_birth: { ...dateOfBirthSchema, optional: true },
      bio: {
        ...bioSchema,
        optional: true
      },
      location: {
        ...locationSchema,
        optional: true
      },
      website: {
        ...websiteSchema,
        optional: true
      },
      username: {
        ...usernameSchema,
        optional: true
      },
      avatar: {
        ...imageSchema,
        optional: true
      },
      cover_photo: {
        ...imageSchema,
        optional: true
      }
    },
    ['body']
  )
)

export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: userIdSchema
    },
    ['body']
  )
)

export const unfollowValidator = validate(
  checkSchema(
    {
      followed_user_id: userIdSchema
    },
    ['params']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value, { req }) => {
            const { user_id } = (req as Request).decoded_authorization as TokenPayload
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
            })

            if (!user) {
              throw new ErrorWithStatus({ message: USERS_MESSAGES.USER_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
            }

            const { password } = user
            const isMath = hashPassword(value) === password
            if (!isMath) {
              throw Error(USERS_MESSAGES.OLD_PASSWORD_NOT_MATCH)
            }
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmNewPasswordSchema
    },
    ['body']
  )
)

export const isLoggedInValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return middleware(req, res, next)
    }

    next()
  }
}
