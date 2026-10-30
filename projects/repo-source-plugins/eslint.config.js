import base from '@any-listen/extension-kit/eslint.config.js'

export default [
  {
    // vendors 为 lx-api-source-loader 原样引入的第三方代码；dist/build 为构建产物，均不做 lint
    ignores: ['src/isolate-preload/vendors/**', 'dist/**', 'build/**'],
  },
  ...base,
]
