import { faker } from '@faker-js/faker'
import { ObjectId, WithId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import { TweetReqBody } from '~/models/requests/Tweet.requests'
import { RegisterReqBody } from '~/models/requests/User.requests'
import Follower from '~/models/schemas/Follow.schema'
import Hashtag from '~/models/schemas/Hashtag.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'

// Default password
const PASSWORD = 'Danmt123@'

//id account follow other
const MY_ID = new ObjectId('66150b2604a5f428e64dfea3')

//number user are created, each user will create 2 tweet
const USER_COUNT = 500

const createRandomUser = () => {
  const user: RegisterReqBody = {
    name: faker.internet.displayName(),
    email: faker.internet.email(),
    date_of_birth: faker.date.past().toISOString(),
    password: PASSWORD,
    confirm_password: PASSWORD
  }
  return user
}

const createRandomTweet = () => {
  const tweet: TweetReqBody = {
    type: TweetType.Tweet,
    audience: TweetAudience.Everyone,
    content: faker.lorem.paragraph({
      min: 10,
      max: 160
    }),
    hashtags: ['NodeJS', 'MongoDB', 'ExpressJS', 'Swagger', 'Docker', 'Socket.io'],
    medias: [
      {
        type: MediaType.Image,
        url: faker.image.url()
      }
    ],
    mentions: [],
    parent_id: null
  }
  return tweet
}

const users: RegisterReqBody[] = faker.helpers.multiple(createRandomUser, {
  count: USER_COUNT
})

const insertMultipleUsers = async (users: RegisterReqBody[]) => {
  console.log('Creating users...')
  const result = await Promise.all(
    users.map(async (user) => {
      const user_id = new ObjectId()
      await databaseService.users.insertOne(
        new User({
          ...user,
          _id: user_id,
          username: `user${user_id.toString()}`,
          password: hashPassword(user.password),
          date_of_birth: new Date(user.date_of_birth),
          verify: UserVerifyStatus.Verified
        })
      )
      return user_id
    })
  )
  console.log(`Created ${result.length} users`)
  return result
}

const followMultipleUsers = async (user_id: ObjectId, followed_user_ids: ObjectId[]) => {
  console.log('Start following...')
  const result = await Promise.all(
    followed_user_ids.map((followed_user_id) =>
      databaseService.followers.insertOne(
        new Follower({
          user_id,
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
    )
  )
  console.log(`Followed ${result.length} users`)
}

const checkAndCreateHashtags = async (hashtags: string[]) => {
  const hashtagDocuemts = await Promise.all(
    hashtags.map((hashtag) => {
      // Tìm hashtag trong database, nếu có thì lấy, không thì tạo mới
      return databaseService.hashtags.findOneAndUpdate(
        { name: hashtag },
        {
          $setOnInsert: new Hashtag({ name: hashtag })
        },
        {
          upsert: true,
          returnDocument: 'after'
        }
      )
    })
  )
  return hashtagDocuemts.map((hashtag) => (hashtag as WithId<Hashtag>)._id)
}

const insertTweet = async (user_id: ObjectId, body: TweetReqBody) => {
  const hashtags = await checkAndCreateHashtags(body.hashtags)
  const result = await databaseService.tweets.insertOne(
    new Tweet({
      audience: body.audience,
      content: body.content,
      hashtags,
      mentions: body.mentions,
      medias: body.medias,
      parent_id: body.parent_id,
      type: body.type,
      user_id: new ObjectId(user_id)
    })
  )
  return result
}

const insertMultipleTweets = async (ids: ObjectId[]) => {
  console.log('Creating tweets...')
  console.log(`Counting...`)
  let count = 0
  const result = await Promise.all(
    ids.map(async (id, index) => {
      await Promise.all([insertTweet(id, createRandomTweet()), insertTweet(id, createRandomTweet())])
      count += 2
      console.log(`Created ${count} tweets`)
    })
  )
  return result
}

insertMultipleUsers(users).then((ids) => {
  followMultipleUsers(new ObjectId(MY_ID), ids).catch((err) => {
    console.error('Error when following users')
    console.log(err)
  })
  insertMultipleTweets(ids).catch((err) => {
    console.error('Error when creating tweets')
    console.log(err)
  })
})
