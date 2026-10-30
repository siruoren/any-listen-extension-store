import { ipc } from './extensionObject'

let scriptInfo: Omit<LXScriptInfo, 'id'> | null = null

export const setScriptInfo = (info: Omit<LXScriptInfo, 'id'> | null) => {
  scriptInfo = info
}

export const createConsole = () => {
  const buildPrefix = () => {
    return `[${scriptInfo?.name || 'unknown'}]`
  }
  const forward = (method: 'log' | 'error' | 'warn' | 'debug', ...args: unknown[]) => {
    void ipc[method](buildPrefix(), ...args)
  }
  return {
    log: forward.bind(null, 'log'),
    error: forward.bind(null, 'error'),
    warn: forward.bind(null, 'warn'),
    debug: forward.bind(null, 'debug'),
    info: forward.bind(null, 'log'),
    group: forward.bind(null, 'log'),
    groupEnd: forward.bind(null, 'log'),
    groupCollapsed: forward.bind(null, 'log'),
    time: forward.bind(null, 'log'),
    timeEnd: forward.bind(null, 'log'),
    trace: forward.bind(null, 'log'),
    clear: () => {},
  }
}
