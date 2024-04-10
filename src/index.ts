import 'dotenv/config'
import express from 'express'
import { UPLOAD_VIDEO_DIR } from '~/contants/dir'
import { defaultErrorHandler } from '~/middlewares/errors.middlewares'
import mediaRouter from '~/routes/media.routes'
import staticRouter from '~/routes/static.routes'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import { initFolder } from '~/utils/file'
import cors from 'cors'

const app = express()
const port = process.env.PORT || 4000

// Create folder upload when start sever
initFolder()

//convert to json
app.use(express.json())
app.use(cors())

//connect mongodb
databaseService.connect()

//user routes
app.use('/users', usersRouter)
app.use('/medias', mediaRouter)
app.use('/static', staticRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))

//middleware error handler
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
