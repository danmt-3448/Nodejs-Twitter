import { Router } from 'express'
import {
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailTokenController,
  resetPasswordController,
  verifyEmailTokenController,
  verifyForgotPasswordController,
  updateMeController,
  getProfileController,
  followController,
  unfollowController,
  changePasswordController,
  oauthGoogleController,
  refreshTokenController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/commons.midlewares'
import {
  accessTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordTokenValidator,
  verifyEmailTokenValidator,
  verifyForgotPasswordTokenValidator,
  verifyUserValidator,
  updateMeValidator,
  followValidator,
  unfollowValidator,
  changePasswordValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeBodyReq } from '~/models/requests/User.requests'
import { wrapRequestHandler } from '~/utils/handlers'
const usersRouter = Router()

/**
 * Description login a user
 * Path: /login
 * Method: post
 * Body: {
 *          email: string,
 *          password: string,
 *        }
 */
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 * Description login oauth google
 * Path: /oauth/google
 * Method: get
 * Query: {code: string}
 */
usersRouter.get('/oauth/google', wrapRequestHandler(oauthGoogleController))

/**
 * Description register a user
 * Path: /register
 * Method: post
 * Body: {
 *          name:string,
 *          email: string,
 *          password: string,
 *          confirm_password: string,
 *          day_of_birth: ISO8601
 *        }
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

/**
 * Description logout a user
 * Path: /logout
 * Method: post
 * Header: {Authorization: Bearer <access_token>}
 * Body: { refresh_token: string }
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

/**
 * Description refresh token of user
 * Path: /refresh_token
 * Method: post
 * Body: { refresh_token: string }
 */
usersRouter.post('/refresh_token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

/**
 * Description verify email
 * Path: /verify-email
 * Method: post
 * Body: { refresh_token: string }
 */
usersRouter.post('/verify-email', verifyEmailTokenValidator, wrapRequestHandler(verifyEmailTokenController))

/**
 * Description: resend verify email
 * Path: /resend-verify-email
 * Method: post
 * Header: { Authorization: Bearer <access_token> }
 * Body: {}
 */
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailTokenController))

/**
 * Description: forgot password
 * Path: /forgot-password
 * Method: post
 * Body: { email: string }
 */
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

/**
 * Description: Verify link forgot password token
 * Path: /verify-forgot-password
 * Method: post
 * Body: { forgot_password_token: string }
 */
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)

/**
 * Description: reset password
 * Path: /reset-password
 * Method: post
 * Body: { forgot_password_token: string, password: string, confirm_password: string }
 */
usersRouter.post('/reset-password', resetPasswordTokenValidator, wrapRequestHandler(resetPasswordController))

/**
 * Description: get profile me
 * Path: /me
 * Method: get
 * Header: { Authorization: Bearer <access_token> }
 */
usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

/**
 * Description: update profile me
 * Path: /me
 * Method: patch
 * Header: { Authorization: Bearer <access_token> }
 * Body: UserSchema
 *
 */
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifyUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeBodyReq>([
    'name',
    'date_of_birth',
    'bio',
    'website',
    'location',
    'cover_photo',
    'avatar',
    'username'
  ]),
  wrapRequestHandler(updateMeController)
)

/**
 * Description: get user info
 * Path: /:username
 * Method: get
 */
usersRouter.get('/:username', wrapRequestHandler(getProfileController))

/**
 * Description: Follow someone
 * Path: /follow
 * Method: post
 * Header: { Authorization: Bearer <access_token> }
 * Body: { followed_user_id: string }
 */
usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifyUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)

/**
 * Description: UnFollow someone
 * Path: /unfollow/:followed_user_id
 * Method: Delete
 * Header: { Authorization: Bearer <access_token> }
 * Body: { followed_user_id: string }
 */
usersRouter.delete(
  '/unfollow/:followed_user_id',
  accessTokenValidator,
  verifyUserValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
)

/**
 * Description: Change password
 * Path: /change-password
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: { old_password: string, password: string, confirm_new_password:string }
 */
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifyUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

export default usersRouter
