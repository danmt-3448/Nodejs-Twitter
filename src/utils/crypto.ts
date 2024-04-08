import { createHash } from 'crypto'
import 'dotenv/config'

function sha256(data: string) {
  return createHash('sha256').update(data).digest('hex')
}

export function hashPassword(data: string) {
  return sha256(data) + process.env.DB_PASSWORD_SECRET
}
