declare namespace API {
  type AppAddRequest = {
    /** 应用初始化的 prompt */
    initPrompt?: string
  }

  type AppAdminUpdateRequest = {
    /** id */
    id?: number
    /** 应用名称 */
    appName?: string
    /** 应用封面 */
    cover?: string
    /** 优先级 */
    priority?: number
  }

  type AppDeployRequest = {
    /** 应用 id */
    appId?: number
  }

  type AppQueryRequest = {
    /** 当前页号 */
    pageNum?: number
    /** 页面大小 */
    pageSize?: number
    /** 排序字段 */
    sortField?: string
    /** 排序顺序（默认降序） */
    sortOrder?: string
    /** id */
    id?: number
    /** 应用名称 */
    appName?: string
    /** 应用封面 */
    cover?: string
    /** 应用初始化的 prompt */
    initPrompt?: string
    /** 代码生成类型（枚举） */
    codeGenType?: string
    /** 部署标识 */
    deployKey?: string
    /** 优先级 */
    priority?: number
    /** 创建用户id */
    userId?: number
  }

  type AppUpdateRequest = {
    /** id */
    id?: number
    /** 应用名称 */
    appName?: string
  }

  type AppVO = {
    /** id */
    id?: number
    /** 应用名称 */
    appName?: string
    /** 应用封面 */
    cover?: string
    /** 应用初始化的 prompt */
    initPrompt?: string
    /** 代码生成类型（枚举） */
    codeGenType?: string
    /** 部署标识 */
    deployKey?: string
    /** 部署时间 */
    deployedTime?: string
    /** 优先级 */
    priority?: number
    /** 创建用户id */
    userId?: number
    /** 创建时间 */
    createTime?: string
    /** 更新时间 */
    updateTime?: string
    user?: UserVO
  }

  type BaseResponseAppVO = {
    /** 状态码 */
    code?: number
    data?: AppVO
    /** 提示信息 */
    message?: string
  }

  type BaseResponseBoolean = {
    /** 状态码 */
    code?: number
    /** 数据 */
    data?: boolean
    /** 提示信息 */
    message?: string
  }

  type BaseResponseLoginUserVO = {
    /** 状态码 */
    code?: number
    data?: LoginUserVO
    /** 提示信息 */
    message?: string
  }

  type BaseResponseLong = {
    /** 状态码 */
    code?: number
    /** 数据 */
    data?: number
    /** 提示信息 */
    message?: string
  }

  type BaseResponsePageAppVO = {
    /** 状态码 */
    code?: number
    data?: PageAppVO
    /** 提示信息 */
    message?: string
  }

  type BaseResponsePageChatHistory = {
    /** 状态码 */
    code?: number
    data?: PageChatHistory
    /** 提示信息 */
    message?: string
  }

  type BaseResponsePageUserVO = {
    /** 状态码 */
    code?: number
    data?: PageUserVO
    /** 提示信息 */
    message?: string
  }

  type BaseResponseString = {
    /** 状态码 */
    code?: number
    /** 数据 */
    data?: string
    /** 提示信息 */
    message?: string
  }

  type BaseResponseUser = {
    /** 状态码 */
    code?: number
    data?: User
    /** 提示信息 */
    message?: string
  }

  type BaseResponseUserVO = {
    /** 状态码 */
    code?: number
    data?: UserVO
    /** 提示信息 */
    message?: string
  }

  type ChatHistory = {
    /** id */
    id?: number
    /** 消息 */
    message?: string
    /** user/ai */
    messageType?: string
    /** 应用id */
    appId?: number
    /** 创建用户id */
    userId?: number
    /** 创建时间 */
    createTime?: string
    /** 更新时间 */
    updateTime?: string
    /** 是否删除 */
    isDelete?: number
  }

  type ChatHistoryQueryRequest = {
    /** 当前页号 */
    pageNum?: number
    /** 页面大小 */
    pageSize?: number
    /** 排序字段 */
    sortField?: string
    /** 排序顺序（默认降序） */
    sortOrder?: string
    /** id */
    id?: number
    /** 消息内容 */
    message?: string
    /** 消息类型（user/ai） */
    messageType?: string
    /** 应用id */
    appId?: number
    /** 创建用户id */
    userId?: number
    /** 游标查询 - 最后一条记录的创建时间 用于分页查询，获取早于此时间的记录 */
    lastCreateTime?: string
  }

