import { Pagination } from '~/models/requests/Tweet.requests'

export interface SearchReqQuery extends Pagination {
  content: string
}


export interface SearchHashtagsReqQuery extends Pagination {
  hashtag: string
}
