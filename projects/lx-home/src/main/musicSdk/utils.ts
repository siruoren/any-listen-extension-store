import CryptoJS from 'crypto-js'
import { decodeName } from './index'

export const toMD5 = (str: string): string => CryptoJS.MD5(str).toString()

/**
 * 字节数组转 crypto-js WordArray（WordArray.create 不支持 TypedArray，直接传会按 32-bit words 解释）
 */
export const bytesToWordArray = (bytes: Uint8Array | number[]): CryptoJS.lib.WordArray => {
  const words: number[] = []
  for (let i = 0; i < bytes.length; i++) {
    words[i >>> 2] = (words[i >>> 2] || 0) | ((bytes[i] & 0xff) << (24 - (i % 4) * 8))
  }
  return new CryptoJS.lib.WordArray.init(words, bytes.length)
}

/**
 * 格式化歌手
 * @param singers 歌手数组
 * @param nameKey 歌手名键值
 * @param join 歌手分割字符
 */
export const formatSingerName = (singers: any, nameKey = 'name', join = '、'): string => {
  if (Array.isArray(singers)) {
    const singer = []
    singers.forEach(item => {
      const name = item[nameKey]
      if (!name) return
      singer.push(name)
    })
    return decodeName(singer.join(join))
  }
  return decodeName(String(singers ?? ''))
}
