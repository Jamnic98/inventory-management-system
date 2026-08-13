export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}
