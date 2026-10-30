import kwMusicSearch from './musicSdk/kw/musicSearch'
import kwSongList from './musicSdk/kw/songList'
import kwAlbum from './musicSdk/kw/album'
import kwLeaderboard from './musicSdk/kw/leaderboard'
import kwTipSearch from './musicSdk/kw/tipSearch'
import kwHotSearch from './musicSdk/kw/hotSearch'

import kgMusicSearch from './musicSdk/kg/musicSearch'
import kgSongList from './musicSdk/kg/songList'
import kgLeaderboard from './musicSdk/kg/leaderboard'
import kgTipSearch from './musicSdk/kg/tipSearch'
import kgHotSearch from './musicSdk/kg/hotSearch'

import txMusicSearch from './musicSdk/tx/musicSearch'
import txSongList from './musicSdk/tx/songList'
import txLeaderboard from './musicSdk/tx/leaderboard'
import txTipSearch from './musicSdk/tx/tipSearch'
import txHotSearch from './musicSdk/tx/hotSearch'

import wyMusicSearch from './musicSdk/wy/musicSearch'
import wySongList from './musicSdk/wy/songList'
import wyLeaderboard from './musicSdk/wy/leaderboard'
import wyTipSearch from './musicSdk/wy/tipSearch'
import wyHotSearch from './musicSdk/wy/hotSearch'

import mgMusicSearch from './musicSdk/mg/musicSearch'
import mgSongList from './musicSdk/mg/songList'
import mgLeaderboard from './musicSdk/mg/leaderboard'
import mgTipSearch from './musicSdk/mg/tipSearch'
import mgHotSearch from './musicSdk/mg/hotSearch'

export const sources = {
  kw: {
    musicSearch: kwMusicSearch,
    songList: kwSongList,
    leaderboard: kwLeaderboard,
    tipSearch: kwTipSearch,
    hotSearch: kwHotSearch,
  },
  kg: {
    musicSearch: kgMusicSearch,
    songList: kgSongList,
    leaderboard: kgLeaderboard,
    tipSearch: kgTipSearch,
    hotSearch: kgHotSearch,
  },
  tx: {
    musicSearch: txMusicSearch,
    songList: txSongList,
    leaderboard: txLeaderboard,
    tipSearch: txTipSearch,
    hotSearch: txHotSearch,
  },
  wy: {
    musicSearch: wyMusicSearch,
    songList: wySongList,
    leaderboard: wyLeaderboard,
    tipSearch: wyTipSearch,
    hotSearch: wyHotSearch,
  },
  mg: {
    musicSearch: mgMusicSearch,
    songList: mgSongList,
    leaderboard: mgLeaderboard,
    tipSearch: mgTipSearch,
    hotSearch: mgHotSearch,
  },
} as const

export type SourceId = keyof typeof sources

/**
 * 这些源的榜单详情、歌单详情一次性返回全部歌曲，需要在适配层做分页
 */
export const wholeListSources: Record<string, boolean> = {
  tx: true,
  wy: true,
}
