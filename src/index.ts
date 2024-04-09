import 'dotenv/config'
import express from 'express'
import { serveImageController, serveVideoController } from '~/controllers/medias.controllers'
import { defaultErrorHandler } from '~/middlewares/errors.middlewares'
import mediaRouter from '~/routes/media.routes'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import { initFolder } from '~/utils/file'

const app = express()
const port = process.env.PORT || 4000

// Create folder upload when start sever
initFolder()

//convert to json
app.use(express.json())

app.use('/static/image/:name', serveImageController)
app.use('/static/video/:name', serveVideoController)

//connect mongodb
databaseService.connect()

//user routes
app.use('/users', usersRouter)
app.use('/medias', mediaRouter)

//middleware error handler
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
