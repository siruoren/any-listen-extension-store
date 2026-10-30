import { request } from '../shared/hostAPI'

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
}

const isPlainObject = (val: unknown): val is Record<string, unknown> => {
  return Object.prototype.toString.call(val) === '[object Object]'
}

const fetchData = async (url: string, options: Record<string, any>, controller: AbortController) => {
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries((options.headers ?? {}) as Record<string, unknown>)) {
    if (value == null) continue
    headers[key] = Array.isArray(value) ? String(value.join('; ')) : String(value)
  }
  const format = options.format ?? 'json'

  const reqOptions: AnyListen_API.RequestOptions = {
    method: String(options.method ?? 'get').toUpperCase() as AnyListen_API.RequestOptions['method'],
    headers: { ...defaultHeaders, ...headers },
    timeout: options.timeout,
    signal: controller.signal,
  }

  if (isPlainObject(options.query)) reqOptions.query = options.query as AnyListen_API.RequestOptions['query']

  const body = options.body
  if (options.form != null && isPlainObject(options.form)) {
    reqOptions.form = options.form as AnyListen_API.RequestOptions['form']
  } else if (options.formData != null && isPlainObject(options.formData)) {
    reqOptions.formdata = options.formData as AnyListen_API.RequestOptions['formdata']
  } else if (body != null && typeof body === 'object') {
    reqOptions.json = body as Record<string, unknown>
  } else if (typeof body === 'string') {
    reqOptions.text = body
  }

  let resp: AnyListen_API.Response<unknown>
  try {
    resp = await request(url, reqOptions)
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw new Error('请求已取消')
    throw error
  }

  let bodyData = resp.body
  if (typeof bodyData === 'string' && format === 'json') {
    try {
      bodyData = JSON.parse(bodyData)
    } catch {}
  }
  return {
    statusCode: resp.statusCode,
    headers: resp.headers,
    body: bodyData,
  }
}

/**
 * 基于宿主 request 的 httpFetch 兼容实现
 * 返回与 lxl-music-desktop `utils/request` 相同的 `{ promise, cancelHttp }` 结构
 */
export const httpFetch = (url: string, options: Record<string, any> = { method: 'get' }) => {
  const obj = {
    isCancelled: false,
    requestObj: null as AbortController | null,
    promise: null as unknown as Promise<any>,
    cancelHttp: () => {
      if (!obj.requestObj) return void (obj.isCancelled = true)
      obj.requestObj.abort()
      obj.requestObj = null
    },
  }
  const controller = new AbortController()
  obj.requestObj = controller
  obj.promise = new Promise((resolve, reject) => {
    void fetchData(url, options, controller).then(resolve, (err) => {
      if (obj.isCancelled) return reject(new Error('请求已取消'))
      switch ((err as any)?.code) {
        case 'ETIMEDOUT':
        case 'ESOCKETTIMEDOUT':
          return reject(new Error('请求超时'))
        case 'ENOTFOUND':
          return reject(new Error('无法连接到网络'))
        default:
          return reject(err)
      }
    })
  })
  return obj
}
