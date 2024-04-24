import { createHash } from 'crypto'
import 'dotenv/config'
import { envConfig } from '~/constants/config'

function sha256(data: string) {
  return createHash('sha256').update(data).digest('hex')
}

export function hashPassword(data: string) {
  return sha256(data) + envConfig.passwordSecret
}
