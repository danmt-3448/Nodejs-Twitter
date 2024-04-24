import { S3 } from '@aws-sdk/client-s3'
import 'dotenv/config'
import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'
import path from 'path'
import { Response } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { envConfig } from '~/constants/config'

const s3 = new S3({
  region: envConfig.awsRegion,
  credentials: {
    secretAccessKey: envConfig.awsSecretAccessKey as string,
    accessKeyId: envConfig.awsAccessKeyId as string
  }
})

//check list buckets were created
// s3.listBuckets({})
//   .then((data) => console.log(data))
//   .catch((error) => console.log(error))

export const uploadFileToS3 = async ({
  filename,
  filepath,
  contentType
}: {
  filename: string
  filepath: string
  contentType?: string
}) => {
  const mime = (await import('mime')).default

  try {
    const file = fs.readFileSync(path.resolve(filepath))
    const parallelUploads3 = new Upload({
      client: s3,
      params: {
        Bucket: envConfig.s3BucketName,
        Key: filename,
        Body: file,
        ContentType: contentType || (mime.getType(filepath) as string)
      },

      tags: [
        /*...*/
      ], // optional tags
      queueSize: 4, // optional concurrency configuration
      partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
      leavePartsOnError: false // optional manually handle dropped parts
    })

    return parallelUploads3.done()
  } catch (e) {
    console.log(e)
    throw e
  }
}

export const sendFileFromS3 = async (res: Response, filepath: string) => {
  try {
    const data = await s3.getObject({
      Bucket: envConfig.s3BucketName,
      Key: filepath
    })
    ;(data.Body as any).pipe(res)
  } catch (error) {
    res.status(HTTP_STATUS.NOT_FOUND).send('Not found')
  }
}
