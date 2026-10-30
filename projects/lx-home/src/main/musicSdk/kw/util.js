import CryptoJS from 'crypto-js'
import { toMD5, bytesToWordArray } from '../utils'

export const objStr2JSON = str => {
  return JSON.parse(str.replace(/('(?=(,\s*')))|('(?=:))|((?<=([:,]\s*))')|((?<=\{)')|('(?=}))/g, '"'))
}

export const formatSinger = rawData => rawData.replace(/&/g, '、')

const aesKey = bytesToWordArray([112, 87, 39, 61, 199, 250, 41, 191, 57, 68, 45, 114, 221, 94, 140, 228])

const aesEncryptToBase64 = buffer => {
  // buffer 可能是 string 或 Buffer/Uint8Array，统一转为字节数组
  const bytes = typeof buffer === 'string' ? new TextEncoder().encode(buffer) : new Uint8Array(buffer)
  const wordArray = bytesToWordArray(bytes)
  return CryptoJS.AES.encrypt(wordArray, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString()
}

const aesDecryptFromBase64 = base64 => {
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Base64.parse(base64),
  })
  return CryptoJS.AES.decrypt(cipherParams, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString(CryptoJS.enc.Utf8)
}

export const wbdCrypto = {
  appId: 'y67sprxhhpws',
  decodeData(base64Result) {
    const data = aesDecryptFromBase64(decodeURIComponent(base64Result))
    return JSON.parse(data)
  },
  createSign(data, time) {
    const str = `${this.appId}${data}${time}`
    return toMD5(str).toUpperCase()
  },
  buildParam(jsonData) {
    const data = JSON.stringify(jsonData)
    const time = Date.now()

    const encodeData = aesEncryptToBase64(data)
    const sign = this.createSign(encodeData, time)

    return `data=${encodeURIComponent(encodeData)}&time=${time}&appId=${this.appId}&sign=${sign}`
  },
}
