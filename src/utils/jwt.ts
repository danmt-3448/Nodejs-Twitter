import jwt, { SignOptions } from 'jsonwebtoken'
import 'dotenv/config'
import { TokenPayload } from '~/models/requests/User.requests'

export const signToken = ({
  payload,
  secretOrPrivateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: string | object | Buffer
  secretOrPrivateKey: string
  options?: SignOptions
}): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, secretOrPrivateKey, options, (error, token) => {
      if (error) {
        reject(error)
      }
      resolve(token as string)
    })
  })
}

export const verifyToken = ({ token, secretOrPrivateKey }: { token: string; secretOrPrivateKey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPrivateKey, function (error, decoded) {
      if (error) {
        reject(error)
      }
      resolve(decoded as TokenPayload)
    })
  })
}
