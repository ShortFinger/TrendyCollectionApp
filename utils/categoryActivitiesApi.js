import { request, API_BASE } from './request.js'

/**
 * @param {{ categoryId: string, page: number, pageSize: number, channel: string, appVersion: string, sort: 'sales'|'visit_total' }} p
 * @returns {Promise<{ total: number, page: number, pageSize: number, items: object[] }>}
 */
export async function fetchCategoryActivitiesPage(p) {
  const {
    categoryId,
    page,
    pageSize,
    channel,
    appVersion,
    sort
  } = p
  const cid = encodeURIComponent(categoryId)
  const data = await request({
    base: API_BASE.app,
    url: `/v1/categories/${cid}/activities`,
    method: 'GET',
    data: {
      channel,
      appVersion,
      page,
      pageSize,
      sort
    }
  })
  const items = Array.isArray(data?.items) ? data.items : []
  return {
    total: Number(data?.total) || 0,
    page: Number(data?.page) || page,
    pageSize: Number(data?.pageSize) || pageSize,
    items
  }
}
