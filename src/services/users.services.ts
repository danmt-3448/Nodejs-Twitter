import axios from 'axios'
import 'dotenv/config'
import { ObjectId } from 'mongodb'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { RegisterReqBody, UpdateMeBodyReq } from '~/models/requests/User.requests'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'

const PROJECTION = { password: 0, forgot_password_token: 0, email_verify_token: 0 }
class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, type: TokenType.AccessToken, verify },
      secretOrPrivateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
    })
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp
        },
        secretOrPrivateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
      })
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      secretOrPrivateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, type: TokenType.EmailVerifyToken, verify },
      secretOrPrivateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, type: TokenType.ForgotPasswordToken, verify },
      secretOrPrivateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN }
    })
  }

  private signAccessAndRefreshToken = async ({
    user_id,
    verify,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    exp?: number
  }): Promise<{ access_token: string; refresh_token: string }> => {
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp })
    ])
    return { access_token, refresh_token }
  }

  private async getOauthGoogleToken({ code }: { code: string }) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post(`https://oauth2.googleapis.com/token`, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }

  private async getGoogleUserInfo({ access_token, id_token }: { access_token: string; id_token: string }) {
    const { data } = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo`, {
      headers: {
        Authorization: `Bearer ${id_token}`
      },
      params: {
        access_token,
        alt: 'json'
      }
    })
    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  private decodeRefreshToken({ token }: { token: string }) {
    return verifyToken({ secretOrPrivateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string, token })
  }

  async addRefreshTokenIntoDB({ user_id, token }: { user_id: string; token: string }) {
    const { exp, iat } = await this.decodeRefreshToken({ token })

    const result = await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token, iat, exp })
    )
    return result
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const { access_token, refresh_token } = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await this.addRefreshTokenIntoDB({ user_id: user_id.toString(), token: refresh_token })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        email_verify_token,
        _id: new ObjectId(user_id),
        username: `user${user_id.toString()}`
      })
    )

    return {
      access_token,
      refresh_token
    }
  }

  async checkExistEmail(email: string) {
    const user = await databaseService.users.findOne({ email })
    return user
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const { access_token, refresh_token } = await this.signAccessAndRefreshToken({ user_id, verify })
    await this.addRefreshTokenIntoDB({ user_id: user_id, token: refresh_token })
    return { access_token, refresh_token }
  }

  async oauth({ code }: { code: string }) {
    const { access_token, id_token } = await this.getOauthGoogleToken({ code })
    const userInfo = await this.getGoogleUserInfo({ access_token, id_token })
    if (!userInfo.email) {
      throw new ErrorWithStatus({ message: USERS_MESSAGES.GMAIL_NOT_VERIFIED, status: HTTP_STATUS.BAD_REQUEST })
    }
    const user = await this.checkExistEmail(userInfo.email)

    if (user) {
      const { access_token, refresh_token } = await this.signAccessAndRefreshToken({
        user_id: new ObjectId(user._id).toString(),
        verify: user.verify
      })
      await this.addRefreshTokenIntoDB({ user_id: new ObjectId(user._id).toString(), token: refresh_token })
      return {
        access_token,
        refresh_token,
        new_user: 0,
        verify: user.verify
      }
    } else {
      // random string password
      const password = Math.random().toString(36).substring(2, 15)
      // dang ki
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password
      })
      return {
        ...data,
        new_user: 1,
        verify: UserVerifyStatus.Unverified
      }
    }
  }

  async logout({ refresh_token }: { refresh_token: string }) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
  }

  async refreshToken({
    user_id,
    verify,
    old_refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    old_refresh_token: string
    exp: number
  }) {
    const [{ access_token, refresh_token }] = await Promise.all([
      this.signAccessAndRefreshToken({ user_id, verify, exp }),
      databaseService.refreshTokens.deleteOne({ token: old_refresh_token })
    ])
    await this.addRefreshTokenIntoDB({ user_id: user_id as string, token: refresh_token })

    return { access_token, refresh_token }
  }

  async verifyEmail({ user_id }: { user_id: string }) {
    const [{ access_token, refresh_token }] = await Promise.all([
      this.signAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    ])

    await this.addRefreshTokenIntoDB({ user_id, token: refresh_token })

    return {
      access_token,
      refresh_token
    }
  }
  async resendVerifyEmail({ user_id }: { user_id: string }) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })

    console.log('resend email verify token', email_verify_token)
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    console.log({ forgot_password_token })
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: ''
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
  }
  async getMe({ user_id }: { user_id: string }) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) }, { projection: PROJECTION })
    return user
  }
  async updateMe({ user_id, payload }: { user_id: string; payload: UpdateMeBodyReq }) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: _payload as UpdateMeBodyReq & { date_of_birth?: Date },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: PROJECTION
      }
    )
    return user
  }
  async getProfile({ username }: { username: string }) {
    const user = await databaseService.users.findOne(
      { username },
      { projection: { ...PROJECTION, created_at: 0, updated_at: 0, verify: 0 } }
    )
    return user
  }

  async follow({
    user_id,
    followed_user_id
  }: {
    user_id: string
    followed_user_id: string
  }): Promise<'followed' | void> {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower) {
      return 'followed'
    }
    await databaseService.followers.insertOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id),
      _id: new ObjectId()
    })
    return
  }

  async unfollow({ user_id, followed_user_id }: { user_id: string; followed_user_id: string }) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (!follower) {
      return 'unfollowed'
    }
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return
  }

  async changePassword({ password, user_id }: { password: string; user_id: string }) {
    await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(password)
        },
        $currentDate: { updated_at: true }
      }
    )
    return
  }
}
const usersService = new UsersService()
export default usersService
