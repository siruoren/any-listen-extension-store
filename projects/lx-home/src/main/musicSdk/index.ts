const numFix = (n: number): string => (n < 10 ? `0${n}` : n.toString())

export const decodeName = (str: string | null = ''): string => {
  if (!str) return ''
  return String(str)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

export const toDateObj = (date: any): Date | '' => {
  if (!date) return ''
  switch (typeof date) {
    case 'string':
      if (!date.includes('T')) date = date.split('.')[0].replace(/-/g, '/')
    // eslint-disable-next-line no-fallthrough
    case 'number':
      date = new Date(date)
    // eslint-disable-next-line no-fallthrough
    case 'object':
      break
    default:
      return ''
  }
  return date
}

/**
 * 时间格式化
 * @param _date 时间
 * @param format Y-M-D h:m:s Y年 M月 D日 h时 m分 s秒
 */
export const dateFormat = (_date: any, format = 'Y-M-D h:m:s'): string => {
  const date = toDateObj(_date)
  if (!date) return ''
  return format
    .replace('Y', (date as Date).getFullYear().toString())
    .replace('M', numFix((date as Date).getMonth() + 1))
    .replace('D', numFix((date as Date).getDate()))
    .replace('h', numFix((date as Date).getHours()))
    .replace('m', numFix((date as Date).getMinutes()))
    .replace('s', numFix((date as Date).getSeconds()))
}

export const formatPlayTime = (time: number): string => {
  const m = Math.trunc(time / 60)
  const s = Math.trunc(time % 60)
  return m == 0 && s == 0 ? '--/--' : numFix(m) + ':' + numFix(s)
}

export const formatPlayTime2 = (time: number): string => {
  const m = Math.trunc(time / 60)
  const s = Math.trunc(time % 60)
  return numFix(m) + ':' + numFix(s)
}

export const sizeFormate = (size: number): string => {
  // https://gist.github.com/thomseddon/3511330
  if (!size) return '0 B'
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  const number = Math.floor(Math.log(size) / Math.log(1024))
  return `${(size / Math.pow(1024, Math.floor(number))).toFixed(2)} ${units[number]}`
}

/**
 * 格式化播放数量
 * @param {*} num 数字
 */
export const formatPlayCount = (num: number): string => {
  if (num > 100000000) return `${Math.trunc(num / 10000000) / 10}亿`
  if (num > 10000) return `${Math.trunc(num / 1000) / 10}万`
  return String(num)
}
