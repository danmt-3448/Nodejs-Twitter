import 'dotenv/config'
import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/contants/dir'
import { getNameFromFullname, handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/contants/config'
import { File } from 'formidable'
import { MediaType } from '~/contants/enums'
import { IMediaType } from '~/models/Others'

class MediasService {
  async uploadImage(req: Request) {
    const files: File[] = await handleUploadImage(req)
    const urls: IMediaType[] = await Promise.all(
      files.map(async (file: File) => {
        const newName = getNameFromFullname(file.newFilename)
        const newFullFilename = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFilename)
        await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath)
        return {
          type: MediaType.Image,
          url: isProduction
            ? `${process.env.HOST}/static/image/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`
        }
      })
    )
    return urls
  }

  async uploadVideo(req: Request) {
    const files: File[] = await handleUploadVideo(req)
    const result: IMediaType[] = await files.map((file) => {
      return {
        type: MediaType.Video,
        url: isProduction
          ? `${process.env.HOST}/static/video/${file.newFilename}`
          : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`
      }
    })

    return result
  }
}
const mediasService = new MediasService()
export default mediasService
