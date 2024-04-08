import { Request } from 'express'
import { TokenPayload } from '~/models/requests/User.requests'
import User from '~/models/schemas/Users.schema'
declare module 'express' {
  interface Request {
    user?: User
    decoded_refresh_token?: TokenPayload
    decoded_authorization?: TokenPayload
    decoded_email_verify_token?: TokenPayload
    decoded_forgot_password_token?: TokenPayload
  }
}
