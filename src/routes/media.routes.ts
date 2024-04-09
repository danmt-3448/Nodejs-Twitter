import { Router } from 'express'
import { uploadImageSingleController, uploadVideoSingleController } from '~/controllers/medias.controllers'
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
mediaRouter.post(
  '/upload-image',
  accessTokenValidator,
  verifyUserValidator,
  wrapRequestHandler(uploadImageSingleController)
)

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
mediaRouter.post(
  '/upload-video',
  accessTokenValidator,
  verifyUserValidator,
  wrapRequestHandler(uploadVideoSingleController)
)

export default mediaRouter
