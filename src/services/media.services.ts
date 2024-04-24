import 'dotenv/config'
import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getFiles, getNameFromFullname, handleUploadImage, handleUploadVideo } from '~/utils/file'
import fsPromise from 'fs/promises'
import { envConfig, isProduction } from '~/constants/config'
import { File } from 'formidable'
import { EncodingStatus, MediaType } from '~/constants/enums'
import { IMediaType } from '~/models/Others'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import databaseService from '~/services/database.services'
import VideoStatus from '~/models/schemas/Video.schema'
import { uploadFileToS3 } from '~/utils/s3'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import { rimrafSync } from 'rimraf'
class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }
  async enqueue(item: string) {
    this.items.push(item)
    const idName = getNameFromFullname(item.split('/').pop() as string)
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: idName,
        status: EncodingStatus.Pending
      })
    )
    this.processEncode()
  }
  async processEncode() {
    if (this.encoding) return
    if (this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]

      const idName = getNameFromFullname(videoPath.split('/').pop() as string)
      await databaseService.videoStatus.updateOne(
        {
          name: idName
        },
        {
          $set: {
            status: EncodingStatus.Processing
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
      try {
        this.items.shift()
        await encodeHLSWithMultipleVideoStreams(videoPath)
        await fsPromise.unlink(videoPath)

        const files = getFiles(path.resolve(UPLOAD_VIDEO_DIR, idName))
        await Promise.all(
          files.map((filepath) => {
            const filename = 'videos-hls' + filepath.replace(path.resolve(UPLOAD_VIDEO_DIR), '')
            return uploadFileToS3({
              filepath,
              filename
            })
          })
        )

        rimrafSync(path.resolve(UPLOAD_VIDEO_DIR, idName))
        await databaseService.videoStatus.updateOne(
          {
            name: idName
          },
          {
            $set: {
              status: EncodingStatus.Success
            },
            $currentDate: {
              updated_at: true
            }
          }
        )
        console.log(`Encode video ${videoPath} success`)
      } catch (error) {
        await databaseService.videoStatus
          .updateOne(
            {
              name: idName
            },
            {
              $set: {
                status: EncodingStatus.Failed
              },
              $currentDate: {
                updated_at: true
              }
            }
          )
          .catch((err) => {
            console.error('Update video status error', err)
          })
        console.error(`Encode video ${videoPath} error`)
        console.error(error)
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log('Encode video queue is empty')
    }
  }
}

const queue = new Queue()

class MediasService {
  async uploadImage(req: Request) {
    const files: File[] = await handleUploadImage(req)
    const urls: IMediaType[] = await Promise.all(
      files.map(async (file: File) => {
        const newName = getNameFromFullname(file.newFilename)
        const newFullFilename = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFilename)
        await sharp(file.filepath).jpeg().toFile(newPath)
        const s3Result = await uploadFileToS3({
          filename: 'images/' + newFullFilename,
          filepath: file.filepath
        })
        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
        }
      })
    )
    return urls
  }

  async uploadVideo(req: Request) {
    const files: File[] = await handleUploadVideo(req)
    const results: IMediaType[] = await Promise.all(
      files.map(async (file) => {
        const s3Result = await uploadFileToS3({
          filename: 'videos/' + file.newFilename,
          filepath: file.filepath
        })
        const directoryPath = path.dirname(file.filepath)
        fsPromise.rm(directoryPath, { recursive: true, force: true })

        return {
          type: MediaType.Video,
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string
        }
      })
    )

    return results
  }

  async uploadVideoHLS(req: Request) {
    const files: File[] = await handleUploadVideo(req)
    const result: IMediaType[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename)
        queue.enqueue(file.filepath)

        return {
          type: MediaType.HLS,
          url: isProduction
            ? `${envConfig.host}/static/video-hls/${newName}/master.m3u8`
            : `http://localhost:${envConfig.port}/static/video-hls/${newName}/master.m3u8`
        }
      })
    )

    return result
  }

  async getVideoStatus({ id }: { id: string }) {
    const result = await databaseService.videoStatus.findOne({ name: id })
    return result
  }
}
const mediasService = new MediasService()
export default mediasService
