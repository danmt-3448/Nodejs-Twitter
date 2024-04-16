import 'dotenv/config'
import express from 'express'
import { UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { defaultErrorHandler } from '~/middlewares/errors.middlewares'
import mediaRouter from '~/routes/medias.routes'
import staticRouter from '~/routes/statics.routes'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import { initFolder } from '~/utils/file'
import cors from 'cors'
import tweetsRouter from '~/routes/tweets.routes'
import bookmarksRouter from '~/routes/bookmarks.routes'
import likesRouter from '~/routes/likes.routes'

const app = express()
const port = process.env.PORT || 4000

// Create folder upload when start sever
initFolder()

//convert to json
app.use(express.json())
app.use(cors())

//connect mongodb
databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexVideoStatus()
  databaseService.indexFollowers()
  // databaseService.indexTweets()
})

//user routes
app.use('/users', usersRouter)
app.use('/medias', mediaRouter)
app.use('/static', staticRouter)
app.use('/tweet', tweetsRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/likes', likesRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))

//middleware error handler
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
