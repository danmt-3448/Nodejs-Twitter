import { ParamsDictionary } from 'express-serve-static-core'
export interface ConversationReqParams extends ParamsDictionary {
  receiver_id: string
}
