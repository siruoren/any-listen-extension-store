import { app, configuration, console, storage, t } from './shared/hostAPI'
import { parseScript, removeScriptFile, saveScript, scriptFileExists } from './shared/scriptManage'
import { fetchText, formatTime, parseList } from './shared/utils'

/** 远程源账本条目：url → 最近一次导入的脚本信息 */
export interface RemoteSourceRecord {
  url: string
  id: string
  name: string
  version: string
  fileName: string
  hash: string
  updatedAt: number
}

interface RemoteSourceLedger {
  lastUpdateAt: number
  lastResult: string
  sources: RemoteSourceRecord[]
}

const LEDGER_FILE = 'remoteSources.json'
/** 启动自动更新的延迟：等宿主初始化（含配置、隔离环境）就绪 */
const STARTUP_DELAY = 2000

const emptyLedger = (): RemoteSourceLedger => ({ lastUpdateAt: 0, lastResult: '', sources: [] })

export const readLedger = async (): Promise<RemoteSourceLedger> => {
  try {
    const raw = await storage.readFile(LEDGER_FILE, 'utf-8')
    const data = JSON.parse(raw) as RemoteSourceLedger
    if (!data || !Array.isArray(data.sources)) return emptyLedger()
    return { lastUpdateAt: data.lastUpdateAt || 0, lastResult: data.lastResult || '', sources: data.sources }
  } catch {
    return emptyLedger()
  }
}

export const writeLedger = async (ledger: RemoteSourceLedger) => {
  await storage.writeFile(LEDGER_FILE, JSON.stringify(ledger, null, 2))
}

/**
 * 批量导入 / 更新远程列表文件里的全部自定义源。
 *
 * 匹配规则（脚本 id 为内容的 md5，内容不变则 id 恒定）：
 *   - 内容与上次一致且脚本文件存在 → 跳过不动，勾选状态原样保留；
 *   - 内容变化（url 已导入过）→ 存新脚本、删旧脚本；旧脚本处于勾选状态时
 *     自动把勾选切到新脚本（隔离环境由 onConfigChanged 依据 enabledSources
 *     差异自动重建）；
 *   - 新 url → 新增导入（不自动启用，需用户在设置里勾选）；
 *   - 单条失败不影响其余条目；列表里已去掉的地址保留账本不自动删除。
 * @param reason 触发原因（用于日志与结果说明）
 */
