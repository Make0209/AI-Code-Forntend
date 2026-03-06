// @ts-ignore
/* eslint-disable */
import { request } from '@/request'

/** 健康检查 GET /health/check */
export async function healthCheck(options?: { [key: string]: any }) {
  return request<API.BaseResponseString>('/health/check', {
    method: 'GET',
    ...(options || {}),
  })
}
