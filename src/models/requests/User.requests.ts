import { ParamsDictionary } from 'express-serve-static-core'
import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enums'

export interface LoginReqBody {
  email: string
  password: string
}

export interface RegisterReqBody {
  name: string
  email: string
  date_of_birth: string
  password: string
  confirm_password: string
}

export interface LogoutTokenReqBody {
  refresh_token: string
}

export interface RefreshTokenReqBody {
  refresh_token: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  type: TokenType
  verify: UserVerifyStatus
  exp: number
  iat: number
}

export interface VerifyEmailTokenReqBody {
  email_verify_token: string
}

export interface ForgotPasswordReqBody {
  email: string
}

export interface VerifyForgotPasswordReqBody {
  verify_forgot_password_token: string
}

export interface ResetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}

export interface UpdateMeBodyReq {
  name?: string
  date_of_birth?: string
  bio?: string
  website?: string
  location?: string
  cover_photo?: string
  avatar?: string
  username?: string
}

export interface GetProfileReqParams {
  username: string
}

export interface FollowReqBody {
  followed_user_id: string
}

export interface UnfollowReqParams extends ParamsDictionary {
  followed_user_id: string
}

export interface ChangePasswordReqBody {
  old_password: string
  password: string
  confirm_new_password: string
}
