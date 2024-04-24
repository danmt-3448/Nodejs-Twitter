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
} from '~/controllers/user.controllers'
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
import databaseService from '~/services/database.services'
import { wrapRequestHandler } from '~/utils/handlers'
const usersRouter = Router()

/**
 * @swagger
 * /users/login:
 *   post:
 *     tags:
 *       - users
 *     summary: Đăng nhập
 *     operationId: login
 *     requestBody:
 *       description: Update an existent pet in the store
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#components/schemas/LoginBody"
 *     responses:
 *       "200":
 *         description: Dang nhap thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login success
 *                 result:
 *                   $ref: "#components/schemas/SuccessLogin"
 *       "400":
 *         description: Bad request
 *       "404":
 *         description: User not found
 *       "422":
 *         description: Validation exception
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
 * Header: {Authorization: Bearer <access_token>}
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
 * @swagger
 * /users/me:
 *   get:
 *     tags:
 *       - users
 *     summary: Lấy thông tin người dùng
 *     operationId: getMe
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       default:
 *         description: Lấy thông tin người dùng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin hồ sơ của tôi thành công
 *                 result:
 *                   $ref: "#components/schemas/User"
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

// START TEST
usersRouter.get(
  '/test/test',
  wrapRequestHandler(async (req, res, next) => {
    const userTestData = []
    function randomNumber() {
      return Math.floor(Math.random() * 100) + 1
    }
    for (let i = 1; i <= 1000; i++) {
      userTestData.push({
        name: `user_${i}`,
        age: randomNumber(),
        sex: i % 2 === 0 ? 'male' : 'female'
      })
    }
    await databaseService.test.insertMany(userTestData)
    res.json({ message: 'insert DB success' })
  })
)

// END TEST

export default usersRouter
