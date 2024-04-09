import { Request } from 'express'
import { File } from 'formidable'
import fs from 'fs'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/contants/dir'

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true // mục đích là để tạo folder nested
      })
    }
  })
}
export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    keepExtensions: true,
    maxFiles: 4,
    maxFileSize: 3000 * 1024, // 3MB = 3000 * 1024
    maxTotalFileSize: 3000 * 1024 * 4,
    filter: function ({ name, mimetype, originalFilename }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return true
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, _, files) => {
      if (err) {
        reject(err)
      }
      if (!files.image) {
        reject(new Error('File is empty'))
      }

      resolve(files.image as File[])
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR,
    // keepExtensions: true, // ko nên xài vì bị lỗi nếu file có name có 2 dấu '.' là 1321.apptest.mp4
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, // 50mb
    filter: function ({ name, mimetype, originalFilename }) {
      console.log({ name })
      console.log({ mimetype })
      console.log({ originalFilename })

      const valid =
        (name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))) ||
        mimetype?.includes('mov')
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return true
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, _, files) => {
      if (err) {
        reject(err)
      }
      if (!files.video) {
        reject(new Error('File is empty'))
      }

      const videos = files.video as File[]
      videos?.length > 0 &&
        videos.forEach((video) => {
          const extFile = getExtension(video.originalFilename as string)
          fs.renameSync(video.filepath, video.filepath + '.' + extFile)
          video.newFilename = video.newFilename + '.' + extFile
        })

      resolve(files.video as File[])
    })
  })
}
export const getNameFromFullname = (fullname: string) => {
  const namearr = fullname.split('.')
  namearr.pop()
  return namearr.join('')
}

export const getExtension = (fullname: string) => {
  const namearr = fullname.split('.')
  return namearr[namearr.length - 1]
}
