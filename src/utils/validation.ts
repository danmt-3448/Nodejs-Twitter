import { NextFunction, Request, Response } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus, ErrorsType } from '~/models/Errors'

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    const errorsObject = errors.mapped()

    const entityError = new EntityError({ errors: {} })

    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
        /**
         * Sample !== entity error
          {
            "message": "......"
          }
         */
      }

      entityError.errors[key] = errorsObject[key]
    }
    /**
     * Sample entity error 
      {
        "message": "Validation error",
          "errors": {
            "password": "Confirm password length must be from 6 to 50",
            "confirm_password": "Confirm password must be the same as password",
            "email": "Email already exists"
          }
      }
     */
    next(entityError)
  }
}
