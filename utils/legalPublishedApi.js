import { request, API_BASE } from './request.js'

/** 匿名：必选四类均已发布时返回列表，否则业务码 1012 */
export function fetchRequiredLegalBundle() {
  return request({
    url: '/legal/published/required-bundle',
    method: 'GET',
    base: API_BASE.user
  })
}

/** 匿名：已发布协议正文 */
export function fetchLegalDocumentBody(documentId) {
  return request({
    url: `/legal/published/documents/${documentId}/body`,
    method: 'GET',
    base: API_BASE.user
  })
}
