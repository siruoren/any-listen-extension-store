// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/util/crypto.js
// 移植说明：原实现依赖 node:crypto，这里改为 crypto-js（AES/MD5）+ BigInt（RSA 无填充）
import CryptoJS from 'crypto-js'
import { bytesToWordArray } from '../../utils'

const iv = CryptoJS.enc.Utf8.parse('0102030405060708')
const presetKey = CryptoJS.enc.Utf8.parse('0CoJUm6Qyw8W8jud')
const linuxapiKey = CryptoJS.enc.Utf8.parse('rFgB&h#%2?^eDg:Q')
const base62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
// https://music.163.com RSA 公钥模数（1024 bit），指数 0x10001
const rsaModulus = BigInt('0x' + 'e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7')
const rsaExponent = 0x10001n
const eapiKey = CryptoJS.enc.Utf8.parse('e82ckenh8dichen8')

const aesEncryptCBC = (text, key) => {
  return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text), key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString()
}

const aesEncryptECBHex = (text, key) => {
  return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text), key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).ciphertext.toString(CryptoJS.enc.Hex).toUpperCase()
}

const bigIntModPow = (base, exponent, modulus) => {
  let result = 1n
  base %= modulus
  while (exponent > 0n) {
    if (exponent & 1n) result = (result * base) % modulus
    base = (base * base) % modulus
    exponent >>= 1n
  }
  return result
}

const rsaEncryptNoPaddingHex = bytes => {
  // RSA_NO_PADDING：左侧补零至 128 字节后直接做模幂
  const padded = new Uint8Array(128)
  padded.set(bytes, 128 - bytes.length)
  let m = 0n
  for (const byte of padded) m = (m << 8n) | BigInt(byte)
  const cipher = bigIntModPow(m, rsaExponent, rsaModulus)
  let hex = cipher.toString(16)
  if (hex.length % 2) hex = '0' + hex
  return hex
}

const randomSecretKey = () => {
  const keys = new Uint8Array(16)
  for (let i = 0; i < 16; i++) keys[i] = Math.floor(Math.random() * 256)
  return keys
}

export const weapi = object => {
  const text = JSON.stringify(object)
  const rawKeys = randomSecretKey()
  const secretKeyChars = Uint8Array.from(rawKeys, n => base62.charAt(n % 62).charCodeAt())
  const secretKey = bytesToWordArray(secretKeyChars)
  return {
    params: aesEncryptCBC(aesEncryptCBC(text, presetKey), secretKey),
    encSecKey: rsaEncryptNoPaddingHex(secretKeyChars.reverse()),
  }
}

export const linuxapi = object => {
  const text = JSON.stringify(object)
  return {
    eparams: aesEncryptECBHex(text, linuxapiKey),
  }
}

export const eapi = (url, object) => {
  const text = typeof object === 'object' ? JSON.stringify(object) : object
  const message = `nobody${url}use${text}md5forencrypt`
  const digest = CryptoJS.MD5(message).toString()
  const data = `${url}-36cd479b6b5-${text}-36cd479b6b5-${digest}`
  return {
    params: aesEncryptECBHex(data, eapiKey),
  }
}

export const eapiDecrypt = text => {
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Hex.parse(text),
  })
  return CryptoJS.AES.decrypt(cipherParams, eapiKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString(CryptoJS.enc.Utf8)
}
