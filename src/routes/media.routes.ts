import { Router } from 'express'
import {
  uploadImageController,
  uploadVideoController,
  uploadVideoHLSController,
  videoStatusController
} from '~/controllers/medias.controllers'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const mediaRouter = Router()

/**
 * Description upload image
 * Path: /medias/upload-image
 * Method: post
 * Body: {
 *  image:[]
 * }
 * Headers:{
 *  Authorization: Bearer <access_token>
 *  Content-type: multipart/form-data
 * }
 */
mediaRouter.post('/upload-image', accessTokenValidator, verifyUserValidator, wrapRequestHandler(uploadImageController))

/**
 * Description upload video
 * Path: /medias/upload-video
 * Method: post
 * Body: {
 *  video:[]
 * }
 * Headers:{
 *  Authorization: Bearer <access_token>
 *  Content-type: multipart/form-data
 * }
 */
mediaRouter.post('/upload-video', accessTokenValidator, verifyUserValidator, wrapRequestHandler(uploadVideoController))

/**
 * Description upload video hls
 * Path: /medias/upload-video-hls
 * Method: post
 * Body: {
 *  video:[]
 * }
 * Headers:{
 *  Authorization: Bearer <access_token>
 *  Content-type: multipart/form-data
 * }
 */
mediaRouter.post(
  '/upload-video-hls',
  accessTokenValidator,
  verifyUserValidator,
  wrapRequestHandler(uploadVideoHLSController)
)

/**
 * Description: get status video
 * Path: /medias/video-status
 * Method: get
 * Headers:{
 *  Authorization: Bearer <access_token>
 *  Params: {id: string}
 * }
 */
mediaRouter.get(
  '/video-status/:id',
  accessTokenValidator,
  verifyUserValidator,
  wrapRequestHandler(videoStatusController)
)

export default mediaRouter
