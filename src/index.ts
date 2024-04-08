import express from 'express'
import { defaultErrorHandler } from '~/middlewares/errors.middlewares'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import mediaRouter from '~/routes/media.routes'
import 'dotenv/config'

const app = express()
const port = process.env.PORT

//convert to json
app.use(express.json())

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
