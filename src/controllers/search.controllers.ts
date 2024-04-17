import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { SearchHashtagsReqQuery, SearchReqQuery } from '~/models/requests/Search.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import searchService from '~/services/search.services'

export const searchController = async (
  req: Request<ParamsDictionary, any, any, SearchReqQuery>,
  res: Response,
  next: NextFunction
) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const content = req.query.content
  const { user_id } = req.decoded_authorization as TokenPayload
  const { result, total } = await searchService.search({ limit, page, content, user_id })

  return res.send({
    message: 'Search ok!',
    result: {
      data: result,
      page,
      limit,
      total,
      total_page: Math.ceil(total / limit)
    }
  })
}

export const searchHashtagController = async (
  req: Request<ParamsDictionary, any, any, SearchHashtagsReqQuery>,
  res: Response,
  next: NextFunction
) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const hashtag = req.query.hashtag
  const { user_id } = req.decoded_authorization as TokenPayload
  const { result, total } = await searchService.searchHashtags({ limit, page, hashtag, user_id })

  return res.send({
    message: 'Search ok!',
    result: {
      data: result,
      page,
      limit,
      total,
      total_page: Math.ceil(total / limit)
    }
  })
}
