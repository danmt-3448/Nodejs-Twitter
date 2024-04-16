import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import {
  ChangePasswordReqBody,
  FollowReqBody,
  GetProfileReqParams,
  LogoutTokenReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  TokenPayload,
  UnfollowReqParams,
  VerifyEmailTokenReqBody
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import {
  ForgotPasswordReqBody,
  LoginReqBody,
  ResetPasswordReqBody,
  VerifyForgotPasswordReqBody
} from '../models/requests/User.requests'
import { ErrorWithStatus } from '~/models/Errors'
import 'dotenv/config'

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login({
    user_id: user_id.toString(),
    verify: user.verify
  })
  return res.send({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const oauthGoogleController = async (req: Request, res: Response) => {
  const { code } = req.query
  const result = await usersService.oauth({ code: code as string })
  const redirectUrl = `${process.env.CLIENT_REDIRECT_CALLBACK as string}?access_token=${
    result.access_token
  }&refresh_token=${result.refresh_token}&new_user=${result.new_user}&verify=${result.verify}`
  return res.redirect(redirectUrl)
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

export const logoutController = async (
  req: Request<ParamsDictionary, unknown, LogoutTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { refresh_token } = req.body
  const result = await usersService.logout({ refresh_token })
  return res.send({ message: USERS_MESSAGES.LOGOUT_SUCCESS, result })
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, unknown, RefreshTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { refresh_token } = req.body
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload

  const result = await usersService.refreshToken({
    user_id: user_id as string,
    verify,
    old_refresh_token: refresh_token,
    exp
  })

  return res.send({ message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS, result })
}

export const verifyEmailTokenController = async (
  req: Request<ParamsDictionary, unknown, VerifyEmailTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    res.status(HTTP_STATUS.NOT_FOUND).send({ message: USERS_MESSAGES.USER_NOT_FOUND })
  }
  // email verified
  if (user?.email_verify_token === '') {
    res.status(HTTP_STATUS.ACCEPTED).send({ message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE })
  }
  const result = await usersService.verifyEmail({ user_id: new ObjectId(user?._id).toString() })
  return res.send({ message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS, result })
}

export const resendVerifyEmailTokenController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).send({ message: USERS_MESSAGES.USER_NOT_FOUND })
  }
  // email verified
  if (user?.verify === UserVerifyStatus.Verified) {
    return res.status(HTTP_STATUS.ACCEPTED).send({ message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE })
  }
  const result = await usersService.resendVerifyEmail({ user_id: new ObjectId(user?._id).toString() })
  return res.send({ message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS, result })
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { _id, verify } = req.user as User
  const result = await usersService.forgotPassword({
    user_id: new ObjectId(_id).toString(),
    verify
  })
  return res.send({
    message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD,
    result
  })
}

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  return res.send({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = await usersService.resetPassword({ user_id, password })
  return res.send({
    message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS,
    result
  })
}

export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await usersService.getMe({ user_id })
  return res.send({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result
  })
}

export const updateMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { body } = req
  const result = await usersService.updateMe({ user_id, payload: body })
  return res.send({ message: USERS_MESSAGES.UPDATE_ME_SUCCESS, result })
}

export const getProfileController = async (req: Request<GetProfileReqParams>, res: Response, next: NextFunction) => {
  const { username } = req.params
  const user = await usersService.getProfile({ username })
  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  return res.send({ message: USERS_MESSAGES.GET_PROFILE_SUCCESS, result: user })
}

export const followController = async (
  req: Request<ParamsDictionary, any, FollowReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { followed_user_id } = req.body
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await usersService.follow({ followed_user_id, user_id })
  return res.send({ message: result === 'followed' ? USERS_MESSAGES.FOLLOWED : USERS_MESSAGES.FOLLOW_SUCCESS })
}

export const unfollowController = async (req: Request<UnfollowReqParams>, res: Response, next: NextFunction) => {
  const { followed_user_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await usersService.unfollow({ followed_user_id, user_id })
  return res.send({
    message: result === 'unfollowed' ? USERS_MESSAGES.ALREADY_UNFOLLOWED : USERS_MESSAGES.UNFOLLOW_SUCCESS
  })
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  await usersService.changePassword({ password: req.body.password, user_id })
  return res.send({ message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS })
}
