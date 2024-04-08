import { NextFunction, Request, Response } from 'express'
import { USERS_MESSAGES } from '~/contants/messages'
import path from 'path'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: path.resolve('uploads'),
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 3000 * 1024 // 3MB
  })
  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err)
      return
    }
    return res.json({ fields, files, message: USERS_MESSAGES.UPLOAD_SUCCESS })
  })
}
