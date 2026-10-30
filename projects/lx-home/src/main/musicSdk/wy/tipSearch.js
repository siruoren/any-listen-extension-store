import { httpFetch } from '../request'
import { weapi } from './utils/crypto'
import { formatSingerName } from '../utils'

export default {
  requestObj: null,
  cancelTipSearch() {
    if (this.requestObj && this.requestObj.cancelHttp) this.requestObj.cancelHttp()
  },
  tipSearchBySong(str) {
    this.cancelTipSearch()
    this.requestObj = httpFetch('https://music.163.com/weapi/search/suggest/web', {
      method: 'POST',
      headers: {
        referer: 'https://music.163.com/',
        origin: 'https://music.163.com/',
      },
      form: weapi({
        s: str,
      }),
    })
    return this.requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode != 200 || body.code != 200) return Promise.reject(new Error('请求失败'))
      // 未登录/无 cookie 时接口可能返回空 result，降级为无建议
      return body.result.songs ?? []
    })
  },
  handleResult(rawData) {
    return rawData.map(info => `${info.name} - ${formatSingerName(info.artists, 'name')}`)
  },
  async search(str) {
    return this.tipSearchBySong(str).then(result => this.handleResult(result))
  },
}
