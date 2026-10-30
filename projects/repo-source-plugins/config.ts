import type { ExtensionConfig } from '@any-listen/extension-kit/config'

import pkg from './package.json' with { type: 'json' }

const config: ExtensionConfig = {
  id: 'repo-source-plugins',
  name: 'LX Music Remote Sources Loader',
  description: '{description}',
  version: pkg.version,
  homepage: pkg.homepage,
  license: pkg.license,
  author: pkg.author,
  target_engine: '1.3.1',
  categories: [],
  tags: [],
  download_url_template: 'https://github.com/any-listen/any-listen-extension-store/releases/download/v{version}',
  icon: './resources/icon.png',
  grant: ['internet', 'isolate_context'],
  contributes: {
    settings: [
      {
        field: 'listUrl',
        name: '{settings.listUrl}',
        description: '{settings.listUrlDescription}',
        type: 'input',
        textarea: true,
        default: '',
      },
      {
        field: 'autoUpdate',
        name: '{settings.autoUpdate}',
        description: '{settings.autoUpdateDescription}',
        type: 'boolean',
        default: true,
      },
      {
        field: 'enabledSources',
        name: '{settings.enabledSources}',
        description: '{settings.enabledSourcesDescription}',
        type: 'configCheckboxMultiple',
        enumConfigFiled: 'remoteSources',
        enumFiled: 'id',
        enumNameFiled: 'name',
        enumDescriptionFiled: 'fileDesc',
        removeable: true,
        actionCommands: ['updateSources', 'removeAllSources'],
        actionCommandNames: ['{settings.updateSources}', '{command.removeAllSourcesName}'],
      },
    ],
    resource: [
      {
        id: 'kw',
        name: '{kwName}',
        resource: ['musicUrl'],
      },
      {
        id: 'tx',
        name: '{txName}',
        resource: ['musicUrl'],
      },
      {
        id: 'wy',
        name: '{wyName}',
        resource: ['musicUrl'],
      },
      {
        id: 'kg',
        name: '{kgName}',
        resource: ['musicUrl'],
      },
      {
        id: 'mg',
        name: '{mgName}',
        resource: ['musicUrl'],
      },
    ],
    commands: [
      {
        command: 'updateSources',
        name: '{command.updateSourcesName}',
        description: '{command.updateSourcesDescription}',
      },
      {
        command: 'removeAllSources',
        name: '{command.removeAllSourcesName}',
        description: '{command.removeAllSourcesDescription}',
      },
    ],
  },
  buildConfig: {
    isIsolateMode: true,
  },
}

export default config
