import { command } from './shared/hostAPI'
import { removeAllSources, updateSources } from './remoteSource'

export const initCommand = async () => {
  await Promise.all([
    command.registerCommand('updateSources', async () => updateSources('manual')),
    command.registerCommand('removeAllSources', removeAllSources),
  ])
}
