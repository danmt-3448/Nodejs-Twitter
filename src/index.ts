import cors, { CorsOptions } from 'cors'
import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { defaultErrorHandler } from '~/middlewares/errors.middlewares'
import bookmarksRouter from '~/routes/bookmark.routes'
import conversationsRouter from '~/routes/conversation.routes'
import likesRouter from '~/routes/like.routes'
import mediaRouter from '~/routes/media.routes'
import searchRouter from '~/routes/search.routes'
import staticRouter from '~/routes/static.routes'
import tweetsRouter from '~/routes/tweet.routes'
import usersRouter from '~/routes/user.routes'
import databaseService from '~/services/database.services'
import { initFolder } from '~/utils/file'
import { initSocket } from '~/utils/socket'
import { rateLimit } from 'express-rate-limit'
// import fs from 'fs'
// import YAML from 'yaml'
// import path from 'path'
import swaggerUi from 'swagger-ui-express'
import swaggerJsDoc, { Options } from 'swagger-jsdoc'
import { envConfig, isProduction } from '~/constants/config'
import helmet from 'helmet'

// const file = fs.readFileSync(path.resolve('twitter-swagger.yaml'), 'utf8')
// const swaggerDocument = YAML.parse(file)

const options: Options = {
  // Start cach 1
  // definition: {
  //   openapi: '3.0.0',
  //   info: {
  //     title: 'Twitter clone typescript',
  //     version: '1.0.1',
  //     description: `|-
  //     This is a sample Pet Store Server based on the OpenAPI 3.0 specification.  You can find out more about
  //     Swagger at [https://swagger.io](https://swagger.io). In the third iteration of the pet store, we've switched to the design first approach!
  //     You can now help us improve the API whether it's by making changes to the definition itself or to the code.
  //     That way, with time, we can improve the API in general, and expose some of the new features in OAS3.
  //     `,
  //     termsOfService: 'http://swagger.io/terms/',
  //     contact: {
  //       email: 'thanhdan1999@gmail.com'
  //     },
  //     license: {
  //       name: 'Apache 2.0',
  //       url: 'http://www.apache.org/licenses/LICENSE-2.0.html'
  //     }
  //   },
  //   components: {
  //     securitySchemes: {
  //       BearerAuth: {
  //         type: 'http',
  //         scheme: 'bearer',
  //         bearerFormat: 'JWT'
  //       }
  //     }
  //   }
  // },
  // apis: ['./src/routes/*.routes.ts', './src/models/requests/*.requests.ts'] // files containing annotations as above
  // End cach 1

  // ======
  // Cach 2
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Twitter clone typescript',
      version: '1.0.1'
    }
  },
  apis: ['./src/openapi/*.yaml'] // files containing annotations as above
}

const openApiSpecification = swaggerJsDoc(options)

const app = express()
const httpServer = createServer(app)
const port = envConfig.port
const corsOptions: CorsOptions = {
  origin: isProduction ? envConfig.clientUrl : '*'
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false // Disable the `X-RateLimit-*` headers.
  // store: ... , // Redis, Memcached, etc. See below.
})

// Create folder upload when start sever
initFolder()

//convert to json
app.use(express.json())
app.use(cors(corsOptions))
app.use(helmet())
app.use(limiter)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpecification))
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Apply the rate limiting middleware to all requests.

//connect mongodb
databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexVideoStatus()
  databaseService.indexFollowers()
  databaseService.indexTweets()
  databaseService.indexHashtags()
})

//user routes
app.use('/users', usersRouter)
app.use('/medias', mediaRouter)
app.use('/static', staticRouter)
app.use('/tweet', tweetsRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/likes', likesRouter)
app.use('/search', searchRouter)
app.use('/conversation', conversationsRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))

//middleware error handler
app.use(defaultErrorHandler)

// socket
initSocket(httpServer)

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
