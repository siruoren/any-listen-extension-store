import type { ExtensionConfig } from '@any-listen/extension-kit/config'

import pkg from './package.json' with { type: 'json' }

const createSourceResource = (id: string, nameKey: string) => ({
  id,
  name: `{${nameKey}}`,
  resource: [
    'tipSearch',
    'hotSearch',
    'musicSearch',
    'songlistSearch',
    'songlistSorts',
    'songlistTags',
    'songlist',
    'songlistDetail',
    'topSongs',
    'topSongsDetail',
  ],
})

const config: ExtensionConfig = {
  id: 'lx-home',
  name: 'LX Home',
  description: '{description}',
  version: pkg.version,
  homepage: pkg.homepage,
  license: pkg.license,
  author: pkg.author,
  target_engine: '1.3.1',
  categories: [],
  tags: [],
  download_url_template: 'https://github.com/any-listen/any-listen-extension-lx-home/releases/download/v{version}',
  icon: './resources/icon.png',
  grant: ['internet'],
  buildConfig: {
    isIsolateMode: false,
    mainEntry: 'src/main/index.ts',
  },
  contributes: {
    resource: [
      createSourceResource('kw', 'kwName'),
      createSourceResource('kg', 'kgName'),
      createSourceResource('tx', 'txName'),
      createSourceResource('wy', 'wyName'),
      createSourceResource('mg', 'mgName'),
    ],
  },
}

export default config