const doUpdate = async (reason: 'auto' | 'manual'): Promise<void> => {
  const reasonText = t(reason === 'auto' ? 'update.reasonAuto' : 'update.reasonManual')
  const ledger = await readLedger()
  let lastResult: string | undefined
  try {
    const listUrl = (await configuration.getConfigs<[string]>(['listUrl']))[0] ?? ''
    if (!listUrl) {
      lastResult = t('update.noListUrl')
      console.warn(`[${reasonText}] ${lastResult}`)
      void app.showMessage(lastResult, { type: 'warning' })
      return
    }
    console.log(`[${reasonText}] Start updating remote sources from: ${listUrl}`)

    const listText = await fetchText(listUrl)
    const urls = parseList(listText)
    if (!urls.length) {
      lastResult = t('update.emptyList', { url: listUrl })
      console.warn(`[${reasonText}] ${lastResult}`)
      void app.showMessage(lastResult, { type: 'warning' })
      return
    }

    const prevMap = new Map(ledger.sources.map((item) => [item.url, item]))
    const infos = (await configuration.getConfigs<[LXScriptInfoFull[]]>(['remoteSources']))[0] ?? []
    const enabled = (await configuration.getConfigs<[string[]]>(['enabledSources']))[0] ?? []
    const now = Date.now()
    const lines: string[] = []
    const next: RemoteSourceRecord[] = []
    let updated = 0
    let added = 0
    let kept = 0
    let failed = 0

    for (const url of urls) {
      const prev = prevMap.get(url)
      try {
        const script = await fetchText(url)
        if (!script.trim()) throw new Error(t('update.emptyScript'))
        const fileName = url.split(/[/\\?#]/).pop() || 'remote_source.js'
        const info = await parseScript(fileName, script)
        const record: RemoteSourceRecord = {
          url,
          id: info.id,
          name: info.name || fileName,
          version: info.version ?? '',
          fileName,
          hash: info.id,
          updatedAt: now,
        }
        const versionLabel = record.version ? ` v${record.version}` : ''

        // 内容与上次一致且脚本文件存在 → 跳过不动
        if (prev?.hash === info.id && (await scriptFileExists(info.id))) {
          kept++
          next.push({ ...prev, name: record.name, version: record.version, updatedAt: prev.updatedAt })
          lines.push(t('update.itemKept', { name: record.name, version: versionLabel }))
          continue
        }

        await saveScript(info.id, script)
        if (prev) {
          // 内容变化：替换账本与配置条目，勾选状态跟随切换到新脚本
          if (prev.id !== info.id) await removeScriptFile(prev.id)
          const infoIndex = infos.findIndex((item) => item.id === prev.id)
          if (infoIndex === -1) infos.push(info)
          else infos.splice(infoIndex, 1, info)
          const enabledIndex = enabled.indexOf(prev.id)
          if (enabledIndex !== -1 && !enabled.includes(info.id)) enabled.splice(enabledIndex, 1, info.id)
          updated++
          lines.push(t('update.itemUpdated', { name: record.name, version: versionLabel }))
        } else {
          // 新地址：新增导入（不自动启用）
          infos.push(info)
          added++
          lines.push(t('update.itemAdded', { name: record.name, version: versionLabel }))
        }
        next.push(record)
      } catch (error) {
        failed++
        if (prev) next.push(prev)
        lines.push(t('update.itemFailed', { url, message: (error as Error).message }))
        console.error(`[${reasonText}] Failed to import source [${url}]: ${(error as Error).message}`)
      }
    }

    // 列表里已去掉、但之前导入过的源：保留账本，不自动删除（避免误删用户仍在用的源）
    for (const item of ledger.sources) {
      if (!urls.includes(item.url)) next.push(item)
    }

    ledger.sources = next
    ledger.lastUpdateAt = now
    lastResult = `${t('update.summary', {
      reason: reasonText,
      time: formatTime(now),
      updated,
      added,
      kept,
      failed,
    })}\n${lines.join('\n')}`
    ledger.lastResult = lastResult
    await configuration.setConfigs({ remoteSources: infos, enabledSources: enabled })
    console.log(`[${reasonText}] ${t('update.logSummary', { updated, added, kept, failed })}`)
    void app.showMessage(t('update.summary', { reason: reasonText, time: formatTime(now), updated, added, kept, failed }), {
      type: failed ? 'warning' : 'info',
    })
  } catch (error) {
    lastResult = t('update.failed', { time: formatTime(Date.now()), message: (error as Error).message })
    ledger.lastResult = lastResult
    console.error(`[${reasonText}] Update failed: ${(error as Error).message}`)
    void app.showMessage(lastResult, { type: 'error' })
  } finally {
    if (lastResult) ledger.lastResult = lastResult
    await writeLedger(ledger).catch((error) => {
      console.error(`Failed to write ledger: ${(error as Error).message}`)
    })
  }
}

/** 更新互斥标志：并发触发（手动 + 自动）时后续调用直接跳过，避免同时写账本 */
const updateState = { updating: null as Promise<void> | null }

/**
 * 批量导入 / 更新远程源（同一时刻仅运行一个更新任务）
 * @param reason 触发原因
 */
export const updateSources = async (reason: 'auto' | 'manual'): Promise<void> => {
  if (updateState.updating) return
  const task = doUpdate(reason)
  updateState.updating = task
  try {
    await task
  } finally {
    updateState.updating = null
  }
}

/** 移除本扩展导入的全部远程源（账本、脚本文件、配置、运行实例一并清空） */
export const removeAllSources = async (): Promise<void> => {
  const ledger = await readLedger()
  const ids = ledger.sources.map((item) => item.id)
  if (!ids.length) {
    const msg = t('update.nothingToRemove')
    void app.showMessage(msg, { type: 'info' })
    return
  }
  try {
    const newLedger = emptyLedger()
    newLedger.lastResult = t('update.removedAll', { count: ids.length, time: formatTime(Date.now()) })
    await configuration.setConfigs({ remoteSources: [], enabledSources: [] })
    for (const id of ids) {
      await removeScriptFile(id)
    }
    await writeLedger(newLedger)
    void app.showMessage(newLedger.lastResult, { type: 'info' })
    console.log(`Removed all remote sources (${ids.length})`)
  } catch (error) {
    const msg = t('update.removeFailed', { message: (error as Error).message })
    console.error(`Remove all sources failed: ${(error as Error).message}`)
    void app.showMessage(msg, { type: 'error' })
  }
}

/**
 * 启动时调度自动更新（仅当开启 autoUpdate 且已配置 listUrl 时执行）
 */
export const scheduleAutoUpdate = async () => {
  const [autoUpdate = false, listUrl = '', ledger] = await Promise.all([
    configuration.getConfigs<[boolean]>(['autoUpdate']).then(([v]) => v),
    configuration.getConfigs<[string]>(['listUrl']).then(([v]) => v),
    readLedger(),
  ])
  console.log(`Auto update: enabled=${autoUpdate}, listUrl=${listUrl ? 'configured' : 'empty'}, lastUpdate=${formatTime(ledger.lastUpdateAt)}`)
  if (!autoUpdate || !listUrl) return
  setTimeout(() => {
    void updateSources('auto')
  }, STARTUP_DELAY)
}