  type chatToGenCodeParams = {
    /** 应用 ID */
    appId: number
    /** 用户消息 */
    message: string
  }

  type DeleteRequest = {
    /** id */
    id?: number
  }

  type downloadAppCodeParams = {
    /** 应用ID */
    appId: number
  }

  type getAppVOByIdByAdminParams = {
    id: number
  }

  type getAppVOByIdParams = {
    id: number
  }

  type getInfoParams = {
    /** 用户主键 */
    id: number
  }

  type getUserByIdParams = {
    id: number
  }

  type getUserVOByIdParams = {
    id: number
  }

  type listAppChatHistoryParams = {
    /** 应用ID */
    appId: number
    /** 页面大小 */
    pageSize: number
    /** 最后一条记录的创建时间 */
    lastCreateTime?: string
  }

  type LoginUserVO = {
    /** 用户 id */
    id?: number
    /** 账号 */
    userAccount?: string
    /** 用户昵称 */
    userName?: string
    /** 用户头像 */
    userAvatar?: string
    /** 用户简介 */
    userProfile?: string
    /** 用户角色：user/admin */
    userRole?: string
    /** 创建时间 */
    createTime?: string
    /** 更新时间 */
    updateTime?: string
    /** 用户登录 token */
    token?: string
  }

  type PageAppVO = {
    records?: AppVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageChatHistory = {
    records?: ChatHistory[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type pageParams = {
    page: PageUser
  }

  type PageUser = {
    records?: User[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageUserVO = {
    records?: UserVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type removeParams = {
    /** 主键 */
    id: number
  }

  type ServerSentEventString = true

  type serveStaticResourceParams = {
    deployKey: string
  }

  type User = {
    /** id */
    id?: number
    /** 账号 */
    userAccount?: string
    /** 密码 */
    userPassword?: string
    /** 用户昵称 */
    userName?: string
    /** 用户头像 */
    userAvatar?: string
    /** 用户简介 */
    userProfile?: string
    /** 用户角色：user/admin */
    userRole?: string
    /** 编辑时间 */
    editTime?: string
    /** 创建时间 */
    createTime?: string
    /** 更新时间 */
    updateTime?: string
    /** 是否删除 */
    isDelete?: number
  }

  type UserAddRequest = {
    /** 用户昵称 */
    userName?: string
    /** 账号 */
    userAccount?: string
    /** 用户头像 */
    userAvatar?: string
    /** 用户简介 */
    userProfile?: string
    /** 用户角色: user, admin */
    userRole?: string
  }

  type UserLoginRequest = {
    /** 账号 */
    userAccount?: string
    /** 密码 */
    userPassword?: string
  }

  type UserQueryRequest = {
    /** 当前页号 */
    pageNum?: number
    /** 页面大小 */
    pageSize?: number
    /** 排序字段 */
    sortField?: string
    /** 排序顺序（默认降序） */
    sortOrder?: string
    /** id */
    id?: number
    /** 用户昵称 */
    userName?: string
    /** 账号 */
    userAccount?: string
    /** 简介 */
    userProfile?: string
    /** 用户角色：user/admin/ban */
    userRole?: string
  }

  type UserRegisterRequest = {
    /** 账号 */
    userAccount?: string
    /** 密码 */
    userPassword?: string
    /** 确认密码 */
    checkPassword?: string
  }

  type UserUpdateRequest = {
    /** id */
    id?: number
    /** 用户昵称 */
    userName?: string
    /** 用户头像 */
    userAvatar?: string
    /** 简介 */
    userProfile?: string
    /** 用户角色：user/admin */
    userRole?: string
  }

  type UserVO = {
    /** id */
    id?: number
    /** 账号 */
    userAccount?: string
    /** 用户昵称 */
    userName?: string
    /** 用户头像 */
    userAvatar?: string
    /** 用户简介 */
    userProfile?: string
    /** 用户角色：user/admin */
    userRole?: string
    /** 创建时间 */
    createTime?: string
  }
}
