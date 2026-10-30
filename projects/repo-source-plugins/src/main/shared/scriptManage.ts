import { crypto, storage, t } from './hostAPI'

const INFO_NAMES = {
  name: 24,
  description: 36,
  author: 56,
  homepage: 1024,
  version: 36,
} as const
type INFO_NAMES_Type = typeof INFO_NAMES
const matchInfo = (scriptInfo: string) => {
  const infoArr = scriptInfo.split(/\r?\n/)
  const rxp = /^\s?\*\s?@(\w+)\s(.+)$/
  const infos: Partial<Record<keyof typeof INFO_NAMES, string>> = {}
  for (const info of infoArr) {
    const result = rxp.exec(info)
    if (!result) continue
    const key = result[1] as keyof typeof INFO_NAMES
    if (INFO_NAMES[key] == null) continue
    infos[key] = result[2].trim()
  }

  for (const [key, len] of Object.entries(INFO_NAMES) as Array<
    { [K in keyof INFO_NAMES_Type]: [K, INFO_NAMES_Type[K]] }[keyof INFO_NAMES_Type]
  >) {
    infos[key] ||= ''
    if (infos[key] == null) infos[key] = ''
    else if (infos[key].length > len) infos[key] = `${infos[key].substring(0, len)}...`
  }

  return infos as Record<keyof typeof INFO_NAMES, string>
}
export const parseScriptInfo = (script: string) => {
  const result = /^\/\*[\S|\s]+?\*\//.exec(script.replace(/^\uFEFF/, ''))
  if (!result) throw new Error(t('error.parseScriptInfoFailed'))

  const scriptInfo = matchInfo(result[0])
  return scriptInfo
}

/**
 * 解析自定义源脚本：id 为脚本内容的 md5（同一脚本内容 id 恒定）
 * @param fileName 文件名
 * @param scriptRaw 脚本内容
 */
export const parseScript = async (fileName: string, scriptRaw: string): Promise<LXScriptInfoFull> => {
  const scriptInfo = parseScriptInfo(scriptRaw)
  const md5 = await crypto.md5(scriptRaw.trim())
  scriptInfo.name ||= fileName
  const desc = `${scriptInfo.version ? `${scriptInfo.version.startsWith('v') ? '' : 'v'}${scriptInfo.version}` : ''}${scriptInfo.author ? `@${scriptInfo.author}` : ''}`
  const apiInfo: LXScriptInfoFull = {
    id: md5,
    ...scriptInfo,
    allowShowUpdateAlert: true,
    fileName,
    fileDesc: `${desc ? `[${desc}]` : ''}${scriptInfo.description ? ` ${scriptInfo.description}` : ''}`.trim(),
  }
  return apiInfo
}

const SCRIPTS_DIR = 'scripts'
export const saveScript = async (id: string, scriptRaw: string) => {
  await storage.writeFile(`${SCRIPTS_DIR}/${id}`, scriptRaw)
}
export const removeScriptFile = async (id: string) => {
  await storage.removeFile(`${SCRIPTS_DIR}/${id}`).catch(() => {})
}

export const getScript = async (id: string) => {
  return storage.readFile(`${SCRIPTS_DIR}/${id}`, 'utf-8')
}

export const scriptFileExists = async (id: string) => {
  return storage.fileExists(`${SCRIPTS_DIR}/${id}`).catch(() => false)
}

/** 清理配置里已不存在的孤儿脚本文件 */
export const checkFiles = async (infos: LXScriptInfoFull[]) => {
  const files = await storage.listFiles(SCRIPTS_DIR).catch(() => [] as string[])
  const ids = infos.map((info) => info.id)
  const removedFiles = files.filter((f) => !ids.includes(f))
  for (const file of removedFiles) {
    await removeScriptFile(file)
  }
}
