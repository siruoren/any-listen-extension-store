import { initCommand } from './command'
import { destroyScript, runScript, scripts } from './isolate'
import { initOnlineResource } from './onlineResource'
import { readLedger, scheduleAutoUpdate, writeLedger } from './remoteSource'
import { app, configuration, console, t } from './shared/hostAPI'
import { checkFiles, getScript, removeScriptFile } from './shared/scriptManage'

void initOnlineResource()

const loadScript = async (info: LXScriptInfoFull) => {
  try {
    const script = await getScript(info.id)
    await runScript(info.id, info, script)
  } catch (error) {
    console.error(t('error.loadScriptFailed', { name: info.name || info.id, message: (error as Error).message }))
    void app.showMessage(t('error.loadScriptFailed', { name: info.name || info.id, message: (error as Error).message }), {
      type: 'error',
    })
  }
}

const initScripts = async () => {
  const [enabled = [], infos = []] = await configuration.getConfigs<[string[], LXScriptInfoFull[]]>(['enabledSources', 'remoteSources'])

  // 启动时清理配置里已不存在的孤儿脚本文件
  void checkFiles(infos)

  const infoMap = new Map(infos.map((info) => [info.id, info]))
  for (const id of enabled) {
    const info = infoMap.get(id)
    if (!info) {
      console.error(`No script info found for id ${id}`)
      continue
    }
    await loadScript(info)
  }

  configuration.onConfigChanged(async (keys, newConfig) => {
    if (keys.includes('remoteSources')) {
      // UI 移除条目后的同步清理：脚本文件、账本、运行实例与残留勾选
      const newInfos = (newConfig.remoteSources as LXScriptInfoFull[] | null) ?? []
      const newIds = new Set(newInfos.map((info) => info.id))
      const [ledger, enabledIds] = await Promise.all([readLedger(), configuration.getConfigs<[string[]]>(['enabledSources']).then(([v]) => v ?? [])])
      const removedIds = [...new Set([...ledger.sources.map((item) => item.id), ...enabledIds])].filter((id) => !newIds.has(id))
      if (!removedIds.length) return
      for (const id of removedIds) {
        await removeScriptFile(id).catch(() => {})
        await destroyScript(id)
      }
      ledger.sources = ledger.sources.filter((item) => !removedIds.includes(item.id))
      await writeLedger(ledger)
      if (enabledIds.some((id) => removedIds.includes(id))) {
        await configuration.setConfigs({ enabledSources: enabledIds.filter((id) => !removedIds.includes(id)) })
      }
      console.log(`Removed ${removedIds.length} remote source(s)`)
    }
    if (keys.includes('enabledSources')) {
      const newEnabledIds = (newConfig.enabledSources as string[] | null) ?? []
      const enabledIds: string[] = []
      for (const script of scripts) {
        if (newEnabledIds.includes(script.id)) {
          enabledIds.push(script.id)
          continue
        }
        await script.destroy().catch(() => {})
      }
      const currentInfos = (await configuration.getConfigs<[LXScriptInfoFull[]]>(['remoteSources']))[0] ?? []
      for (const id of newEnabledIds) {
        if (enabledIds.includes(id)) continue
        const targetInfo = currentInfos.find((info) => info.id === id)
        if (!targetInfo) {
          console.error(`No script info found for id ${id}`)
          continue
        }
        await loadScript(targetInfo)
      }
    }
  })

  // 启动自动更新（autoUpdate && listUrl）
  await scheduleAutoUpdate()
}

initScripts().catch((error) => {
  console.error(t('error.initScriptsFailed', { message: (error as Error).message }))
})

initCommand().catch((error) => {
  console.error(`Failed to initialize commands: ${(error as Error).message}`)
})
