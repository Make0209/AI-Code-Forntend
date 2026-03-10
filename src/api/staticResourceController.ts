// @ts-ignore
/* eslint-disable */
import { request } from '@/request'

/** 提供静态资源访问，支持目录重定向 访问格式：http://localhost:8123/api/static/{deployKey}[/{fileName}] 提供静态资源访问，支持目录重定向 访问格式：http://localhost:8123/api/static/{deployKey}[/{fileName}] GET /static/${param0}/&#42;&#42; */
export async function serveStaticResource(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.serveStaticResourceParams,
  options?: { [key: string]: any }
) {
  const { deployKey: param0, ...queryParams } = params
  return request<string>(`/static/${param0}/**`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  })
}
