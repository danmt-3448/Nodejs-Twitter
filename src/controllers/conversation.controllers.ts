import { Request, Response } from 'express'
import { ConversationReqParams } from '~/models/requests/Conversation.request'
import conversationService from '~/services/conversation.services'

export const getConversationsController = async (req: Request<ConversationReqParams>, res: Response) => {
  const { receiver_id } = req.params
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const sender_id = req.decoded_authorization?.user_id as string
  const result = await conversationService.getConversations({
    sender_id,
    receiver_id,
    limit,
    page
  })
  return res.json({
    result: {
      limit,
      page,
      total_page: Math.ceil(result.total / limit),
      conversations: result.conversations
    },
    message: 'Get conversations successfully'
  })
}
