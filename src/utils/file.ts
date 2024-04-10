import { Request } from 'express'
import { File } from 'formidable'
import fs from 'fs'
import path from 'path'
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

// Cách xử lý khi upload video và encode
// Có 2 giai đoạn
// Upload video: Upload video thành công thì resolve về cho người dùng
// Encode video: Khai báo thêm 1 url endpoint để check xem cái video đó đã encode xong chưa

export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const nanoId = (await import('nanoid')).nanoid
  const idName = nanoId()
  console.log({ idName })
  const folderPath = path.resolve(UPLOAD_VIDEO_DIR, idName)
  fs.mkdirSync(folderPath)
  const form = formidable({
    uploadDir: folderPath,
    // keepExtensions: true, // ko nên xài vì bị lỗi nếu file có name có 2 dấu '.' là 1321.apptest.mp4
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, // 50mb
    filter: function ({ name, mimetype, originalFilename }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return true
    },
    filename() {
      return idName
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
          video.filepath = video.filepath + '.' + extFile
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
