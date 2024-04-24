import { Server } from 'socket.io'
import Conversation from '~/models/schemas/Conversation.schema'
import { ObjectId } from 'mongodb'
import conversationsRouter from '~/routes/conversation.routes'
import { ErrorWithStatus } from '~/models/Errors'
import { USERS_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'
import { verifyAccessToken } from '~/middlewares/commons.midlewares'
import { TokenPayload } from '~/models/requests/User.requests'
import { UserVerifyStatus } from '~/constants/enums'
import databaseService from '~/services/database.services'
import { Server as ServerHttp } from 'http'
export const initSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    cors: { origin: 'http://localhost:3000' }
  })

  const users: {
    [key: string]: {
      socket_id: string
    }
  } = {}

  io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth
    const access_token = Authorization?.split(' ')[1]
    try {
      const decoded_authorization = await verifyAccessToken({ access_token })
      const { verify } = decoded_authorization as TokenPayload
      if (verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_VERIFIED,
          status: HTTP_STATUS.FORBIDDEN
        })
      }
      // Truyền decoded_authorization vào socket để sử dụng ở các middleware khác
      socket.handshake.auth.decoded_authorization = decoded_authorization
      socket.handshake.auth.access_token = access_token
      next()
    } catch (error) {
      next({
        message: 'Unauthorized',
        name: 'UnauthorizedError',
        data: error
      })
    }
  })
  io.on('connection', (socket) => {
    const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload
    users[user_id] = {
      socket_id: socket.id
    }
    console.log('connection', socket.id)

    socket.use(async (_package, next) => {
      const { access_token } = socket.handshake.auth
      try {
        await verifyAccessToken({ access_token })
        next()
      } catch (error) {
        return next(new Error('Unauthorized'))
      }
    })

    socket.on('error', (err) => {
      if (err && err.message === 'Unauthorized') {
        socket.disconnect()
      }
    })

    socket.on('send_message', async (data) => {
      const { receiver_id, sender_id, content } = data.payload
      const receiver_socket_id = users[receiver_id]?.socket_id
      const conversation = new Conversation({
        sender_id: new ObjectId(sender_id),
        receiver_id: new ObjectId(receiver_id),
        content: content
      })
      const result = await databaseService.conversations.insertOne(conversation)
      conversation._id = result.insertedId
      if (receiver_socket_id) {
        socket.to(receiver_socket_id).emit('receive_message', {
          payload: conversation
        })
      }
    })

    // only run when client disconnected
    socket.on('disconnect', () => {
      delete users[user_id]
      console.log('disconnect', socket.id)
    })
  })
}
