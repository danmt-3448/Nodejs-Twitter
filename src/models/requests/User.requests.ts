import { ParamsDictionary } from 'express-serve-static-core'
import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enums'

/**
 * @swagger
 * components:
 *   schemas:
 *     # Login body schema
 *     LoginBody:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           example: thanhdan1999@gmail.com
 *         password:
 *           type: string
 *           example: Danmt123@
 *     # Success login schema
 *     SuccessLogin:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjYyNzM4MTBhMDJiYzZmMjU2MDljNzBjIiwidHlwZSI6MCwidmVyaWZ5IjoxLCJpYXQiOjE3MTM5MzAyMDYsImV4cCI6MTcxNDAxNjYwNn0.B6fFHCPRBJbRsVkuGVCAtSPtpeZypwiqgnSSl2xul1o"
 *         refresh_token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjYyNzM4MTBhMDJiYzZmMjU2MDljNzBjIiwidG9rZW5fdHlwZSI6MSwidmVyaWZ5IjoxLCJpYXQiOjE3MTM5MzAyMDYsImV4cCI6MTcyMjU3MDIwNn0.n94OSfbbbmHmjsof7BDmJrRF1tk47m35TEHQwcxOjOA"
 *     # User schema
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: MongoId
 *           example: "66273810a02bc6f25609c70c"
 *         name:
 *           type: string
 *           example: "danmt 2"
 *         email:
 *           type: string
 *           format: email
 *           example: "thanhdan1999+2@gmail.com"
 *         date_of_birth:
 *           type: string
 *           format: ISO8601
 *           example: "1970-01-01T00:00:00.000Z"
 *         created_at:
 *           type: string
 *           format: ISO8601
 *           example: "2024-04-23T04:24:48.824Z"
 *         updated_at:
 *           type: string
 *           format: ISO8601
 *           example: "2024-04-23T04:24:48.824Z"
 *         verify:
 *           $ref: "#components/schemas/UserVerifyStatus"
 *         bio:
 *           type: string
 *           example: "This is a brief description about the user."
 *         location:
 *           type: string
 *           example: "Hanoi, Vietnam"
 *         website:
 *           type: string
 *           example: "https://example.com"
 *         username:
 *           type: string
 *           example: "user66273810a02bc6f25609c70c"
 *         avatar:
 *           type: string
 *           example: "https://example.com/avatar.jpg"
 *         cover_photo:
 *           type: string
 *           example: "https://example.com/cover.jpg"
 *         twitter_circle:
 *           type: array
 *           items:
 *             type: string
 *             format: MongoId
 *           example: ["66273810a02bc6f25609c70c", "66273810a123c6f25gas9c789"]
 *     # User verification status schema
 *     UserVerifyStatus:
 *       type: number
 *       enum: [Unverified, Verified, Banned]
 *       example: 1
 */

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
