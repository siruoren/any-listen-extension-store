import { httpFetch } from '../request'

export default {
  requestObj: null,
  cancelTipSearch() {
    if (this.requestObj && this.requestObj.cancelHttp) this.requestObj.cancelHttp()
  },
  tipSearchBySong(str) {
    this.cancelTipSearch()
    this.requestObj = httpFetch(`https://music.migu.cn/v3/api/search/suggest?keyword=${encodeURIComponent(str)}`, {
      headers: {
        referer: 'https://music.migu.cn/v3',
      },
    })
    return this.requestObj.promise.then(({ statusCode, body }) => {
      // 该接口已不稳定（可能返回 HTML 页面），非 JSON 时降级为无建议
      if (statusCode != 200 || !body || typeof body !== 'object') return []
      return body.songs ?? []
    })
  },
  handleResult(rawData) {
    return rawData.map(info => `${info.name} - ${info.singerName}`)
  },
  async search(str) {
    return this.tipSearchBySong(str).then(result => this.handleResult(result))
  },
}
