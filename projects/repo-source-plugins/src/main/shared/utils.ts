import { request } from './hostAPI'

/**
 * 下载文本内容（跟随重定向）
 * @param url 地址
 * @returns 响应文本
 */
export const fetchText = async (url: string): Promise<string> => {
  const resp = await request<string>(url, { timeout: 20000, maxRedirect: 5 })
  if (resp.statusCode !== 200) throw new Error(`HTTP ${resp.statusCode}: ${url}`)
  if (typeof resp.body !== 'string') throw new Error(`Response is not text: ${url}`)
  return resp.body
}

// https://stackoverflow.com/a/53387532
export function compareVer(currentVer: string, targetVer: string): -1 | 0 | 1 {
  // treat non-numerical characters as lower version
  // replacing them with a negative number based on charcode of each character
  const fix = (s: string) => `.${s.toLowerCase().charCodeAt(0) - 2147483647}.`

  const currentVerArr: Array<string | number> = currentVer.replace(/[^0-9.]/g, fix).split('.')
  const targetVerArr: Array<string | number> = targetVer.replace(/[^0-9.]/g, fix).split('.')
  const c = Math.max(currentVerArr.length, targetVerArr.length)
  for (let i = 0; i < c; i++) {
    // convert to integer the most efficient way
    currentVerArr[i] = ~~currentVerArr[i]
    targetVerArr[i] = ~~targetVerArr[i]
    if (currentVerArr[i] > targetVerArr[i]) return 1
    else if (currentVerArr[i] < targetVerArr[i]) return -1
  }
  return 0
}

export const verifyUrl = async (url: string, opts: AnyListen_API.RequestOptions = {}) => {
  const resp = await request(url, {
    ...opts,
    headers: {
      ...(opts.headers ?? {}),
      Range: 'bytes=0-1',
    },
    needRaw: true,
  })
  if (!resp.statusCode || resp.statusCode < 200 || resp.statusCode >= 300) {
    throw new Error(`verify proxy request failed: [${url}] ${resp.statusCode}`)
  }
  return resp.history[resp.history.length - 1]
}

/**
 * 解析列表文件：每行一个地址，忽略空行与 # // 注释行
 * @param text 列表文件内容
 */
export const parseList = (text: string): string[] => {
  const urls: string[] = []
  const seen = new Set<string>()
  for (const raw of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || line.startsWith('//')) continue
    if (seen.has(line)) continue
    seen.add(line)
    urls.push(line)
  }
  return urls
}

/**
 * 时间格式化（本地时区）
 * @param ts 毫秒时间戳
 */
export const formatTime = (ts: number): string => {
  if (!ts) return '—'
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
